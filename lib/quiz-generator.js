/**
 * lib/quiz-generator.js
 *
 * Geração de questões de simulado e feedback de tutor, via IA.
 *
 * Reaproveita `generateWithFallback` de lib/article-generator.js, mas com
 * uma ordem de providers PRÓPRIA: OpenRouter → Gemini, SEM Groq.
 *
 * Por quê: Groq tem rate limit compartilhado no tier grátis, e a geração
 * de artigos (scripts/generate-article.js, via GitHub Actions) já consome
 * boa parte dessa cota. Se o simulado (questões + feedback do tutor, que
 * roda a cada interação de usuário em produção, não 1x/dia como os posts)
 * também chamasse o Groq, ele virava o gargalo e passava a derrubar a
 * geração de posts por falta de cota. Por isso o simulado usa só
 * OpenRouter (1ª opção) e Gemini (fallback) — Groq fica reservado 100%
 * para gerar post.
 *
 * Configuração: as mesmas chaves de .env.local / Vercel já usadas pelo
 * restante do projeto (OPENROUTER_API_KEY, GEMINI_API_KEY) — nenhuma
 * variável nova é necessária.
 *
 * Filosofia de falha (igual ao resto do projeto): nunca derruba a
 * experiência do usuário. Se a IA falhar ou devolver algo inválido,
 * quem chama este módulo (as rotas em app/api/simulado/*) cai de volta
 * pro banco estático (lib/quiz-bank.js) ou simplesmente esconde o card
 * de feedback — o simulado continua funcionando de ponta a ponta.
 */

const { generateWithFallback } = require("./article-generator.js");
const qe = require("./quality-engine.js");

// Ordem de providers exclusiva do simulado — Groq nunca entra aqui (ver
// comentário no topo do arquivo).
const SIMULADO_PROVIDER_ORDER = ["OpenRouter", "Gemini"];

// ─── Prompt de geração de questões ─────────────────────────────────────
function buildQuizPrompt({ banca, materia, quantidade }) {
  return `Você é um especialista em bancas examinadoras de concursos públicos brasileiros, com profundo conhecimento do estilo de prova da banca ${banca}.

Gere ${quantidade} questões de múltipla escolha INÉDITAS sobre a matéria "${materia}", no nível de exigência e estilo típico da banca ${banca}, para concursos públicos no Brasil.

REGRAS OBRIGATÓRIAS:
- Cada questão deve ter EXATAMENTE 4 alternativas plausíveis (nunca use "todas as anteriores" ou "nenhuma das anteriores")
- Apenas 1 alternativa correta por questão; as 3 incorretas devem ser plausíveis, não absurdas
- "gabarito" é o índice (0 a 3) da alternativa correta, sendo 0 a primeira alternativa do array
- Inclua uma explicação didática de no mínimo 2 frases, citando o fundamento quando aplicável (lei, artigo, regra gramatical, fórmula, teorema)
- Varie o nível de dificuldade: misture questões fáceis, médias e difíceis
- Não repita o mesmo enunciado, a mesma pegadinha ou o mesmo exemplo em questões diferentes
- Português brasileiro formal, no estilo de provas reais de concurso
- "cargo" deve ser um cargo público real e compatível com a matéria (ex.: "Analista Judiciário", "Técnico do INSS")

FORMATO DE SAÍDA — RETORNE APENAS UM ARRAY JSON VÁLIDO, SEM TEXTO ANTES OU DEPOIS, SEM MARKDOWN, NO FORMATO EXATO:
[
  {
    "cargo": "string",
    "enunciado": "string com o texto completo da questão",
    "alternativas": ["string", "string", "string", "string"],
    "gabarito": 0,
    "explicacao": "string explicando por que a alternativa correta está certa"
  }
]`;
}

// ─── Parser defensivo do JSON retornado pela IA ────────────────────────
// Por quê isso existe: modelos via Groq/OpenRouter/Gemini às vezes (a) embrulham
// a resposta em ```json, (b) deixam vazar tags de raciocínio (<think>), ou
// (c) truncam o último objeto do array por limite de tokens quando quantidade
// é alta. Em vez de um único JSON.parse (que falha por completo nesses casos),
// este parser varre o texto manualmente, extrai cada objeto `{...}` de nível
// superior (contando chaves e ignorando o que está dentro de strings) e faz
// o parse individual — um objeto truncado no final é simplesmente descartado,
// mas todos os anteriores, já completos, são aproveitados.
function extractQuestionObjects(rawText) {
  const text = qe
    .stripReasoningLeakage(rawText || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "");

  const arrayStart = text.indexOf("[");
  if (arrayStart === -1) return [];

  const objects = [];
  let i = arrayStart;
  const len = text.length;

  while (i < len) {
    while (i < len && text[i] !== "{") i++;
    if (i >= len) break;

    const objStart = i;
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let closed = false;

    for (; i < len; i++) {
      const ch = text[i];
      if (escapeNext) { escapeNext = false; continue; }
      if (ch === "\\") { escapeNext = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;

      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          const objText = text.slice(objStart, i + 1);
          try {
            objects.push(JSON.parse(objText));
          } catch {
            // objeto malformado — ignora e segue para o próximo
          }
          i++;
          closed = true;
          break;
        }
      }
    }

    if (!closed) break; // chegou ao fim do texto no meio de um objeto (truncamento) — encerra
  }

  return objects;
}

function validateQuestion(q) {
  if (!q || typeof q !== "object") return false;
  if (typeof q.enunciado !== "string" || q.enunciado.trim().length < 15) return false;
  if (!Array.isArray(q.alternativas) || q.alternativas.length !== 4) return false;
  if (q.alternativas.some((a) => typeof a !== "string" || !a.trim())) return false;
  if (!Number.isInteger(q.gabarito) || q.gabarito < 0 || q.gabarito > 3) return false;
  if (typeof q.explicacao !== "string" || q.explicacao.trim().length < 15) return false;

  // alternativas duplicadas são sinal de questão malformada
  const uniq = new Set(q.alternativas.map((a) => a.trim().toLowerCase()));
  if (uniq.size < 4) return false;

  return true;
}

/**
 * Gera questões via IA para uma combinação banca/matéria.
 *
 * @param {object} params
 * @param {string} params.banca
 * @param {string} params.materia
 * @param {number} [params.quantidade=10]
 * @returns {Promise<{questions: object[], provider: string, parsed: number}>}
 * @throws se todos os provedores de IA falharem (quem chama deve tratar e cair no fallback)
 */
async function generateQuizWithAI({ banca, materia, quantidade = 10 }) {
  const prompt = buildQuizPrompt({ banca, materia, quantidade });
  const { text, provider } = await generateWithFallback(prompt, SIMULADO_PROVIDER_ORDER);

  const rawObjects = extractQuestionObjects(text);
  const valid = rawObjects.filter(validateQuestion).map((q, i) => ({
    id: `ai-${Date.now()}-${i}`,
    ano: new Date().getFullYear(),
    cargo: (q.cargo && String(q.cargo).trim()) || `${banca} · ${materia}`,
    enunciado: q.enunciado.trim(),
    alternativas: q.alternativas.map((a) => String(a).trim()),
    gabarito: q.gabarito,
    explicacao: q.explicacao.trim(),
  }));

  return { questions: valid.slice(0, quantidade), provider, parsed: rawObjects.length };
}

// ─── Prompt do tutor de IA (feedback pós-simulado) ─────────────────────
function formatErrors(erros = []) {
  if (!erros.length) return "Nenhum erro — o aluno gabaritou a prova!";
  return erros
    .map(
      (e, i) =>
        `${i + 1}. Questão sobre "${e.enunciado}"\n   Resposta do aluno: "${e.respostaAluno}"\n   Resposta correta: "${e.respostaCorreta}"`
    )
    .join("\n");
}

function buildTutorPrompt({ nome, banca, materia, score, total, pct, avgTime, maxStreak, erros }) {
  return `Você é um tutor de IA especialista em preparação para concursos públicos no Brasil. Seu tom é encorajador, direto e prático — como um mentor experiente que já ajudou centenas de candidatos a serem aprovados.

O aluno${nome ? ` "${nome}"` : ""} terminou agora um simulado de "${materia}" (estilo banca ${banca}) com o seguinte resultado:
- Acertos: ${score} de ${total} (${pct}%)
- Tempo médio por questão: ${avgTime}s
- Maior sequência de acertos consecutivos: ${maxStreak}

Questões erradas pelo aluno:
${formatErrors(erros)}

Escreva um feedback personalizado e ESPECÍFICO (nunca genérico) em português brasileiro, com no máximo 200 palavras, em parágrafos corridos (SEM markdown — sem #, sem **, sem listas com "-" ou números), cobrindo:
1) Uma avaliação honesta e direta do desempenho;
2) Os padrões de erro identificados nos temas das questões erradas acima (ou, se não houve erro, como manter a consistência);
3) Um plano de ação com 2 a 3 passos práticos e específicos para a próxima semana de estudo;
4) Uma frase final curta de incentivo.

PROIBIDO usar frases de preenchimento como "é importante destacar que", "vale ressaltar que", "nos dias atuais". Cite os temas reais das questões erradas, não fale em termos vagos.

RETORNE APENAS O TEXTO DO FEEDBACK, SEM TÍTULO E SEM SAUDAÇÃO INICIAL TIPO "OLÁ" OU "PARABÉNS".`;
}

function cleanTutorText(text = "") {
  return qe
    .stripReasoningLeakage(text)
    .replace(/[*_#`]/g, "")
    .replace(/^(feedback|olá|oi|parabéns)[:\-,!]?\s*/i, "")
    .trim();
}

/**
 * Gera o feedback do tutor de IA com base no resultado do simulado.
 * Nunca lança erro: se algo falhar, retorna null (quem chama exibe um
 * fallback genérico em vez do feedback personalizado).
 *
 * @returns {Promise<string|null>}
 */
async function generateTutorFeedback(payload) {
  try {
    const prompt = buildTutorPrompt(payload);
    const { text } = await generateWithFallback(prompt, SIMULADO_PROVIDER_ORDER);
    const clean = cleanTutorText(text);
    if (!clean || clean.length < 40) return null;
    return clean;
  } catch {
    return null;
  }
}

module.exports = {
  buildQuizPrompt,
  extractQuestionObjects,
  validateQuestion,
  generateQuizWithAI,
  buildTutorPrompt,
  generateTutorFeedback,
};
