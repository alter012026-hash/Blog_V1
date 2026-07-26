#!/usr/bin/env node
/**
 * scrape-noticias-concursos.js
 *
 * Roda ANTES do generate-article.js no workflow diário. Busca notícias reais
 * e recentes sobre concursos (via lib/news-scraper.js) e monta uma fila em
 * .pending-news-topics.json, que o generate-article.js consome com prioridade
 * sobre o pool estático de SEEDS — isso é o que dá autenticidade aos artigos:
 * em vez de "dicas para prova de português", o artigo nasce de um fato real
 * ("Edital do concurso X foi publicado com Y vagas, inscrições até Z").
 *
 * .used-news-links.json guarda permanentemente os links já usados, pra nunca
 * gerar dois artigos sobre a mesma notícia mesmo em execuções futuras.
 */

const fs = require("fs");
const path = require("path");
const { fetchAllConcursoNews } = require("../lib/news-scraper.js");

const pendingPath = path.resolve(__dirname, "../.pending-news-topics.json");
const usedLinksPath = path.resolve(__dirname, "../.used-news-links.json");

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  const usedLinks = new Set(loadJson(usedLinksPath, []));
  const pending = loadJson(pendingPath, []);
  const pendingLinks = new Set(pending.map((p) => p.link));

  console.log("🔎 Buscando notícias recentes sobre concursos públicos...");
  const news = await fetchAllConcursoNews({ maxAgeHours: 72 });
  console.log(`   ${news.length} notícias encontradas após filtro de ruído/duplicidade.`);

  let added = 0;
  for (const item of news) {
    if (usedLinks.has(item.link) || pendingLinks.has(item.link)) continue;

    pending.push({
      title: item.title,
      link: item.link,
      source: item.source || "",
      pubDate: item.pubDate || "",
      snippet: item.description || "",
      addedAt: new Date().toISOString(),
    });
    pendingLinks.add(item.link);
    added++;
  }

  // Mantém a fila com um teto razoável — se acumular demais (ex.: o pipeline
  // ficou parado por dias), descarta as mais antigas em vez de crescer infinito.
  const MAX_QUEUE = 40;
  const trimmed = pending.slice(-MAX_QUEUE);

  saveJson(pendingPath, trimmed);
  console.log(`✅ ${added} notícia(s) nova(s) adicionada(s) à fila. Fila atual: ${trimmed.length}.`);
}

main().catch((err) => {
  console.error("❌ Erro ao buscar notícias:", err.message);
  // Não derruba o workflow — se a busca falhar (ex.: Google News fora do ar),
  // o generate-article.js simplesmente cai de volta pro pool de SEEDS.
  process.exit(0);
});
