#!/usr/bin/env node
/**
 * generate-article.js
 * Gera artigos com frontmatter completo + fallback:
 *   Groq (gpt-oss-120b → llama-3.3-70b-versatile) → OpenRouter → Gemini
 *
 * A lógica de geração (prompt, providers, validação de qualidade) vive em
 * lib/article-generator.js e é compartilhada com app/api/admin/quality/route.js
 * (que usa o mesmo núcleo, mas persiste via GitHub API em vez de fs, porque
 * roda dentro de uma function serverless da Vercel).
 *
 * Este script é o "modo CLI": roda em VPS/local/GitHub Actions, escreve
 * direto em posts/*.md e faz commit/push pelo próprio workflow do GitHub Actions.
 *
 *  - Título sempre em Title Case (siglas tipo INSS preservadas)
 *  - Excerpt nunca corta no meio da palavra/frase
 *  - Não repete tópicos recentes nem gera conteúdo quase-idêntico a posts existentes
 *  - Valida qualidade (tamanho, frases genéricas, similaridade) e tenta de novo se reprovar
 *  - Loga cada geração em .quality-log.json (lido pelo painel admin)
 *  - Suporta --force-file <nome.md> pra regenerar o conteúdo de um post já publicado
 */

require("dotenv").config({ path: ".env.local", override: false });

const fs = require("fs");
const path = require("path");
const qe = require("../lib/quality-engine.js");
const ag = require("../lib/article-generator.js");

// ─────────────────────────────────────────────
// SAFE CONFIG LOADER (mantido do original)
// ─────────────────────────────────────────────
let siteConfigRaw = require("../site.config.js");
const siteConfig = siteConfigRaw?.default || siteConfigRaw || {};
const generation = siteConfig?.generation || {};

const CATEGORIES = generation.categories || [
  "Editais",
  "Técnicas de Estudo",
  "Concursos Abertos",
  "Materiais Gratuitos",
  "Cronograma de Estudos",
  "Carreiras Públicas",
  "Questões Comentadas",
];

// ─── CLI ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;

const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1], 10)
  : (generation.articlesPerRun || 1);

// regenera o conteúdo de um post já publicado, mantendo filename/data/categoria
const forceFileArg = args.includes("--force-file")
  ? args[args.indexOf("--force-file") + 1]
  : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Paths ────────────────────────────────────────────────────────────
const postsDir = path.resolve(__dirname, "../posts");
const usedTopicsLogPath = path.resolve(__dirname, "../.used-topics.json");
const signaturesLogPath = path.resolve(__dirname, "../.content-signatures.json");
const qualityLogPath = path.resolve(__dirname, "../.quality-log.json");

// ─── Helpers ──────────────────────────────────────────────────────────
function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(filePath, data, keepLast = 400) {
  const arr = Array.isArray(data) ? data.slice(-keepLast) : data;
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), "utf8");
}

function getExistingSlugs() {
  if (!fs.existsSync(postsDir)) return new Set();
  return new Set(
    fs.readdirSync(postsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => qe.slugFromFileName(f))
  );
}

function appendQualityLog(entry) {
  const log = loadJson(qualityLogPath, []);
  log.push({ timestamp: new Date().toISOString(), ...entry });
  saveJson(qualityLogPath, log);
}

function saveSignature(slug, words) {
  const signatures = loadJson(signaturesLogPath, []);
  signatures.push({ slug, words });
  saveJson(signaturesLogPath, signatures);
}

function getExistingSignatures() {
  return loadJson(signaturesLogPath, []);
}

// ─── Tópicos ──────────────────────────────────────────────────────────
// Pool grande de propósito: com poucos seeds por categoria, o pipeline
// esgota o pool rapidamente e cai no fallback de "variação" (que só anexa
// um sufixo genérico tipo "guia atualizado" a um tópico já publicado —
// isso gera títulos quase idênticos e foi a causa dos posts duplicados
// detectados em 2026-06). Cada categoria deve ter MUITO mais seeds do que
// o número de posts que você pretende publicar nela.
const SEEDS = {
  "Editais": [
    "como interpretar um edital de concurso público",
    "o que verificar antes de se inscrever em um edital",
    "diferenças entre editais estaduais e federais",
    "principais erros ao ler um edital de concurso",
    "glossário de termos comuns em editais públicos",
    "como funciona o cronograma de um edital, do lançamento à posse",
    "o que é cargo, função e atribuição dentro de um edital",
    "como identificar pegadinhas e cláusulas de barreira em editais",
    "o que fazer quando o edital é suspenso ou tem o prazo prorrogado",
    "como entender a tabela de cargos, vagas e remuneração de um edital",
    "diferença entre edital de abertura e edital de convocação",
    "o que verificar nas regras de isenção da taxa de inscrição",
  ],
  "Técnicas de Estudo": [
    "método pomodoro para concursos públicos",
    "como fazer resumos eficientes para concursos",
    "revisão espaçada para memorizar legislação",
    "como manter o foco nos estudos para concurso",
    "técnicas de leitura ativa para concurseiros",
    "como usar mapas mentais para fixar matérias de concurso",
    "técnica de recordação ativa aplicada a questões de concurso",
    "como estudar legislação seca sem decorar artigo por artigo",
    "como criar flashcards eficientes para concursos",
    "como estudar com pouco tempo livre por dia",
    "técnica Feynman aplicada ao estudo para concursos",
  ],
  "Concursos Abertos": [
    "concursos públicos com mais vagas para nível médio",
    "concursos federais abertos com inscrições em 2026",
    "melhores concursos para iniciantes em 2026",
    "concursos da área de saúde com inscrições abertas",
    "concursos municipais com inscrições abertas em 2026",
    "concursos com menor concorrência para começar a carreira pública",
    "concursos com salário inicial acima de R$ 5 mil em 2026",
    "concursos para quem não tem ensino superior completo",
  ],
  "Materiais Gratuitos": [
    "melhores apostilas gratuitas para concursos públicos",
    "sites com questões comentadas gratuitas para concursos",
    "videoaulas gratuitas para concursos públicos",
    "canais no youtube para estudar para concursos",
    "aplicativos gratuitos para estudar para concursos",
    "como usar a Lei Seca e a Vade Mecum de graça no celular",
    "grupos e comunidades gratuitas de concurseiros",
    "editais e provas anteriores gratuitas para baixar",
  ],
  "Cronograma de Estudos": [
    "como montar cronograma de estudos para concurso público",
    "cronograma de estudos para concurso em 6 meses",
    "como organizar rotina de estudos para concurso",
    "cronograma de estudos para quem trabalha",
    "cronograma de estudos para concurso em 3 meses",
    "como dividir as horas de estudo entre várias matérias",
    "cronograma de estudos para quem tem filhos pequenos",
    "como ajustar o cronograma na reta final antes da prova",
  ],
  "Carreiras Públicas": [
    "carreira de auditor fiscal: salário e perspectivas",
    "carreira policial federal: requisitos e preparação",
    "diferenças entre cargos de nível médio e superior no setor público",
    "carreira no INSS: como funciona",
    "carreira de analista judiciário: como funciona e quanto ganha",
    "carreira de defensor público: requisitos e etapas",
    "carreira de auditor da receita estadual: o que muda em relação à federal",
    "carreira de agente penitenciário: rotina e requisitos",
    "carreira de diplomata: como funciona o concurso do Itamaraty",
  ],
  "Questões Comentadas": [
    "como resolver questões de raciocínio lógico em concursos",
    "estratégia para questões de português em concursos públicos",
    "como gabaritar questões de direito constitucional",
    "técnicas para questões de matemática financeira em concursos",
    "como resolver questões de interpretação de texto em concursos",
    "estratégia para questões de informática em concursos",
    "como resolver questões de direito administrativo em concursos",
    "estratégia para questões de atualidades em concursos",
  ],
  "Informática para Concursos": [
    "noções de informática mais cobradas em concursos públicos",
    "Word para concursos: o que realmente cai na prova",
    "Excel para concursos: fórmulas e funções mais cobradas",
    "segurança da informação para concursos: o que estudar",
    "redes de computadores para concursos: conceitos essenciais",
    "sistemas operacionais para concursos: Windows e Linux básico",
  ],
  "Redação e Discursiva": [
    "como estruturar uma redação dissertativa para concursos",
    "erros que zeram a redação em concursos públicos",
    "como fazer uma prova discursiva de direito",
    "como usar conectivos para melhorar a coesão na redação de concurso",
    "como interpretar o comando da prova discursiva sem perder pontos",
  ],
  "Direito Administrativo": [
    "princípios da administração pública para concursos",
    "atos administrativos: o que cai em concursos",
    "licitações e contratos administrativos para concursos",
    "poderes da administração pública: como estudar para a prova",
    "responsabilidade civil do Estado: o que os concursos cobram",
  ],
  "Concursos de Tribunais": [
    "concurso para tribunal de justiça: como se preparar",
    "concurso para tribunal regional federal: o que estudar",
    "concurso para tribunal regional do trabalho: requisitos e etapas",
    "diferenças entre concursos de tribunais estaduais e federais",
  ],
};

function buildTopic() {
  if (topicArg) {
    return { topic: topicArg, category: ag.randomItem(CATEGORIES) };
  }

  const usedTopics = loadJson(usedTopicsLogPath, []);
  const existingSlugs = getExistingSlugs();

  // 1ª passada: tenta achar um tópico inédito, sorteando a categoria.
  // 15 tentativas é suficiente quando ALGUMA categoria ainda tem seed livre.
  const MAX_ATTEMPTS = 15;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const category = ag.randomItem(CATEGORIES);
    const pool = SEEDS[category] || [];
    if (pool.length === 0) continue;

    const available = pool.filter((t) => !usedTopics.includes(t) && !existingSlugs.has(ag.slugify(t)));
    if (available.length === 0) continue;

    const topic = ag.randomItem(available);
    return { topic, category };
  }

  // 2ª passada (defensiva): a 1ª pode falhar por mau sorteio mesmo com seeds
  // livres em outra categoria. Varre TODAS as categorias de forma determinística
  // antes de aceitar que o pool real esgotou.
  for (const category of CATEGORIES) {
    const pool = SEEDS[category] || [];
    const available = pool.filter((t) => !usedTopics.includes(t) && !existingSlugs.has(ag.slugify(t)));
    if (available.length > 0) {
      return { topic: ag.randomItem(available), category };
    }
  }

  // Pool de seeds genuinamente esgotado em TODAS as categorias.
  // Isso não deve gerar um clone disfarçado de tópico antigo (era o bug que
  // produzia títulos como "...guia atualizado", "...dicas práticas" repetidos).
  // Em vez disso, sinaliza claramente que o pool precisa de novos seeds —
  // a pessoa responsável vê isso no console/log e adiciona temas novos em SEEDS.
  console.warn(
    "\n⚠️  POOL DE SEEDS ESGOTADO em todas as categorias — todos os tópicos cadastrados já foram usados.\n" +
    "   Isso é esperado de tempos em tempos; a ação correta é adicionar novos tópicos\n" +
    "   em scripts/generate-article.js (objeto SEEDS), não gerar variações automáticas\n" +
    "   do mesmo tópico (isso foi removido por causar posts quase-duplicados).\n"
  );

  const category = ag.randomItem(CATEGORIES);
  const pool = SEEDS[category] || [`dicas sobre ${category}`];
  const topic = ag.randomItem(pool);
  // marcado explicitamente para aparecer no painel de qualidade como "pool esgotado",
  // já que o tópico abaixo é necessariamente uma repetição de algo já publicado
  return { topic, category, seedPoolExhausted: true };
}

// ─── Save ─────────────────────────────────────────────────────────────
async function saveArticle(result, topic, category, forceFile, seedPoolExhausted = false) {
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  let existingFrontmatter;
  if (forceFile) {
    const oldRaw = fs.readFileSync(path.join(postsDir, forceFile), "utf8");
    existingFrontmatter = {
      date: oldRaw.match(/^date:\s*"([^"]*)"/m)?.[1],
      category: oldRaw.match(/^category:\s*"([^"]*)"/m)?.[1],
      curiosity: oldRaw.match(/^curiosity:\s*"([^"]*)"/m)?.[1],
    };
  }

  // Curiosidade pro card "💡 Curiosidade" — gerada 1x aqui, junto com o
  // artigo, e nunca em runtime. Se falhar, buildArticleFile cai de volta
  // pra curiosidade anterior (regeneração) ou simplesmente omite o campo.
  const curiosity = await ag.generateCuriosity(result.body);

  const article = ag.buildArticleFile({
    title: result.title,
    body: result.body,
    topic,
    category,
    forceFile,
    existingFrontmatter,
    curiosity,
  });

  fs.writeFileSync(path.join(postsDir, article.file), article.content);
  saveSignature(article.slug, result.signature);

  appendQualityLog({
    file: article.file,
    slug: article.slug,
    title: article.normalizedTitle,
    category: article.category,
    provider: result.provider,
    wordCount: result.wordCount,
    fillerCount: result.fillerCount,
    similarity: Math.round(result.maxSim * 100),
    similarTo: result.mostSimilarSlug,
    status: seedPoolExhausted ? "pool-esgotado" : (result.issues.length > 0 ? "ressalvas" : "ok"),
    issues: seedPoolExhausted
      ? [...result.issues, "pool de seeds esgotado — tópico reaproveitado; adicione novos seeds em SEEDS"]
      : result.issues,
  });

  return article.file;
}

// ─── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🔑 CONFIG SAFE MODE");
  console.log("Categories:", CATEGORIES.length);

  // modo regeneração de post existente
  if (forceFileArg) {
    if (!topicArg) {
      console.error("❌ --force-file precisa ser usado junto com --topic");
      process.exit(1);
    }
    const filePath = path.join(postsDir, forceFileArg);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${forceFileArg}`);
      process.exit(1);
    }

    console.log(`\n🔁 Regenerando conteúdo de: ${forceFileArg}\n`);
    const category = ag.randomItem(CATEGORIES);

    try {
      const result = await ag.generateValidatedArticle({
        topic: topicArg,
        category,
        generation,
        existingSignatures: getExistingSignatures(),
      });
      const file = await saveArticle(result, topicArg, category, forceFileArg);
      console.log(`💾 Atualizado: ${file} (${result.wordCount} palavras, via ${result.provider})`);
    } catch (err) {
      console.error(`❌ Erro ao regenerar: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  const count = countArg || 1;

  for (let i = 0; i < count; i++) {
    const { topic, category, seedPoolExhausted } = buildTopic();
    console.log(`\n📝 ${i + 1}/${count}: ${topic}`);

    try {
      const result = await ag.generateValidatedArticle({
        topic,
        category,
        generation,
        existingSignatures: getExistingSignatures(),
      });
      const file = await saveArticle(result, topic, category, null, seedPoolExhausted);

      const used = loadJson(usedTopicsLogPath, []);
      used.push(topic);
      saveJson(usedTopicsLogPath, used, 300);

      console.log(`💾 Salvo: ${file} (${result.wordCount} palavras, via ${result.provider})`);
    } catch (err) {
      console.error(`❌ Erro: ${err.message}`);
      appendQualityLog({ topic, category, status: "erro", error: err.message });
    }

    if (i < count - 1) await sleep(2000);
  }
}

main().catch((err) => {
  console.error("ERRO FATAL:", err.message);
  process.exit(1);
});
