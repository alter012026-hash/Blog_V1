#!/usr/bin/env node
/**
 * generate-article.js
 * Gera artigos com frontmatter completo + fallback:
 *   Groq (gpt-oss-120b → llama-3.3-70b-versatile) → OpenRouter → Gemini
 *
 * Novidades desta versão:
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

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function escapeForYaml(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

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

function checkSimilarity(bodyText) {
  const signatures = loadJson(signaturesLogPath, []);
  const newSig = qe.getSignature(bodyText);

  let maxSim = 0;
  let mostSimilarSlug = null;

  for (const entry of signatures) {
    const sim = qe.jaccardSimilarity(newSig, entry.words);
    if (sim > maxSim) {
      maxSim = sim;
      mostSimilarSlug = entry.slug;
    }
  }

  return { maxSim, mostSimilarSlug, newSig };
}

// ─── Tópicos ──────────────────────────────────────────────────────────
const SEEDS = {
  "Editais": [
    "como interpretar um edital de concurso público",
    "o que verificar antes de se inscrever em um edital",
    "diferenças entre editais estaduais e federais",
    "principais erros ao ler um edital de concurso",
    "glossário de termos comuns em editais públicos",
  ],
  "Técnicas de Estudo": [
    "método pomodoro para concursos públicos",
    "como fazer resumos eficientes para concursos",
    "revisão espaçada para memorizar legislação",
    "como manter o foco nos estudos para concurso",
    "técnicas de leitura ativa para concurseiros",
  ],
  "Concursos Abertos": [
    "concursos públicos com mais vagas para nível médio",
    "concursos federais abertos com inscrições em 2026",
    "melhores concursos para iniciantes em 2026",
    "concursos da área de saúde com inscrições abertas",
  ],
  "Materiais Gratuitos": [
    "melhores apostilas gratuitas para concursos públicos",
    "sites com questões comentadas gratuitas para concursos",
    "videoaulas gratuitas para concursos públicos",
    "canais no youtube para estudar para concursos",
  ],
  "Cronograma de Estudos": [
    "como montar cronograma de estudos para concurso público",
    "cronograma de estudos para concurso em 6 meses",
    "como organizar rotina de estudos para concurso",
    "cronograma de estudos para quem trabalha",
  ],
  "Carreiras Públicas": [
    "carreira de auditor fiscal: salário e perspectivas",
    "carreira policial federal: requisitos e preparação",
    "diferenças entre cargos de nível médio e superior no setor público",
    "carreira no INSS: como funciona",
  ],
  "Questões Comentadas": [
    "como resolver questões de raciocínio lógico em concursos",
    "estratégia para questões de português em concursos públicos",
    "como gabaritar questões de direito constitucional",
    "técnicas para questões de matemática financeira em concursos",
  ],
};

function buildTopic() {
  if (topicArg) {
    return { topic: topicArg, category: randomItem(CATEGORIES) };
  }

  const usedTopics = loadJson(usedTopicsLogPath, []);
  const existingSlugs = getExistingSlugs();
  const MAX_ATTEMPTS = 15;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const category = randomItem(CATEGORIES);
    const pool = SEEDS[category] || [`dicas sobre ${category}`];

    const available = pool.filter((t) => !usedTopics.includes(t));
    const finalPool = available.length > 0 ? available : pool;
    const topic = randomItem(finalPool);
    const slug = slugify(topic);

    if (!existingSlugs.has(slug) && !usedTopics.includes(topic)) {
      return { topic, category };
    }
  }

  // esgotou tentativas: gera variação pra não travar o pipeline
  const category = randomItem(CATEGORIES);
  const pool = SEEDS[category] || [`dicas sobre ${category}`];
  const base = randomItem(pool);
  const variation = randomItem(["guia atualizado", "passo a passo", "dicas práticas", "o que mudou em 2026"]);
  return { topic: `${base} (${variation})`, category };
}

// ─── Prompt ───────────────────────────────────────────────────────────
function buildPrompt({ topic }, retryHint) {
  const { tone, audienceLevel, minWords } = generation;

  return `
Você é um especialista em concursos públicos no Brasil.

Escreva um artigo completo e ESPECÍFICO sobre: "${topic}"

REGRAS DE PROFUNDIDADE (obrigatório, evite conteúdo raso/genérico):
- Mínimo de ${minWords || 1200} palavras
- Cite pelo menos 3 exemplos concretos (nomes de órgãos, bancas, provas, números reais)
- Inclua dados específicos sempre que possível (prazos, percentuais, valores, quantidade de vagas)
- Cada seção precisa ensinar algo aplicável, não só afirmar o óbvio
- PROIBIDO frases de preenchimento como "é importante destacar que", "vale ressaltar que",
  "nos dias atuais", "podemos concluir que"

REGRAS DE FORMATO:
- Tom: ${tone || "didático e direto"}
- Público: ${audienceLevel || "iniciantes"}
- Markdown válido
- Estrutura com introdução, desenvolvimento (use ## para subtítulos) e conclusão
- Título do artigo na primeira linha, começando com "#", em Capitalização de Título
  (primeira letra de cada palavra principal maiúscula; siglas como INSS, STF, CNH sempre maiúsculas)

${retryHint ? `\nATENÇÃO: a versão anterior foi rejeitada por: ${retryHint}. Corrija isso agora.\n` : ""}

RETORNE APENAS O CONTEÚDO EM MARKDOWN.
`;
}

// ─── Providers ────────────────────────────────────────────────────────
async function callGroqModel(prompt, model) {
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
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`Groq(${model}) HTTP ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Groq(${model}) retornou vazio`);
  return content;
}

// 🔥 Modelo principal trocado: openai/gpt-oss-120b
// É mais barato, mais rápido e maior que o llama-3.3-70b-versatile usado antes
// (ver tabela de modelos do Groq: console.groq.com/docs/models).
// Mantemos llama-3.3-70b-versatile como segunda tentativa dentro do próprio Groq
// antes de cair pros provedores externos.
async function callGroq(prompt) {
  const models = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"];
  let lastErr;
  for (const model of models) {
    try {
      return await callGroqModel(prompt, model);
    } catch (err) {
      lastErr = err;
      console.log(`   ⚠️  ${err.message}`);
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
      "HTTP-Referer": siteConfig.url || "http://localhost",
      "X-Title": siteConfig.name || "generator",
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

async function generateWithFallback(prompt) {
  const providers = [
    { name: "Groq", fn: callGroq },
    { name: "OpenRouter", fn: callOpenRouter },
    { name: "Gemini", fn: callGemini },
  ];

  for (const p of providers) {
    try {
      console.log(`🔄 ${p.name}...`);
      const text = await p.fn(prompt);
      console.log(`✅ ${p.name} OK`);
      return { text, provider: p.name };
    } catch (err) {
      console.log(`❌ ${p.name}: ${err.message}`);
      await sleep(1000);
    }
  }
  throw new Error("Todos os provedores falharam");
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

// ─── Qualidade + retry ────────────────────────────────────────────────
const MAX_QUALITY_RETRIES = 2;

async function generateValidated(promptArgs) {
  let retryHint = null;
  let lastAttempt = null;

  for (let attempt = 0; attempt <= MAX_QUALITY_RETRIES; attempt++) {
    const prompt = buildPrompt(promptArgs, retryHint);
    const { text, provider } = await generateWithFallback(prompt);

    const title = extractTitle(text) || promptArgs.topic;
    const body = cleanMarkdown(text);

    const minWords = generation.minWords || 1200;
    const wordCount = qe.countWords(body);
    const fillerCount = qe.countFillerPhrases(body);
    const { maxSim, mostSimilarSlug } = checkSimilarity(body);

    const issues = [];
    if (wordCount < minWords * 0.8) issues.push(`abaixo do mínimo de palavras (${wordCount}/${minWords})`);
    if (fillerCount >= 3) issues.push(`muitas frases genéricas (${fillerCount})`);
    if (maxSim > 0.55) issues.push(`muito parecido com "${mostSimilarSlug}" (${(maxSim * 100).toFixed(0)}%)`);

    lastAttempt = { title, body, provider, wordCount, fillerCount, maxSim, mostSimilarSlug, issues };

    if (issues.length === 0) return lastAttempt;

    retryHint = issues.join("; ");
    console.log(`   ⚠️  Tentativa ${attempt + 1} reprovada: ${retryHint}`);
  }

  console.log(`   ⚠️  Salvando mesmo com ressalvas após ${MAX_QUALITY_RETRIES + 1} tentativas.`);
  return lastAttempt;
}

// ─── Save ─────────────────────────────────────────────────────────────
function saveArticle({ title, body, topic, category, provider, wordCount, fillerCount, maxSim, mostSimilarSlug, issues }, forceFile) {
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  const normalizedTitle = qe.toTitleCase(title || topic);
  const excerpt = qe.buildSafeExcerpt(body);

  let file, date, slug;

  if (forceFile) {
    file = forceFile;
    const oldRaw = fs.readFileSync(path.join(postsDir, forceFile), "utf8");
    date = oldRaw.match(/^date:\s*"([^"]*)"/m)?.[1] || todayISO();
    category = oldRaw.match(/^category:\s*"([^"]*)"/m)?.[1] || category;
    slug = qe.slugFromFileName(forceFile);
  } else {
    date = todayISO();
    slug = slugify(normalizedTitle);
    file = `${date}-${slug}.md`;
  }

  const frontmatter = `---
title: "${escapeForYaml(normalizedTitle)}"
date: "${date}"
category: "${escapeForYaml(category)}"
excerpt: "${escapeForYaml(excerpt)}"
---

`;

  fs.writeFileSync(path.join(postsDir, file), frontmatter + body);
  saveSignature(slug, qe.getSignature(body));

  appendQualityLog({
    file,
    slug,
    title: normalizedTitle,
    category,
    provider,
    wordCount,
    fillerCount,
    similarity: Math.round(maxSim * 100),
    similarTo: mostSimilarSlug,
    status: issues && issues.length > 0 ? "ressalvas" : "ok",
    issues: issues || [],
  });

  return file;
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
    const category = randomItem(CATEGORIES);

    try {
      const result = await generateValidated({ topic: topicArg, category });
      const file = saveArticle({ ...result, topic: topicArg, category }, forceFileArg);
      console.log(`💾 Atualizado: ${file} (${result.wordCount} palavras, via ${result.provider})`);
    } catch (err) {
      console.error(`❌ Erro ao regenerar: ${err.message}`);
      process.exit(1);
    }
    return;
  }

  const count = countArg || 1;

  for (let i = 0; i < count; i++) {
    const { topic, category } = buildTopic();
    console.log(`\n📝 ${i + 1}/${count}: ${topic}`);

    try {
      const result = await generateValidated({ topic, category });
      const file = saveArticle({ ...result, topic, category });

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
