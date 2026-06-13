#!/usr/bin/env node

/**
 * GERADOR DE ARTIGOS VIA ANTHROPIC API
 * 
 * Uso:
 *   node scripts/generate-article.js                    → gera N artigos (config)
 *   node scripts/generate-article.js --topic "tema"     → gera artigo sobre tema específico
 *   node scripts/generate-article.js --count 1          → gera 1 artigo
 * 
 * Requisito: ANTHROPIC_API_KEY no ambiente
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const config = require("../site.config");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Parsing de argumentos ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const topicArg = args.includes("--topic") ? args[args.indexOf("--topic") + 1] : null;
const countArg = args.includes("--count") ? parseInt(args[args.indexOf("--count") + 1]) : null;
const articlesToGenerate = countArg || config.generation.articlesPerRun;

// ── Utilitários ───────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getExistingTitles() {
  const postsDir = path.join(__dirname, "../posts");
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const content = fs.readFileSync(path.join(postsDir, f), "utf8");
      const match = content.match(/^title:\s*"(.+)"/m);
      return match ? match[1] : "";
    })
    .filter(Boolean);
}

// ── Prompt de geração de tópico ───────────────────────────────────────────
async function generateTopic(category, existingTitles) {
  const titlesContext = existingTitles.length > 0
    ? `\n\nARTIGOS JÁ PUBLICADOS (não repita estes temas):\n${existingTitles.slice(-30).join("\n")}`
    : "";

  const prompt = `Você é um estrategista de conteúdo SEO especializado em ${config.niche}.

Gere UM tópico de artigo para a categoria "${category}" que:
- Tenha alto volume de busca no Brasil
- Responda uma dúvida real e específica do público
- Tenha intenção de busca clara (informacional ou comercial)
- Seja único e diferente dos artigos existentes
- Use linguagem natural como as pessoas realmente pesquisam${titlesContext}

Responda APENAS com um objeto JSON no formato:
{
  "title": "Título SEO do artigo (máx 65 caracteres)",
  "searchIntent": "o que o leitor quer resolver",
  "targetKeyword": "palavra-chave principal",
  "secondaryKeywords": ["kw2", "kw3", "kw4"]
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Prompt principal de artigo (E-E-A-T otimizado) ───────────────────────
async function generateArticle(topic, category) {
  const affiliateContext = config.affiliates
    .map(a => `- ${a.name}: ${a.url} | Palavras-chave: ${a.keywords.join(", ")} | CTA: "${a.cta}"`)
    .join("\n");

  const prompt = `Você é um especialista em ${config.niche} com 10+ anos de experiência prática, escrevendo para o blog "${config.name}".

TAREFA: Escreva um artigo completo e profundo sobre:
Título: ${topic.title}
Intenção de busca: ${topic.searchIntent}
Palavra-chave principal: ${topic.targetKeyword}
Palavras-chave secundárias: ${topic.secondaryKeywords.join(", ")}
Categoria: ${category}
Tom: ${config.generation.tone}
Público: ${config.generation.audienceLevel}

DIRETRIZES DE QUALIDADE (E-E-A-T do Google):
1. Demonstre EXPERIÊNCIA REAL: use exemplos concretos, números reais, situações do dia a dia brasileiro
2. Demonstre EXPERTISE: explique o "porquê" por trás de cada recomendação
3. Seja AUTORITATIVO: cite dados, pesquisas ou referências quando relevante
4. Gere CONFIANÇA: reconheça limitações, não prometa resultados impossíveis
5. Mínimo de ${config.generation.minWords} palavras com conteúdo denso e útil
6. Use headers H2 e H3 semânticos com variações da palavra-chave
7. Inclua exemplos práticos, cálculos ou comparações quando aplicável
8. Termine com uma conclusão acionável e CTA natural

LINKS DE AFILIADO (insira de forma natural e contextual, NUNCA forçada):
${affiliateContext}
- Insira no máximo 2 links de afiliado por artigo
- Apenas quando o contexto for genuinamente relevante
- Use o CTA fornecido próximo ao link

FORMATO DE SAÍDA (apenas o conteúdo abaixo, sem comentários):
---
title: "${topic.title}"
date: "${today()}"
category: "${category}"
excerpt: "[descrição atraente de 155 caracteres máximo]"
targetKeyword: "${topic.targetKeyword}"
secondaryKeywords: [${topic.secondaryKeywords.map(k => `"${k}"`).join(", ")}]
readingTime: "[X min]"
---

[CORPO DO ARTIGO EM MARKDOWN]`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text;
}

// ── Salvar artigo ─────────────────────────────────────────────────────────
function saveArticle(content, title) {
  const postsDir = path.join(__dirname, "../posts");
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

  const slug = slugify(title);
  const filename = `${today()}-${slug}.md`;
  const filepath = path.join(postsDir, filename);

  // Evitar sobrescrever
  if (fs.existsSync(filepath)) {
    const alt = `${today()}-${slug}-${Date.now()}.md`;
    fs.writeFileSync(path.join(postsDir, alt), content, "utf8");
    return alt;
  }

  fs.writeFileSync(filepath, content, "utf8");
  return filename;
}

// ── Loop principal ────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Gerando ${articlesToGenerate} artigo(s) para "${config.name}"...\n`);

  const existingTitles = getExistingTitles();
  const categories = config.generation.categories;
  let categoryIndex = existingTitles.length % categories.length; // rodízio

  for (let i = 0; i < articlesToGenerate; i++) {
    const category = categories[categoryIndex % categories.length];
    categoryIndex++;

    try {
      // 1. Gerar tópico
      console.log(`[${i + 1}/${articlesToGenerate}] 🔍 Buscando tópico em "${category}"...`);
      let topic;
      
      if (topicArg && i === 0) {
        // Tópico manual
        topic = {
          title: topicArg,
          searchIntent: "informação sobre o tema solicitado",
          targetKeyword: topicArg.toLowerCase(),
          secondaryKeywords: config.keywords.slice(0, 3),
        };
      } else {
        topic = await generateTopic(category, existingTitles);
      }

      console.log(`    📝 Tópico: ${topic.title}`);
      console.log(`    🎯 Keyword: ${topic.targetKeyword}`);

      // 2. Gerar artigo
      console.log(`    ✍️  Gerando artigo...`);
      const content = await generateArticle(topic, category);

      // 3. Salvar
      const filename = saveArticle(content, topic.title);
      existingTitles.push(topic.title);

      console.log(`    ✅ Salvo: posts/${filename}\n`);

      // Delay entre requisições para não sobrecarregar a API
      if (i < articlesToGenerate - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }

    } catch (err) {
      console.error(`    ❌ Erro ao gerar artigo ${i + 1}:`, err.message);
    }
  }

  console.log("✨ Geração concluída!\n");
}

main().catch(console.error);
