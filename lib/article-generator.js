/**
 * lib/article-generator.js
 *
 * Núcleo de geração de artigos, extraído de scripts/generate-article.js.
 *
 * Por quê esse arquivo existe:
 *  - scripts/generate-article.js é um CLI (lê argv, chama process.exit, escreve
 *    direto em posts/*.md no disco). Isso funciona em VPS/local/GitHub Actions,
 *    mas NÃO funciona dentro de uma function serverless da Vercel:
 *      1. child_process.exec("node scripts/...") não acha o arquivo em /var/task
 *      2. mesmo chamando a função direto (sem exec), o filesystem da Vercel é
 *         read-only em produção — fs.writeFileSync falharia ou, na melhor das
 *         hipóteses, escreveria em /tmp e se perderia no próximo cold start.
 *
 * Este módulo contém SÓ a parte que não depende de disco: montar o prompt,
 * chamar os providers de IA com fallback, e validar a qualidade do resultado.
 * Quem decide ONDE persistir o resultado é o caller:
 *   - scripts/generate-article.js (CLI)        → grava em posts/*.md localmente
 *   - app/api/admin/quality/route.js (serverless) → commita via GitHub API
 */

const qe = require("./quality-engine.js");

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 80);
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function escapeForYaml(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ─── Prompt ───────────────────────────────────────────────────────────
function buildPrompt({ topic, generation, previousContent }, retryHint) {
  const { tone, audienceLevel, minWords } = generation || {};
  const referenceDate = todayISO();

  // Quando é uma REGENERAÇÃO (post já existe, foi marcado como raso/genérico),
  // o tópico sozinho não basta como instrução: enviar o mesmo "topic" de antes
  // pro modelo, sem mais contexto, tende a produzir um texto quase idêntico ao
  // anterior — o modelo não tem como saber que precisa ser diferente do que já
  // existe. Por isso, quando há previousContent, ele entra no prompt como
  // referência explícita do que JÁ FOI publicado e NÃO deve ser repetido.
  const antiRepeticaoBlock = previousContent
    ? `
ATENÇÃO — ISTO É UMA REGENERAÇÃO, NÃO UM ARTIGO NOVO:
O texto abaixo já foi publicado sobre este mesmo tema e foi marcado como
raso/genérico/repetitivo. Sua tarefa é escrever uma versão SUBSTANCIALMENTE
DIFERENTE — não apenas reescrever as mesmas frases com outras palavras.

VERSÃO ANTERIOR (NÃO REPITA esta estrutura, estes exemplos, nem este ângulo):
"""
${previousContent.slice(0, 3000)}
"""

Para ser de fato diferente:
- Escolha um ÂNGULO distinto (ex.: se a versão anterior era um guia geral,
  foque em um caso específico, uma comparação, ou um erro comum)
- Use exemplos, órgãos, bancas ou dados DIFERENTES dos citados acima
- Reorganize a estrutura das seções — não siga a mesma ordem de tópicos
`
    : "";

  return `
Você é um especialista em concursos públicos no Brasil.

Data de referência atual: ${referenceDate}
Tema principal: "${topic}"
${antiRepeticaoBlock}
REGRAS DE PROFUNDIDADE E ATUALIDADE (obrigatório, evite conteúdo raso/genérico):
- Mínimo de ${minWords || 900} palavras
- Escreva com profundidade, contexto atual e utilidade prática para a data de referência
- Se o tema depender de regras, prazos, mudanças de edital, bancas, órgãos ou índices, contextualize isso com a data atual e evite informações obsoletas
- Cite pelo menos 3 exemplos concretos (nomes de órgãos, bancas, provas, números reais, percentuais, valores, quantidade de vagas, prazos)
- Inclua ao menos 1 seção com comparação, 1 com erro comum ou armadilha, e 1 com checklist/passos práticos, quando fizer sentido
- Cada seção precisa ensinar algo aplicável, não só afirmar o óbvio
- PROIBIDO frases de preenchimento como "é importante destacar que", "vale ressaltar que",
  "nos dias atuais", "podemos concluir que"

REGRAS DE FORMATO:
- Tom: ${tone || "didático, objetivo e atualizado"}
- Público: ${audienceLevel || "candidatos de concursos públicos"}
- Markdown válido
- Estrutura com introdução, desenvolvimento (use ## para subtítulos) e conclusão
- Título do artigo na primeira linha, começando com "#", em Capitalização de Título
  (primeira letra de cada palavra principal maiúscula; siglas como INSS, STF, CNH sempre maiúsculas)
- Não escreva um texto superficial de 3-4 parágrafos; a resposta deve ter profundidade real, com seções úteis, exemplos e orientação prática

${retryHint ? `\nATENÇÃO: a versão anterior foi rejeitada por: ${retryHint}. Corrija isso agora.\n` : ""}

RETORNE APENAS O CONTEÚDO EM MARKDOWN.
`;
}

// ─── Prompt da curiosidade (card "💡 Curiosidade") ─────────────────────
// Por quê isso existe: a imagem hero era gerada via Picsum com seed do slug,
// ou seja, uma foto aleatória sem nenhuma relação com o artigo. Sem orçamento
// para Pexels/Unsplash/Pixabay API, e sem um banco de imagens viável que
// escale para qualquer tema gerado automaticamente, a curiosidade textual
// (gerada 1x no momento da criação/regeneração, não em runtime) é a forma
// mais confiável de agregar valor no espaço onde a imagem estava.
function buildCuriosityPrompt(body) {
  const excerptOfBody = (body || "").slice(0, 12000);

  return `Você vai ler um artigo completo sobre concursos públicos no Brasil. Sua tarefa é produzir APENAS UMA curiosidade verdadeira e pouco conhecida, diretamente relacionada ao tema central do artigo abaixo. Não invente fatos, dados ou números — use apenas o que for de conhecimento geral e verificável sobre o assunto. Não repita frases, exemplos ou dados já citados literalmente no texto. Escreva entre 40 e 80 palavras, em português brasileiro, tom educativo e envolvente, em um único parágrafo corrido. Não use markdown, não use listas, não use aspas, não use títulos. Retorne apenas o texto da curiosidade, nada mais.

Artigo:
"""
${excerptOfBody}
"""`;
}

// Limpeza defensiva da resposta da IA: remove markdown residual, aspas,
// quebras de linha extras e qualquer preâmbulo tipo "Curiosidade:" que o
// modelo às vezes insere mesmo sendo instruído a não fazer isso.
function cleanCuriosityText(text = "") {
  return qe
    .stripReasoningLeakage(text)
    .replace(/^(curiosidade|você sabia)[:\-—]?\s*/i, "")
    .replace(/[*_#`]/g, "")
    .replace(/^["“]|["”]$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Gera a curiosidade de um artigo já validado. Roda 1x por criação/
 * regeneração (nunca em runtime/por visita), usando a mesma cadeia de
 * fallback (Groq → OpenRouter → Gemini) já usada para o artigo.
 *
 * Falha de forma "silenciosa": se nenhum provider responder ou o texto
 * vier fora do esperado, retorna null em vez de derrubar a geração do
 * artigo inteiro — o card de curiosidade simplesmente não aparece nesse
 * post (mesmo padrão de degradação do AffiliateBox).
 *
 * @param {string} body - corpo (markdown) do artigo já gerado
 * @returns {Promise<string|null>}
 */
async function generateCuriosity(body) {
  if (!body || body.trim().length < 50) return null;

  try {
    const prompt = buildCuriosityPrompt(body);
    const { text } = await generateWithFallback(prompt);
    const clean = cleanCuriosityText(text);

    const wordCount = qe.countWords(clean);
    if (!clean || wordCount < 15) return null; // resposta vazia ou inútil

    if (wordCount <= 90) return clean;

    // Resposta passou do limite: corta na última frase completa que ainda
    // cabe, em vez de truncar no meio de uma palavra/frase.
    const sentences = clean.split(/(?<=[.!?])\s+/);
    let acc = "";
    for (const s of sentences) {
      const candidate = (acc ? acc + " " : "") + s;
      if (qe.countWords(candidate) > 85) break;
      acc = candidate;
    }
    return acc || clean.split(/\s+/).slice(0, 80).join(" ") + "...";
  } catch {
    return null; // mesma filosofia: curiosidade é um extra, nunca bloqueia o post
  }
}

// ─── Providers ────────────────────────────────────────────────────────
async function callGrokModel(prompt, model) {
  const key = process.env.GROK_API_KEY?.trim();
  if (!key) throw new Error("GROK_API_KEY ausente");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`Grok(${model}) HTTP ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Grok(${model}) retornou vazio`);
  return content;
}

async function callGrok(prompt) {
  const models = ["grok-4-0709", "grok-3-mini-fast", "grok-3-fast-beta"];
  let lastErr;
  for (const model of models) {
    try {
      return await callGrokModel(prompt, model);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// Modelos com suas respectivas configs — cada modelo na Groq aceita um
// conjunto de parâmetros ligeiramente diferente:
//  - openai/gpt-oss-120b: usa `max_completion_tokens` (não `max_tokens`) e
//    aceita `reasoning_effort` (low/medium/high) pra controlar o quanto o
//    modelo "pensa" antes de responder — "medium" é um bom equilíbrio
//    entre qualidade e velocidade/custo pra gerar artigo inteiro.
//  - llama-3.3-70b-versatile: modelo mais simples, sem reasoning_effort,
//    usa o `max_tokens` tradicional. Fica como fallback se o gpt-oss-120b
//    falhar ou estourar rate limit.
const GROQ_MODELS = [
  {
    model: "openai/gpt-oss-120b",
    params: {
      temperature: 1,
      max_completion_tokens: 8192,
      top_p: 1,
      reasoning_effort: "medium",
    },
  },
  {
    model: "llama-3.3-70b-versatile",
    params: {
      temperature: 0.7,
      max_tokens: 4096,
    },
  },
];

async function callGroqModel(prompt, model, extraParams = {}) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_API_KEY ausente");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      ...extraParams,
    }),
  });

  if (!res.ok) throw new Error(`Groq(${model}) HTTP ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Groq(${model}) retornou vazio`);
  return content;
}

async function callGroq(prompt) {
  let lastErr;
  for (const { model, params } of GROQ_MODELS) {
    try {
      return await callGroqModel(prompt, model, params);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("OPENROUTER_API_KEY ausente");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost",
      "X-Title": "generator",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY ausente");

  const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {}
  }
  throw new Error("Gemini falhou em todos os modelos");
}

// Mapa de todos os providers disponíveis. A ORDEM padrão (Grok primeiro)
// é a usada pela geração de artigos e também pelo editor manual do admin,
// já que o Grok é o provedor configurado para esse fluxo.
//
// Quem chama com necessidades diferentes (ex.: lib/quiz-generator.js, que
// não pode competir pelo rate limit do Groq reservado para posts) passa um
// `providerOrder` próprio — ver 2º parâmetro abaixo. Grok nem precisa estar
// na lista: omitir o nome equivale a nunca chamá-lo.
const ALL_PROVIDERS = {
  Grok: callGrok,
  Groq: callGroq,
  OpenRouter: callOpenRouter,
  Gemini: callGemini,
};

async function generateWithFallback(prompt, providerOrder = ["Grok", "Groq", "OpenRouter", "Gemini"]) {
  const providers = providerOrder
    .filter((name) => typeof ALL_PROVIDERS[name] === "function")
    .map((name) => ({ name, fn: ALL_PROVIDERS[name] }));

  const errors = [];
  for (const p of providers) {
    try {
      const text = await p.fn(prompt);
      return { text, provider: p.name };
    } catch (err) {
      errors.push(`${p.name}: ${err.message}`);
    }
  }
  throw new Error(`Todos os provedores falharam — ${errors.join(" | ")}`);
}

// ─── Markdown ─────────────────────────────────────────────────────────
function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function cleanMarkdown(text = "") {
  const noReasoning = qe.stripReasoningLeakage(text);
  return noReasoning
    .replace(/^[=\-]{3,}$/gm, "")
    .replace(/^#\s+.+\n?/gm, "")
    .trim();
}

/**
 * Gera e valida um artigo (com retries por qualidade), inteiramente em memória.
 *
 * @param {object} params
 * @param {string} params.topic
 * @param {string} params.category
 * @param {object} params.generation - bloco siteConfig.generation (tone, minWords, etc)
 * @param {string[]} params.existingSignatures - assinaturas (arrays de palavras) de posts já publicados, para checar similaridade
 * @param {string} [params.previousContent] - conteúdo do post ATUAL, quando esta chamada é uma
 *   regeneração (não um post novo). Entra no prompt como referência do que NÃO repetir, e também
 *   é comparado diretamente por similaridade — sem isso, regenerar tende a produzir um texto quase
 *   idêntico ao original, já que o "topic" enviado é o mesmo título de antes.
 * @param {number} [params.maxRetries=2]
 * @returns {Promise<{title, body, provider, wordCount, fillerCount, maxSim, mostSimilarSlug, issues}>}
 */
async function generateValidatedArticle({ topic, category, generation, existingSignatures = [], previousContent = null, maxRetries = 2 }) {
  let retryHint = null;
  let lastAttempt = null;

  // previousContent vem como o .md completo (frontmatter + corpo). Extrai só o
  // corpo: a assinatura de similaridade e o trecho mostrado no prompt devem
  // refletir o CONTEÚDO do artigo, não o YAML (title/date/category/excerpt).
  const previousBody = previousContent ? (qe.splitFrontmatterAndBody(previousContent)?.body || previousContent) : null;
  const previousSignature = previousBody ? qe.getSignature(previousBody) : null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const prompt = buildPrompt({ topic, generation, previousContent: previousBody }, retryHint);
    const { text, provider } = await generateWithFallback(prompt);

    const title = extractTitle(text) || topic;
    const body = cleanMarkdown(text);

    const minWords = generation?.minWords || 1200;
    const wordCount = qe.countWords(body);
    const fillerCount = qe.countFillerPhrases(body);

    const newSig = qe.getSignature(body);
    let maxSim = 0;
    let mostSimilarSlug = null;
    for (const entry of existingSignatures) {
      const sim = qe.jaccardSimilarity(newSig, entry.words);
      if (sim > maxSim) {
        maxSim = sim;
        mostSimilarSlug = entry.slug;
      }
    }

    // Checagem específica contra a versão anterior deste mesmo post (regeneração).
    // Limiar mais estrito (0.45) que o usado entre posts diferentes (0.55), porque
    // aqui o objetivo explícito é ser diferente do que já existe, não só evitar
    // duplicar outro artigo do site.
    let simVsPrevious = 0;
    if (previousSignature) {
      simVsPrevious = qe.jaccardSimilarity(newSig, previousSignature);
      if (simVsPrevious > maxSim) {
        maxSim = simVsPrevious;
        mostSimilarSlug = "a versão anterior deste post";
      }
    }

    const issues = [];
    if (wordCount < minWords * 0.8) issues.push(`abaixo do mínimo de palavras (${wordCount}/${minWords})`);
    if (fillerCount >= 3) issues.push(`muitas frases genéricas (${fillerCount})`);
    if (previousSignature && simVsPrevious > 0.45) {
      issues.push(`ficou muito parecido com a versão anterior (${(simVsPrevious * 100).toFixed(0)}% similar) — mude o ângulo e os exemplos`);
    } else if (maxSim > 0.55) {
      issues.push(`muito parecido com "${mostSimilarSlug}" (${(maxSim * 100).toFixed(0)}%)`);
    }

    lastAttempt = { title, body, provider, wordCount, fillerCount, maxSim, mostSimilarSlug, issues, signature: newSig };

    if (issues.length === 0) return lastAttempt;

    retryHint = issues.join("; ");
  }

  return lastAttempt;
}

/**
 * Monta o markdown final (frontmatter + corpo) pronto para salvar/commitar.
 */
function buildArticleFile({ title, body, topic, category, forceFile, existingFrontmatter, curiosity, coverImage }) {
  const normalizedTitle = qe.toTitleCase(title || topic);
  const excerpt = qe.buildSafeExcerpt(body);

  let file, date, slug, finalCategory;

  if (forceFile) {
    file = forceFile;
    date = existingFrontmatter?.date || todayISO();
    finalCategory = existingFrontmatter?.category || category;
    slug = qe.slugFromFileName(forceFile);
  } else {
    date = todayISO();
    slug = slugify(normalizedTitle);
    file = `${date}-${slug}.md`;
    finalCategory = category;
  }

  // Se a geração da curiosidade falhou nesta chamada (ex.: regeneração em
  // que todos os providers ficaram indisponíveis), preserva a curiosidade
  // anterior do post em vez de simplesmente apagar o card no site.
  const finalCuriosity = curiosity || existingFrontmatter?.curiosity || null;

  const finalCoverImage = coverImage || null;

  const frontmatter = `---
title: "${escapeForYaml(normalizedTitle)}"
date: "${date}"
category: "${escapeForYaml(finalCategory)}"
excerpt: "${escapeForYaml(excerpt)}"${finalCuriosity ? `\ncuriosity: "${escapeForYaml(finalCuriosity)}"` : ""}${finalCoverImage ? `\ncoverImage: "${escapeForYaml(finalCoverImage)}"` : ""}
---

`;

  return { file, slug, date, category: finalCategory, content: frontmatter + body, normalizedTitle };
}

module.exports = {
  randomItem,
  slugify,
  todayISO,
  buildPrompt,
  buildCuriosityPrompt,
  generateCuriosity,
  generateWithFallback,
  generateValidatedArticle,
  buildArticleFile,
  extractTitle,
  cleanMarkdown,
};
