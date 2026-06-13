#!/usr/bin/env node
require("dotenv").config({ path: ".env.local", override: false });

const fs = require("fs");
const path = require("path");
const siteConfig = require("../site.config.js");

// ─── CLI ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;

const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1], 10)
  : siteConfig.generation.articlesPerRun || 1;

// ─── Helpers ─────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// ─── GEMINI MODELS CORRIGIDOS ───────────────────────────────────────
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
];

// ─── PROMPT ──────────────────────────────────────────────────────────
function buildPrompt(topic) {
  return `Escreva um artigo completo em português sobre: "${topic}".
Inclua introdução, desenvolvimento e conclusão.
Use linguagem clara e prática. Retorne em Markdown.`;
}

// ─── GROQ ────────────────────────────────────────────────────────────
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

  if (res.status === 429) throw new Error("Groq: rate limit (429)");
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── OPENROUTER ──────────────────────────────────────────────────────
async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) throw new Error("OPENROUTER_API_KEY ausente");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": siteConfig.url,
      "X-Title": siteConfig.name,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (res.status === 429 || res.status === 402)
    throw new Error("OpenRouter: limite atingido");

  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── GEMINI ──────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY ausente");

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (res.status === 404) continue;
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        console.log(`✅ Gemini usou: ${model}`);
        return text;
      }
    } catch (err) {
      console.warn(`⚠️ Gemini ${model}: ${err.message}`);
    }
  }

  throw new Error("Gemini: todos os modelos falharam");
}

// ─── FALLBACK ────────────────────────────────────────────────────────
async function generateWithFallback(prompt) {
  const providers = [
    { name: "Groq", fn: callGroq },
    { name: "OpenRouter", fn: callOpenRouter },
    { name: "Gemini", fn: callGemini },
  ];

  for (const p of providers) {
    try {
      console.log(`🔄 Tentando ${p.name}...`);
      const text = await p.fn(prompt);
      console.log(`✅ Gerado via ${p.name}`);
      return { text, provider: p.name };
    } catch (err) {
      console.warn(`❌ ${p.name}: ${err.message}`);
      await sleep(1500);
    }
  }

  throw new Error("Todos os provedores falharam");
}

// ─── SAVE ARTICLE ─────────────────────────────────────────────────────
function saveArticle(markdown, topic) {
  const postsDir = path.resolve(__dirname, "../posts");

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const slug = slugify(topic);
  const filePath = path.join(postsDir, `${slug}.md`);

  fs.writeFileSync(filePath, markdown, "utf8");

  return filePath;
}

// ─── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🔑 Chaves configuradas:");
  console.log("GROQ:", !!process.env.GROQ_API_KEY);
  console.log("OPENROUTER:", !!process.env.OPENROUTER_API_KEY);
  console.log("GEMINI:", !!process.env.GEMINI_API_KEY);

  console.log(`🚀 Iniciando geração de ${countArg} artigo(s)...\n`);

  for (let i = 0; i < countArg; i++) {
    const topic =
      topicArg ||
      randomItem([
        "carreira de auditor fiscal vale a pena",
        "como estudar para concursos públicos",
        "melhores técnicas de estudo para aprovação",
      ]);

    console.log(`📝 Artigo ${i + 1}: ${topic}`);

    const prompt = buildPrompt(topic);

    const { text, provider } = await generateWithFallback(prompt);

    const file = saveArticle(text, topic);

    console.log(`💾 Salvo em: ${file}`);
    console.log(`📡 Provider: ${provider}\n`);
  }

  console.log("✅ Finalizado com sucesso");
}

// ─── EXECUÇÃO ────────────────────────────────────────────────────────
main().catch((err) => {
  console.error("❌ ERRO FATAL:", err.message);
  process.exit(1);
});