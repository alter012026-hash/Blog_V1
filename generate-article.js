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

// ─── FIX: Title Case + siglas ────────────────────────────────────────────────
// Lista de siglas que devem ficar 100% em caixa alta, independente de posição.
const ACRONYMS = [
  "INSS", "STF", "STJ", "TRF", "TRT", "TCU", "TJ", "MP", "PF", "PRF", "PM",
  "PC", "CNH", "CPF", "CEP", "ENEM", "CESPE", "CEBRASPE", "CESGRANRIO",
  "FCC", "VUNESP", "FGV", "IBGE", "INEP", "ANS", "ANVISA", "BB", "CEF",
];

// Palavras de ligação que ficam minúsculas no meio do título (estilo título PT-BR)
const MINOR_WORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o",
  "as", "os", "no", "na", "nos", "nas", "ou", "um", "uma", "que", "por",
]);

function toTitleCase(str) {
  const words = str.trim().split(/\s+/);
  return words
    .map((word, i) => {
      const upper = word.toUpperCase().replace(/[.,;:!?]/g, "");
      if (ACRONYMS.includes(upper)) {
        // preserva pontuação colada, se houver (ex: "INSS:" )
        const punct = word.match(/[.,;:!?]+$/);
        return upper + (punct ? punct[0] : "");
      }

      const clean = word.toLowerCase();
      const cleanNoPunct = clean.replace(/[.,;:!?]/g, "");
      if (i !== 0 && MINOR_WORDS.has(cleanNoPunct)) {
        return clean;
      }

      return clean.charAt(0).toUpperCase() + clean.slice(1);
    })
    .join(" ");
}

// ─── FIX: controle de tópicos/slugs já usados ────────────────────────────────
const USED_TOPICS_LOG = path.resolve(__dirname, "../.used-topics.json");

function getPostsDir() {
  return path.resolve(__dirname, "../posts");
}

function getExistingSlugs() {
  const postsDir = getPostsDir();
  if (!fs.existsSync(postsDir)) return new Set();
  return new Set(
    fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
  );
}

function loadUsedTopics() {
  if (!fs.existsSync(USED_TOPICS_LOG)) return [];
  try {
    return JSON.parse(fs.readFileSync(USED_TOPICS_LOG, "utf8"));
  } catch {
    return [];
  }
}

function saveUsedTopic(topic) {
  const used = loadUsedTopics();
  used.push(topic);
  // mantém só os últimos 300 pra não crescer infinito
  fs.writeFileSync(
    USED_TOPICS_LOG,
    JSON.stringify(used.slice(-300), null, 2),
    "utf8"
  );
}

// ─── Banco de tópicos ─────────────────────────────────────────────────────────
const SEEDS = {
  Editais: [
    "como interpretar um edital de concurso público",
    "o que observar no edital antes de se inscrever",
    "diferenças entre editais estaduais e federais",
    "principais erros ao ler um edital de concurso",
    "glossário de termos comuns em editais públicos",
    "como acompanhar publicações de editais novos",
  ],
  "Técnicas de Estudo": [
    "método pomodoro aplicado a concursos",
    "como fazer resumos eficientes para concursos",
    "revisão espaçada para concursos públicos",
    "como memorizar legislação para provas",
    "técnicas de leitura ativa para concurseiros",
    "como estudar concurso trabalhando o dia todo",
    "mapas mentais para concursos públicos",
  ],
  "Concursos Abertos": [
    "melhores concursos públicos abertos este mês",
    "concursos com mais vagas para iniciantes",
    "concursos com salários acima de 5 mil",
    "concursos da área de saúde abertos",
    "concursos para nível médio com inscrições abertas",
  ],
  "Materiais Gratuitos": [
    "apostilas gratuitas para concursos públicos",
    "sites com questões comentadas gratuitas",
    "canais no youtube para estudar para concursos",
    "aplicativos gratuitos para revisar matérias de concurso",
  ],
  "Cronograma de Estudos": [
    "como montar cronograma de estudos para concurso",
    "cronograma de 6 meses para aprovação",
    "cronograma de estudos para quem trabalha",
    "como distribuir matérias na semana de estudos",
  ],
  "Carreiras Públicas": [
    "carreira de auditor fiscal vale a pena",
    "diferenças entre cargos de nível médio e superior",
    "carreira no INSS: como funciona",
    "carreiras públicas com maior estabilidade",
    "vale a pena prestar concurso para tribunal",
  ],
  "Questões Comentadas": [
    "como resolver questões de raciocínio lógico",
    "estratégia para questões de português em concursos",
    "como interpretar questões de direito administrativo",
    "técnicas para questões de matemática financeira em concursos",
  ],
};

function buildTopicAndCategory(usedTopics, existingSlugs) {
  if (topicArg) {
    return { topic: topicArg, category: randomItem(siteConfig.generation.categories) };
  }

  // tenta algumas vezes achar uma combinação tópico+categoria ainda não usada
  const MAX_ATTEMPTS = 15;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const category = randomItem(siteConfig.generation.categories);
    const pool = SEEDS[category] || [`dicas de ${category} para concursos públicos`];

    // filtra tópicos já usados recentemente
    const available = pool.filter((t) => !usedTopics.includes(t));
    const finalPool = available.length > 0 ? available : pool;

    const topic = randomItem(finalPool);
    const slug = slugify(topic);

    if (!existingSlugs.has(slug) && !usedTopics.includes(topic)) {
      return { topic, category };
    }
  }

  // fallback: se não achou nada livre depois de várias tentativas,
  // gera um tópico com variação pra não travar o pipeline
  const category = randomItem(siteConfig.generation.categories);
  const pool = SEEDS[category] || [`dicas de ${category} para concursos públicos`];
  const base = randomItem(pool);
  const variation = randomItem([
    "guia atualizado",
    "passo a passo",
    "dicas práticas",
    "o que mudou em 2026",
  ]);
  return { topic: `${base} (${variation})`, category };
}

function buildPrompt(topic) {
  const { tone, audienceLevel, minWords } = siteConfig.generation;

  return `Você é um especialista em ${siteConfig.niche}.
Escreva um artigo completo em Markdown sobre: "${topic}".

Requisitos:
- Mínimo de ${minWords} palavras
- Tom: ${tone}
- Público: ${audienceLevel}
- Estrutura: H2 com subtópicos, conclusão com CTA
- Inclua lista prática em pelo menos uma seção
- Português brasileiro natural e direto
- NÃO use frases genéricas
- Finalize com conclusão + CTA

IMPORTANTE sobre o título (linha que começa com #):
- Use Capitalização de Título (primeira letra de cada palavra principal em maiúscula)
- Mantenha siglas sempre em maiúsculas (ex: INSS, STF, CNH)
- NÃO escreva o título inteiro em minúsculas

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
  const normalizedTitle = toTitleCase(title || topic);
  const slug = slugify(normalizedTitle);

  const now = getSafeDate();

  const frontmatter = `---
title: "${normalizedTitle}"
date: "${now}"
category: "${category}"
description: "Guia completo sobre ${topic} para concursos públicos."
tags: ["${siteConfig.niche}", "${category.toLowerCase()}"]
---

`;

  return { slug, frontmatter, normalizedTitle };
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// ─── Providers (mantidos iguais) ─────────────────────────────────────────────
// (Groq, OpenRouter, Gemini permanecem iguais ao seu original)

// ─── Save Article ────────────────────────────────────────────────────────────
function saveArticle(markdown, topic, category) {
  const rawTitle = extractTitle(markdown) || topic;
  const { slug, frontmatter, normalizedTitle } = buildFrontmatter(rawTitle, topic, category);

  // também normaliza o H1 dentro do corpo do markdown, pra não ficar
  // diferente do título do frontmatter
  const bodyWithoutOldTitle = markdown.replace(/^#\s+.+$/m, `# ${normalizedTitle}`);

  const postsDir = getPostsDir();
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  const filePath = path.join(postsDir, `${slug}.md`);
  fs.writeFileSync(filePath, frontmatter + bodyWithoutOldTitle, "utf8");

  return filePath;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Gerando ${countArg} artigo(s)...\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < countArg; i++) {
    const usedTopics = loadUsedTopics();
    const existingSlugs = getExistingSlugs();
    const { topic, category } = buildTopicAndCategory(usedTopics, existingSlugs);

    console.log(`📝 ${i + 1}/${countArg}: [${category}] ${topic}`);

    try {
      const prompt = buildPrompt(topic);

      const { text, provider } = await generateWithFallback(prompt);

      const filePath = saveArticle(text, topic, category);
      saveUsedTopic(topic);

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