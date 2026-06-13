/**
 * GERADOR DE ARTIGOS VIA GROQ API (VERSÃO SEO AGÊNCIA + RETRY)
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});

console.log("GROQ:", process.env.GROQ_API_KEY ? "OK" : "NÃO ENCONTRADA");

const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const config = require("../site.config");

// ─────────────────────────────────────────────
// SEO ENGINE
// ─────────────────────────────────────────────

function calculateSEOScore({ content, title, keyword }) {
  let score = 0;

  if (!content) return 0;

  const words = content.split(/\s+/).length;

  if (words > 1200) score += 20;
  if (words > 1800) score += 10;

  if (content.includes("## ")) score += 10;
  if (content.includes("### ")) score += 10;

  if (content.toLowerCase().includes("faq")) score += 15;

  if (content.includes(keyword)) score += 10;

  if (title?.length > 30) score += 10;

  if (content.includes("## Introdução")) score += 5;

  return Math.max(0, Math.min(100, score));
}

function isApproved(score) {
  return score >= 65;
}

// ─────────────────────────────────────────────

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
// UTILS
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

function getExistingTitles() {
  const dir = path.join(__dirname, "../posts");

  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const c = fs.readFileSync(path.join(dir, f), "utf8");
      const match = c.match(/^title:\s*"(.+)"/m);
      return match ? match[1] : "";
    })
    .filter(Boolean);
}

// ─────────────────────────────────────────────
// GROQ
// ─────────────────────────────────────────────

async function askGroq(prompt, maxTokens = 5000) {
  const res = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.8,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0].message.content.trim();
}

// ─────────────────────────────────────────────
// TOPIC
// ─────────────────────────────────────────────

async function generateTopic(category, existingTitles) {
  const context =
    existingTitles.length > 0
      ? `ARTIGOS EXISTENTES:\n${existingTitles.slice(-30).join("\n")}`
      : "";

  const prompt = `
Gere UM tópico SEO único.

Categoria: ${category}

Regras:
- Alta intenção de busca
- Não repetir

${context}

Responda JSON:
{
  "title": "",
  "targetKeyword": "",
  "secondaryKeywords": ["", "", ""]
}
`;

  const text = await askGroq(prompt, 600);

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      title: `Guia de ${category}`,
      targetKeyword: category,
      secondaryKeywords: config.keywords.slice(0, 3),
    };
  }
}

// ─────────────────────────────────────────────
// ARTICLE
// ─────────────────────────────────────────────

async function generateArticle(topic, category) {
  const prompt = `
Você é um EDITOR CHEFE SEO nível agência.

Escreva um artigo extremamente profundo.

Título: ${topic.title}
Keyword: ${topic.targetKeyword}
Secundárias: ${topic.secondaryKeywords.join(", ")}

REGRAS:
- Nada genérico
- Exemplos reais
- H2/H3 estruturado
- FAQ obrigatório
- Links internos

FORMATO:

---
title: "${topic.title}"
date: "${today()}"
category: "${category}"
excerpt: "SEO optimized excerpt"
targetKeyword: "${topic.targetKeyword}"
secondaryKeywords: [${topic.secondaryKeywords.map((k) => `"${k}"`).join(", ")}]
readingTime: "AUTO"
---

## ARTIGO
`;

  return await askGroq(prompt, 5000);
}

// ─────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────

function saveArticle(content, title) {
  const dir = path.join(__dirname, "../posts");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const slug = slugify(title);
  const file = `${today()}-${slug}.md`;
  const fullPath = path.join(dir, file);

  if (!content.includes("---")) {
    throw new Error("ARTIGO SEM FRONTMATTER");
  }

  fs.writeFileSync(fullPath, content, "utf8");

  return file;
}

// ─────────────────────────────────────────────
// MAIN (COM RETRY + FALLBACK)
// ─────────────────────────────────────────────

async function main() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não encontrada");
  }

  console.log(`\n🚀 Gerando ${articlesToGenerate} artigo(s)...\n`);

  const existingTitles = getExistingTitles();
  const categories = config.generation.categories;

  let index = existingTitles.length % categories.length;

  for (let i = 0; i < articlesToGenerate; i++) {
    const category = categories[index % categories.length];
    index++;

    try {
      console.log(`\n📂 Categoria: ${category}`);

      const topic =
        topicArg && i === 0
          ? {
              title: topicArg,
              targetKeyword: topicArg,
              secondaryKeywords: config.keywords.slice(0, 3),
            }
          : await generateTopic(category, existingTitles);

      let content;
      let score = 0;

      const MAX_ATTEMPTS = 3;

      // ─────────────────────────────────────────────
      // 🔁 RETRY LOOP (AGÊNCIA MODE)
      // ─────────────────────────────────────────────

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(`🔁 Tentativa ${attempt}/${MAX_ATTEMPTS}`);

        content = await generateArticle(topic, category);

        const clean = content.replace(/^---[\s\S]*?---/g, "");

        score = calculateSEOScore({
          content: clean,
          title: topic.title,
          keyword: topic.targetKeyword,
        });

        console.log(`📊 SEO SCORE: ${score}`);

        if (isApproved(score)) {
          console.log("✅ Conteúdo aprovado");
          break;
        }
      }

      // ─────────────────────────────────────────────
      // 🧱 FALLBACK SE TUDO FALHAR
      // ─────────────────────────────────────────────

      if (!isApproved(score)) {
        console.log("⚠️ Fallback ativado (score baixo)");

        content = await generateArticle(
          {
            ...topic,
            title: topic.title + " (guia completo)",
          },
          category
        );
      }

      const file = saveArticle(content, topic.title);

      existingTitles.push(topic.title);

      console.log(`✅ Salvo: ${file}`);

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error("❌ Erro:", err.message);
    }
  }

  console.log("\n✨ FINALIZADO");
}

main().catch(console.error);