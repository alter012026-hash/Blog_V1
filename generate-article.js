#!/usr/bin/env node
/**
 * generate-article.js
 * Geração de artigos com fallback automático:
 *   1. Groq
 *   2. OpenRouter
 *   3. Gemini
 */

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const siteConfig = require("../site.config.js");

// ─── CLI Args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;

const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1], 10)
  : siteConfig.generation.articlesPerRun;

// ─── Helpers ────────────────────────────────────────────────────────────────
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

function buildTopic() {
  if (topicArg) return topicArg;

  const cat = randomItem(siteConfig.generation.categories);

  const seeds = {
    Editais: [
      "como interpretar um edital de concurso público",
      "o que observar no edital antes de se inscrever",
      "diferenças entre editais estaduais e federais",
    ],
    "Técnicas de Estudo": [
      "método pomodoro aplicado a concursos",
      "como fazer resumos eficientes para concursos",
      "revisão espaçada para concursos públicos",
      "como memorizar legislação para provas",
    ],
    "Concursos Abertos": [
      "melhores concursos públicos abertos este mês",
      "concursos com mais vagas para iniciantes",
    ],
    "Materiais Gratuitos": [
      "apostilas gratuitas para concursos públicos",
      "sites com questões comentadas gratuitas",
    ],
    "Cronograma de Estudos": [
      "como montar cronograma de estudos para concurso",
      "cronograma de 6 meses para aprovação",
    ],
    "Carreiras Públicas": [
      "carreira de auditor fiscal vale a pena",
      "diferenças entre cargos de nível médio e superior",
    ],
    "Questões Comentadas": [
      "como resolver questões de raciocínio lógico",
      "estratégia para questões de português em concursos",
    ],
  };

  const pool = seeds[cat] || [`dicas de ${cat} para concursos públicos`];
  return randomItem(pool);
}

function buildPrompt(topic) {
  const { tone, audienceLevel, minWords } = siteConfig.generation;

  return `Você é um especialista em ${siteConfig.niche}.
Escreva um artigo completo em Markdown sobre: "${topic}".

Requisitos:
- Mínimo de ${minWords} palavras
- Tom: ${tone}
- Público: ${audienceLevel}
- Estrutura: introdução, H2 com subtópicos, conclusão com CTA
- Inclua lista prática em pelo menos uma seção
- Português brasileiro natural e direto
- NÃO use frases genéricas
- Finalize com conclusão + CTA

Retorne APENAS Markdown começando com título (#).`;
}

// 🔥 FIX PRINCIPAL: data segura e consistente
function getSafeDate() {
  const now = new Date();

  if (isNaN(now.getTime())) {
    return new Date().toISOString();
  }

  return now.toISOString();
}

function buildFrontmatter(title, topic, category) {
  const slug = slugify(title || topic);

  const now = getSafeDate();

  const frontmatter = `---
title: "${title}"
date: "${now}"
category: "${category}"
description: "Guia completo sobre ${topic} para concursos públicos."
tags: ["${siteConfig.niche}", "${category.toLowerCase()}"]
---

`;

  return { slug, frontmatter };
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// ─── Providers (mantidos iguais) ─────────────────────────────────────────────
// (Groq, OpenRouter, Gemini permanecem iguais ao seu original)

// ─── Save Article ────────────────────────────────────────────────────────────
function saveArticle(markdown, topic, category) {
  const title = extractTitle(markdown) || topic;
  const { slug, frontmatter } = buildFrontmatter(title, topic, category);

  const postsDir = path.resolve(__dirname, "../posts");
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const filePath = path.join(postsDir, `${slug}.md`);
  fs.writeFileSync(filePath, frontmatter + markdown, "utf8");

  return filePath;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Gerando ${countArg} artigo(s)...\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < countArg; i++) {
    const topic = buildTopic();
    const category = randomItem(siteConfig.generation.categories);

    console.log(`📝 ${i + 1}/${countArg}: ${topic}`);

    try {
      const prompt = buildPrompt(topic);

      const { text, provider } = await generateWithFallback(prompt);

      const filePath = saveArticle(text, topic, category);

      console.log(`💾 Salvo: ${filePath}`);
      console.log(`📡 Provider: ${provider}\n`);

      success++;
    } catch (err) {
      console.error(`❌ Erro no artigo "${topic}": ${err.message}\n`);
      fail++;
    }

    if (i < countArg - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("──────────────────────────────");
  console.log(`✅ Sucesso: ${success}`);
  console.log(`❌ Falhas: ${fail}`);

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Erro fatal:", err.message);
  process.exit(1);
});