/**
 * GERADOR DE ARTIGOS VIA GROQ API (SAAS PIPELINE DEFINITIVO)
 *
 * Melhorias aplicadas:
 * - SEO Engine real (quality gate)
 * - Retry inteligente
 * - Anti-duplicação por hash SHA256
 * - Validação de frontmatter
 * - Fallback controlado
 * - Pipeline determinístico
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

// ─────────────────────────────────────────────
// ARGS
// ─────────────────────────────────────────────

const args = process.argv.slice(2);

const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;

const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1])
  : null;

const articlesToGenerate =
  countArg || config.generation.articlesPerRun;

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// SEO ENGINE (QUALITY GATE)
// ─────────────────────────────────────────────

function calculateSEOScore(article) {
  let score = 0;

  if (article.includes("title:")) score += 10;
  if (article.includes("excerpt:")) score += 10;
  if (article.includes("date:")) score += 10;
  if (article.includes("H2") || article.includes("##")) score += 20;
  if (article.includes("FAQ")) score += 20;
  if (article.length > 3000) score += 20;
  if (article.toLowerCase().includes("como")) score += 10;
  if (article.includes("2026")) score += 10;

  return score;
}

function validateArticle(article) {
  const score = calculateSEOScore(article);

  console.log(`📊 SEO SCORE: ${score}`);

  if (!article.includes("---")) return false;
  if (!article.includes("title:")) return false;
  if (!article.includes("date:")) return false;
  if (score < 60) return false;

  return true;
}

// ─────────────────────────────────────────────
// GROQ
// ─────────────────────────────────────────────

async function askGroq(prompt, maxTokens = 4000) {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
}

// ─────────────────────────────────────────────
// TÓPICO
// ─────────────────────────────────────────────

async function generateTopic(category, existingTitles) {
  const titlesContext =
    existingTitles.length > 0
      ? `\n\nARTIGOS JÁ PUBLICADOS:\n${existingTitles.slice(-30).join("\n")}`
      : "";

  const prompt = `
Você é um estrategista SEO especialista em ${config.niche}.

Gere UM tópico único.

Categoria: ${category}

Regras:
- Alto volume de busca no Brasil
- Não repetir temas
- Intenção clara

${titlesContext}

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

// ─────────────────────────────────────────────
// ARTIGO (IA)
// ─────────────────────────────────────────────

async function generateArticle(topic, category) {
  const affiliateContext = config.affiliates
    .map(
      (a) => `- ${a.name}: ${a.url}
CTA: ${a.cta}`
    )
    .join("\n");

  const prompt = `
Você é um editor SEO nível SaaS enterprise.

Crie um artigo altamente otimizado para Google.

Título: ${topic.title}
Keyword: ${topic.targetKeyword}

Estrutura obrigatória:
- Introdução direta
- H2 explicativo
- H2 passo a passo
- H2 erros comuns
- H2 exemplos
- FAQ
- Conclusão

SEO:
- keyword no início
- variações naturais
- linguagem humana

Links afiliados:
${affiliateContext}

FORMATO:

---
title: "${topic.title}"
date: "${today()}"
category: "${category}"
excerpt: "SEO optimized excerpt"
targetKeyword: "${topic.targetKeyword}"
secondaryKeywords: [${topic.secondaryKeywords.map(k => `"${k}"`).join(", ")}]
readingTime: "AUTO"
---

## ARTIGO
`;

  return await askGroq(prompt, 5000);
}

// ─────────────────────────────────────────────
// PIPELINE SAAS CORE
// ─────────────────────────────────────────────

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

    if (score >= 80) {
      console.log("🚀 SEO excelente, aprovado direto");
      return article;
    }
  }

  console.log("⚠️ Usando melhor versão encontrada");
  return best;
}

// ─────────────────────────────────────────────
// SALVAR (ANTI DUPLICAÇÃO REAL)
// ─────────────────────────────────────────────

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
    console.log("⛔ Conteúdo duplicado detectado");
    return null;
  }

  fs.writeFileSync(filepath, content, "utf8");

  return filename;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não encontrada");
  }

  console.log(`🚀 Gerando ${articlesToGenerate} artigo(s)...`);

  const postsDir = path.join(__dirname, "../posts");

  const existingTitles = fs.existsSync(postsDir)
    ? fs.readdirSync(postsDir).map(f => f)
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
        console.log("⛔ Conteúdo rejeitado (SEO baixo)");
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
