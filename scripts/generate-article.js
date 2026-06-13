/**
 * GERADOR DE ARTIGOS VIA GROQ API (SAAS PIPELINE ESTÁVEL)
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});

console.log("GROQ:", process.env.GROQ_API_KEY ? "OK" : "NÃO ENCONTRADA");

const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../site.config");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

const articlesToGenerate =
  countArg || config.generation.articlesPerRun;

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
// SEO ENGINE (CORRIGIDO)
// ─────────────────────────────

function calculateSEOScore(article) {
  let score = 0;

  if (article.includes("title:")) score += 10;
  if (article.includes("excerpt:")) score += 10;
  if (article.includes("date:")) score += 10;

  if (/^##\s+/m.test(article)) score += 25; // H2 real
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

  // 🔥 AJUSTE CRÍTICO (antes era 60-80 impossível)
  if (score < 40) return false;

  return true;
}

// ─────────────────────────────
// GROQ
// ─────────────────────────────

async function askGroq(prompt, maxTokens = 4000) {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
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

  const text = await askGroq(prompt, 500);

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

  return await askGroq(prompt, 4500);
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
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não encontrada");
  }

  console.log(`🚀 Gerando ${articlesToGenerate} artigo(s)...`);

  const postsDir = path.join(__dirname, "../posts");

  const existingTitles = fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir)
    : [];

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