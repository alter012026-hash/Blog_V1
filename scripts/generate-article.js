#!/usr/bin/env node
/**
 * generate-article.js
 * Gera artigos com frontmatter completo + fallback Groq → OpenRouter → Gemini
 */

require("dotenv").config({ path: ".env.local", override: false });

const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
// SAFE CONFIG LOADER (FIX PRINCIPAL)
// ─────────────────────────────────────────────
let siteConfigRaw = require("../site.config.js");

// suporte ESM default export
const siteConfig = siteConfigRaw?.default || siteConfigRaw || {};

// fallback seguro TOTAL (evita crash)
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

const topicArg =
  args.includes("--topic")
    ? args[args.indexOf("--topic") + 1]
    : null;

const countArg =
  args.includes("--count")
    ? parseInt(args[args.indexOf("--count") + 1], 10)
    : (generation.articlesPerRun || 1);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function buildTopic() {
  if (topicArg) {
    return {
      topic: topicArg,
      category: randomItem(CATEGORIES),
    };
  }

  const category = randomItem(CATEGORIES);

  const seeds = {
    "Editais": [
      "como interpretar um edital de concurso público",
      "o que verificar antes de se inscrever em um edital",
      "diferenças entre editais estaduais e federais",
    ],
    "Técnicas de Estudo": [
      "método pomodoro para concursos públicos",
      "como fazer resumos eficientes para concursos",
      "revisão espaçada para memorizar legislação",
      "como manter o foco nos estudos para concurso",
    ],
    "Concursos Abertos": [
      "concursos públicos com mais vagas para nível médio",
      "concursos federais abertos com inscrições em 2026",
      "melhores concursos para iniciantes em 2026",
    ],
    "Materiais Gratuitos": [
      "melhores apostilas gratuitas para concursos públicos",
      "sites com questões comentadas gratuitas para concursos",
      "videoaulas gratuitas para concursos públicos",
    ],
    "Cronograma de Estudos": [
      "como montar cronograma de estudos para concurso público",
      "cronograma de estudos para concurso em 6 meses",
      "como organizar rotina de estudos para concurso",
    ],
    "Carreiras Públicas": [
      "carreira de auditor fiscal: salário e perspectivas",
      "carreira policial federal: requisitos e preparação",
      "diferenças entre cargos de nível médio e superior no setor público",
    ],
    "Questões Comentadas": [
      "como resolver questões de raciocínio lógico em concursos",
      "estratégia para questões de português em concursos públicos",
      "como gabaritar questões de direito constitucional",
    ],
  };

  const pool = seeds[category] || [`dicas sobre ${category}`];

  return {
    topic: randomItem(pool),
    category,
  };
}

// ─── Prompt ───────────────────────────────────────────────────────────
function buildPrompt({ topic }) {
  const { tone, audienceLevel, minWords } = generation;

  return `
Você é um especialista em concursos públicos no Brasil.

Escreva um artigo completo sobre: "${topic}"

REGRAS:
- Mínimo de ${minWords || 1200} palavras
- Tom: ${tone || "didático e direto"}
- Público: ${audienceLevel || "iniciantes"}
- Markdown válido
- Estrutura com introdução, desenvolvimento e conclusão
- Sem frases genéricas

RETORNE APENAS O CONTEÚDO.
`;
}

// ─── Providers ────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_API_KEY ausente");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = await res.json();

  return data.choices?.[0]?.message?.content;
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

  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
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

// ─── Fallback ─────────────────────────────────────────────────────────
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
      return text;
    } catch (err) {
      console.log(`❌ ${p.name}: ${err.message}`);
      await sleep(1000);
    }
  }

  throw new Error("Todos os provedores falharam");
}

// ─── Markdown ─────────────────────────────────────────────────────────
function cleanMarkdown(text = "") {
  return text
    .replace(/^[=\-]{3,}$/gm, "")
    .replace(/^#\s+.+\n?/gm, "")
    .trim();
}

function buildExcerpt(content) {
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Pula linhas vazias, títulos (##), listas, blocos de código e tabelas
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (/^[-*+>|`]/.test(trimmed)) continue;

    // Remove markdown inline
    const clean = trimmed
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

    if (clean.length > 50) {
      const excerpt = clean.slice(0, 155).trim();
      return excerpt.length < clean.length ? excerpt + "..." : excerpt;
    }
  }

  // fallback seguro
  return content.replace(/[#*_`>\-\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 155);
}

// ─── Save ─────────────────────────────────────────────────────────────
function saveArticle(content, topic, category) {
  const postsDir = path.resolve(__dirname, "../posts");
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir);

  const clean = cleanMarkdown(content);
  const date = todayISO();
  const slug = slugify(topic);

  const file = `${date}-${slug}.md`;

  const frontmatter = `---
title: "${topic}"
date: "${date}"
category: "${category}"
excerpt: "${buildExcerpt(clean)}"
---

`;

  fs.writeFileSync(path.join(postsDir, file), frontmatter + clean);
  return file;
}

// ─── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🔑 CONFIG SAFE MODE");
  console.log("Categories:", CATEGORIES.length);

  const count = countArg || 1;

  for (let i = 0; i < count; i++) {
    const { topic, category } = buildTopic();

    console.log(`\n📝 ${i + 1}/${count}: ${topic}`);

    try {
      const prompt = buildPrompt({ topic, category });
      const content = await generateWithFallback(prompt);

      const file = saveArticle(content, topic, category);

      console.log(`💾 Salvo: ${file}`);
    } catch (err) {
      console.error(`❌ Erro: ${err.message}`);
    }

    if (i < count - 1) await sleep(2000);
  }
}

main().catch((err) => {
  console.error("ERRO FATAL:", err.message);
  process.exit(1);
});