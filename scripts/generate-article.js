
/**
 * GERADOR DE ARTIGOS — FALLBACK TRIPLO
 * Groq (free) → Gemini Flash (free) → Anthropic (pago)
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});

const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../site.config");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

console.log("GROQ:", GROQ_API_KEY ? "OK" : "NÃO ENCONTRADA");
console.log("GEMINI:", GEMINI_API_KEY ? "OK" : "não configurada");
console.log("ANTHROPIC:", ANTHROPIC_API_KEY ? "OK" : "não configurada");

const groqClient = new Groq({ apiKey: GROQ_API_KEY });

// ─────────────────────────────
// ARGS
// ─────────────────────────────

const args = process.argv.slice(2);

const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;

const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1])
  : null;

const articlesToGenerate = countArg || config.generation.articlesPerRun;

// ─────────────────────────────
// UTIL
// ─────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 90);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function getContentHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// ─────────────────────────────
// SEO ENGINE
// ─────────────────────────────

function calculateSEOScore(article) {
  let score = 0;
  if (article.includes("title:")) score += 10;
  if (article.includes("excerpt:")) score += 10;
  if (article.includes("date:")) score += 10;
  if (/^##\s+/m.test(article)) score += 25;
  if (article.includes("FAQ") || article.includes("Perguntas")) score += 15;
  if (article.length > 1500) score += 15;
  if (article.toLowerCase().includes("como")) score += 10;
  if (article.includes("2026") || article.includes("2025")) score += 5;
  return score;
}

function validateArticle(article) {
  const score = calculateSEOScore(article);
  console.log(`📊 SEO SCORE: ${score}`);
  if (!article.includes("---")) return false;
  if (!article.includes("title:")) return false;
  if (!article.includes("date:")) return false;
  if (score < 40) return false;
  return true;
}

// ─────────────────────────────
// PROVIDER 1 — GROQ (free)
// Limite: 100k tokens/dia, 6k tokens/min
// Console: console.groq.com
// ─────────────────────────────

async function askGroq(prompt, maxTokens = 4000) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY não configurada");

  const response = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
}

// ─────────────────────────────
// PROVIDER 2 — GOOGLE GEMINI FLASH (free)
// Limite: 1.500 req/dia, 1M tokens/min — mais generoso que Groq
// Console: aistudio.google.com → Get API key
// Secret: GEMINI_API_KEY
// ─────────────────────────────

async function askGemini(prompt, maxTokens = 4000) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Gemini não retornou conteúdo");
  return text.trim();
}

// ─────────────────────────────
// PROVIDER 3 — ANTHROPIC (pago, fallback final)
// Console: console.anthropic.com
// Secret: ANTHROPIC_API_KEY
// ─────────────────────────────

async function askAnthropic(prompt, maxTokens = 4000) {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não configurada");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("Anthropic não retornou conteúdo");
  return text.trim();
}

// ─────────────────────────────
// ORQUESTRADOR COM FALLBACK
// ─────────────────────────────

async function askAI(prompt, maxTokens = 4000) {
  const providers = [
    { name: "Groq", fn: () => askGroq(prompt, maxTokens), enabled: !!GROQ_API_KEY },
    { name: "Gemini Flash", fn: () => askGemini(prompt, maxTokens), enabled: !!GEMINI_API_KEY },
    { name: "Anthropic", fn: () => askAnthropic(prompt, maxTokens), enabled: !!ANTHROPIC_API_KEY },
  ];

  for (const provider of providers) {
    if (!provider.enabled) {
      console.log(`⏭️ ${provider.name}: chave não configurada, pulando`);
      continue;
    }

    try {
      const result = await provider.fn();
      console.log(`✅ Gerado via ${provider.name}`);
      return result;
    } catch (err) {
      console.log(`⚠️ ${provider.name} falhou: ${err.message.slice(0, 120)}`);
      console.log(`🔄 Tentando próximo provider...`);
    }
  }

  throw new Error("❌ Todos os providers falharam. Verifique os limites e configurações das APIs.");
}

// ─────────────────────────────
// TOPIC
// ─────────────────────────────

async function generateTopic(category, existingTitles) {
  const prompt = `
Gere um tópico SEO para ${config.niche}.

Categoria: ${category}

Responda JSON:
{
  "title": "",
  "searchIntent": "",
  "targetKeyword": "",
  "secondaryKeywords": ["", "", ""]
}
`;

  const text = await askAI(prompt, 500);

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      title: `Guia sobre ${category}`,
      searchIntent: "informacional",
      targetKeyword: category.toLowerCase(),
      secondaryKeywords: config.keywords.slice(0, 3),
    };
  }
}

// ─────────────────────────────
// ARTICLE
// ─────────────────────────────

async function generateArticle(topic, category) {
  const prompt = `
Crie um artigo SEO.

Título: ${topic.title}
Keyword: ${topic.targetKeyword}

Estrutura:
- Introdução
- ## Explicação
- ## Passo a passo
- ## Erros comuns
- ## Exemplos
- FAQ
- Conclusão

FORMATO FRONTMATTER:

---
title: "${topic.title}"
date: "${today()}"
category: "${category}"
excerpt: "SEO optimized excerpt"
targetKeyword: "${topic.targetKeyword}"
secondaryKeywords: [${topic.secondaryKeywords.map(k => `"${k}"`).join(", ")}]
---

## ARTIGO
`;

  return await askAI(prompt, 4500);
}

// ─────────────────────────────
// QUALITY LOOP
// ─────────────────────────────

async function generateWithQuality(topic, category) {
  let attempts = 0;
  let best = null;
  let bestScore = 0;

  while (attempts < 3) {
    attempts++;
    console.log(`🔁 Tentativa ${attempts}/3`);

    const article = await generateArticle(topic, category);
    const score = calculateSEOScore(article);

    if (score > bestScore) {
      best = article;
      bestScore = score;
    }

    if (score >= 60) {
      console.log("🚀 Aprovado automaticamente");
      return article;
    }
  }

  console.log("⚠️ Usando melhor versão disponível");
  return best;
}

// ─────────────────────────────
// SAVE
// ─────────────────────────────

function saveArticle(content, title) {
  const postsDir = path.join(__dirname, "../posts");

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const hash = getContentHash(content);
  const slug = slugify(title);
  const filename = `${today()}-${slug}-${hash.slice(0, 8)}.md`;
  const filepath = path.join(postsDir, filename);

  if (fs.existsSync(filepath)) {
    console.log("⛔ Duplicado detectado");
    return null;
  }

  fs.writeFileSync(filepath, content, "utf8");
  return filename;
}

// ─────────────────────────────
// MAIN
// ─────────────────────────────

async function main() {
  if (!GROQ_API_KEY && !GEMINI_API_KEY && !ANTHROPIC_API_KEY) {
    throw new Error("Nenhuma API key configurada. Configure ao menos GROQ_API_KEY ou GEMINI_API_KEY.");
  }

  console.log(`🚀 Gerando ${articlesToGenerate} artigo(s)...`);

  const postsDir = path.join(__dirname, "../posts");
  const existingTitles = fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : [];
  const categories = config.generation.categories;
  let categoryIndex = 0;

  for (let i = 0; i < articlesToGenerate; i++) {
    const category = categories[categoryIndex % categories.length];
    categoryIndex++;

    try {
      console.log(`📂 Categoria: ${category}`);

      let topic;

      if (topicArg && i === 0) {
        topic = {
          title: topicArg,
          targetKeyword: topicArg.toLowerCase(),
          secondaryKeywords: config.keywords.slice(0, 3),
        };
      } else {
        topic = await generateTopic(category, existingTitles);
      }

      const article = await generateWithQuality(topic, category);

      if (!validateArticle(article)) {
        console.log("⛔ Conteúdo rejeitado (SEO)");
        continue;
      }

      const filename = saveArticle(article, topic.title);

      if (filename) {
        console.log(`✅ Salvo: ${filename}`);
      }

    } catch (err) {
      console.error("❌ Erro:", err.message);
    }
  }

  console.log("\n✨ FINALIZADO");
}

main().catch(console.error);
