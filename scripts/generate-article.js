#!/usr/bin/env node
/**
 * generate-article.js
 * Gera artigos com frontmatter completo + fallback Groq → OpenRouter → Gemini
 */
require("dotenv").config({ path: ".env.local", override: false });

const fs   = require("fs");
const path = require("path");
const siteConfig = require("../site.config.js");

// ─── CLI ──────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const topicArg = args.includes("--topic") ? args[args.indexOf("--topic") + 1] : null;
const countArg = args.includes("--count")
  ? parseInt(args[args.indexOf("--count") + 1], 10)
  : (siteConfig.generation?.articlesPerRun || 1);

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
  // Formato YYYY-MM-DD garantido, sem depender de fuso
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildTopic() {
  if (topicArg) return { topic: topicArg, category: randomItem(siteConfig.generation.categories) };

  const category = randomItem(siteConfig.generation.categories);
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
  const pool = seeds[category] || [`dicas sobre ${category} em concursos públicos`];
  return { topic: randomItem(pool), category };
}

// ─── Prompt robusto ───────────────────────────────────────────────────
function buildPrompt({ topic, category }) {
  const { tone, audienceLevel, minWords } = siteConfig.generation;
  return `Você é um especialista em concursos públicos no Brasil com 15 anos de experiência como professor e mentor de candidatos aprovados.

Escreva um artigo completo e prático em português brasileiro sobre: "${topic}"

REGRAS OBRIGATÓRIAS:
1. Mínimo de ${minWords || 1200} palavras
2. Tom: ${tone || "didático, direto e motivador"}
3. Público: ${audienceLevel || "candidatos iniciantes a intermediários"}
4. Use APENAS sintaxe Markdown válida:
   - Títulos com # ## ### (NUNCA use ===== ou ------)
   - Listas com - ou números
   - Negrito com **texto**
5. Estrutura obrigatória:
   - ## Introdução (contextualize o tema)
   - ## [3 a 5 seções de desenvolvimento com subtópicos ##]
   - ## Conclusão (resumo + chamada para ação)
6. Em pelo menos uma seção, inclua uma lista de dicas práticas numeradas
7. NÃO use frases genéricas como "é importante notar que" ou "vale ressaltar"
8. Escreva de forma direta como um mentor experiente falando com o candidato

RETORNE APENAS O CONTEÚDO MARKDOWN, começando com o título principal (## Introdução ou direto no conteúdo, sem o # do título pois ele vem no frontmatter).`;
}

// ─── Providers ────────────────────────────────────────────────────────
async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_API_KEY ausente");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
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

  if (res.status === 429 || res.status === 402) throw new Error("OpenRouter: limite atingido");
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`OpenRouter: ${data.error.message}`);
  return data.choices[0].message.content;
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

      if (res.status === 404 || res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) { console.log(`  ✅ Gemini: ${model}`); return text; }
    } catch (e) {
      console.warn(`  ⚠️  Gemini ${model}: ${e.message}`);
    }
  }
  throw new Error("Gemini: todos os modelos falharam");
}

async function generateWithFallback(prompt) {
  const providers = [
    { name: "Groq",        fn: callGroq },
    { name: "OpenRouter",  fn: callOpenRouter },
    { name: "Gemini",      fn: callGemini },
  ];

  for (const p of providers) {
    try {
      console.log(`  🔄 ${p.name}...`);
      const text = await p.fn(prompt);
      console.log(`  ✅ Gerado via ${p.name}`);
      return { text, provider: p.name };
    } catch (err) {
      console.warn(`  ❌ ${p.name}: ${err.message}`);
      await sleep(1500);
    }
  }
  throw new Error("Todos os provedores falharam");
}

// ─── Limpa markdown ruim da IA ────────────────────────────────────────
function cleanMarkdown(text) {
  return text
    // remove linhas de ===== ou ----- (setext headings que quebram o parser)
    .replace(/^[=\-]{3,}\s*$/gm, "")
    // garante que não haja # no início (pois o título vai no frontmatter)
    .replace(/^#\s+.+\n?/, "")
    .trim();
}

function buildExcerpt(content) {
  return content
    .replace(/^#+\s+.+$/gm, "")
    .replace(/[*_`#>\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

// ─── Salva artigo COM frontmatter completo ────────────────────────────
function saveArticle(rawMarkdown, topic, category) {
  const postsDir = path.resolve(__dirname, "../posts");
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  const cleanContent = cleanMarkdown(rawMarkdown);
  const date         = todayISO();
  const slug         = slugify(topic);
  const excerpt      = buildExcerpt(cleanContent);

  // Palavras-chave secundárias baseadas no tópico
  const secondaryKw  = topic.split(" ").filter(w => w.length > 4).slice(0, 3);

  const frontmatter = `---
title: "${topic.charAt(0).toUpperCase() + topic.slice(1)}"
date: "${date}"
category: "${category}"
excerpt: "${excerpt}"
targetKeyword: "${topic}"
secondaryKeywords: [${secondaryKw.map(k => `"${k}"`).join(", ")}]
readingTime: ""
---

`;

  const fileName = `${date}-${slug}.md`;
  const filePath = path.join(postsDir, fileName);
  fs.writeFileSync(filePath, frontmatter + cleanContent, "utf8");
  return filePath;
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔑 Chaves:");
  console.log(`   GROQ:        ${process.env.GROQ_API_KEY        ? "✅" : "❌"}`);
  console.log(`   OPENROUTER:  ${process.env.OPENROUTER_API_KEY  ? "✅" : "❌"}`);
  console.log(`   GEMINI:      ${process.env.GEMINI_API_KEY      ? "✅" : "❌"}`);
  console.log(`\n🚀 Gerando ${countArg} artigo(s)...\n`);

  let ok = 0, fail = 0;

  for (let i = 0; i < countArg; i++) {
    const { topic, category } = buildTopic();
    console.log(`📝 [${i+1}/${countArg}] "${topic}" (${category})`);

    try {
      const { text, provider } = await generateWithFallback(buildPrompt({ topic, category }));
      const file = saveArticle(text, topic, category);
      console.log(`   💾 ${path.relative(process.cwd(), file)}`);
      console.log(`   📡 ${provider}\n`);
      ok++;
    } catch (err) {
      console.error(`   🔴 FALHA: ${err.message}\n`);
      fail++;
    }

    if (i < countArg - 1) await sleep(3000);
  }

  console.log("─".repeat(48));
  console.log(`✅ ${ok} gerado(s)  ❌ ${fail} falha(s)`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => { console.error("ERRO FATAL:", err.message); process.exit(1); });
