#!/usr/bin/env node
/**
 * generate-article.js
 * Geração de artigos com fallback automático:
 *   1. Groq  (mais rápido, gratuito generoso)
 *   2. OpenRouter (acesso a vários modelos)
 *   3. Gemini (fallback final do Google)
 *
 * Uso:
 *   npm run generate-article
 *   node scripts/generate-article.js --topic "como estudar direito" --count 2
 */

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const siteConfig = require("../site.config.js");

// ─── CLI Args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const topicArg = args.includes("--topic")
  ? args[args.indexOf("--topic") + 1]
  : null;
const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1], 10)
  : siteConfig.generation.articlesPerRun;

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  return `Você é um especialista em ${siteConfig.niche}. Escreva um artigo completo em Markdown sobre: "${topic}".

Requisitos:
- Mínimo de ${minWords} palavras
- Tom: ${tone}
- Público: ${audienceLevel}
- Estrutura: introdução, H2 com subtópicos, conclusão com CTA
- Inclua uma lista de pontos práticos em pelo menos uma seção
- NÃO use termos genéricos como "é importante notar que"
- Escreva em português brasileiro informal mas profissional
- Finalize com um parágrafo de conclusão e chamada para ação

Retorne APENAS o Markdown, começando com o título (# Título).`;
}

function buildFrontmatter(title, topic, category) {
  const now = new Date().toISOString().split("T")[0];
  const slug = slugify(title || topic);
  return { slug, frontmatter: `---
title: "${title}"
date: "${now}"
category: "${category}"
description: "Guia completo sobre ${topic} para quem quer passar em concursos públicos."
tags: ["${siteConfig.niche}", "${category.toLowerCase()}"]
---

` };
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// ─── Provider: Groq ───────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key || key.includes("coloque_")) throw new Error("GROQ_API_KEY não configurada");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (res.status === 429) throw new Error("Groq: limite de crédito/rate atingido");
  if (!res.ok) throw new Error(`Groq: erro HTTP ${res.status}`);

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Provider: OpenRouter ─────────────────────────────────────────────────────
async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key.includes("coloque_")) throw new Error("OPENROUTER_API_KEY não configurada");

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
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (res.status === 429 || res.status === 402)
    throw new Error("OpenRouter: limite de crédito/rate atingido");
  if (!res.ok) throw new Error(`OpenRouter: erro HTTP ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(`OpenRouter: ${data.error.message}`);
  return data.choices[0].message.content;
}

// ─── Provider: Gemini ─────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY não configurada");

  // Tenta gemini-2.0-flash primeiro (mais rápido e generoso no free tier)
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

  for (const model of models) {
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

      if (res.status === 429 || res.status === 503) {
        console.warn(`  ⚠️  Gemini ${model}: rate limit, tentando próximo modelo...`);
        continue;
      }
      if (!res.ok) throw new Error(`Gemini ${model}: HTTP ${res.status}`);

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`Gemini ${model}: resposta vazia`);
      console.log(`  ✅ Gemini usou modelo: ${model}`);
      return text;
    } catch (err) {
      if (models.indexOf(model) === models.length - 1) throw err;
      console.warn(`  ⚠️  ${err.message}, tentando próximo modelo Gemini...`);
    }
  }
  throw new Error("Gemini: todos os modelos falharam");
}

// ─── Fallback Chain ───────────────────────────────────────────────────────────
async function generateWithFallback(prompt) {
  const providers = [
    { name: "Groq", fn: callGroq },
    { name: "OpenRouter", fn: callOpenRouter },
    { name: "Gemini", fn: callGemini },
  ];

  const errors = [];
  for (const provider of providers) {
    try {
      console.log(`  🔄 Tentando ${provider.name}...`);
      const text = await provider.fn(prompt);
      console.log(`  ✅ Gerado via ${provider.name}`);
      return { text, provider: provider.name };
    } catch (err) {
      console.warn(`  ❌ ${provider.name} falhou: ${err.message}`);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  throw new Error(
    `Todos os provedores falharam:\n${errors.map((e) => `  • ${e}`).join("\n")}`
  );
}

// ─── Save Article ─────────────────────────────────────────────────────────────
function saveArticle(markdown, topic, category) {
  const title = extractTitle(markdown) || topic;
  const { slug, frontmatter } = buildFrontmatter(title, topic, category);
  const postsDir = path.resolve(__dirname, "../posts");
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  const filePath = path.join(postsDir, `${slug}.md`);
  fs.writeFileSync(filePath, frontmatter + markdown, "utf8");
  return filePath;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Iniciando geração de ${countArg} artigo(s)...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < countArg; i++) {
    const topic = buildTopic();
    const category = randomItem(siteConfig.generation.categories);

    console.log(`📝 Artigo ${i + 1}/${countArg}: "${topic}"`);
    console.log(`   Categoria: ${category}`);

    try {
      const prompt = buildPrompt(topic);
      const { text, provider } = await generateWithFallback(prompt);
      const filePath = saveArticle(text, topic, category);
      console.log(`   💾 Salvo em: ${path.relative(process.cwd(), filePath)}`);
      console.log(`   📡 Provedor usado: ${provider}\n`);
      successCount++;
    } catch (err) {
      console.error(`   🔴 FALHA TOTAL no artigo "${topic}":\n   ${err.message}\n`);
      failCount++;
    }

    // Pausa entre artigos para evitar rate limit
    if (i < countArg - 1) {
      console.log("   ⏳ Aguardando 3s antes do próximo artigo...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("─".repeat(50));
  console.log(`✅ Concluído: ${successCount} artigo(s) gerado(s), ${failCount} falha(s)`);
  if (failCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Erro fatal:", err.message);
  process.exit(1);
});
