/**
 * news-scraper.js
 *
 * Busca notícias RECENTES e REAIS sobre concursos públicos (editais publicados,
 * provas marcadas, resultados, gabaritos, prorrogações) para alimentar o
 * pipeline de geração de artigos com fatos verdadeiros, datados e verificáveis
 * — em vez de depender só do pool estático de SEEDS (temas evergreen genéricos).
 *
 * Por quê Google News RSS e não scraping direto de PCI Concursos / bancas:
 *  - É um endpoint público, feito para consumo (RSS), sem bloqueio por robots.txt
 *    agressivo nem necessidade de headers especiais.
 *  - Agrega centenas de fontes (G1, PCI Concursos, Direção Concursos, portais
 *    estaduais) numa única chamada, então cobre muito mais editais do que
 *    fazer scraping de 1-2 sites manualmente.
 *  - Não exige API key nem custo.
 *
 * Não faz parsing de HTML de página nenhuma — só XML de RSS, com regex simples
 * (o projeto não tem xml2js/rss-parser como dependência e não vale a pena
 * adicionar uma lib só pra isso).
 */

const https = require("https");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(httpGet(res.headers.location));
        }
        if (res.statusCode !== 200) {
          res.resume();
          const err = new Error(`HTTP ${res.statusCode} em ${url}`);
          err.statusCode = res.statusCode;
          return reject(err);
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
  });
}

// O Google News RSS ocasionalmente responde 503/429 quando recebe várias
// requisições em sequência rápida (comum em CI/datacenter). Em vez de
// desistir na primeira falha, tenta de novo com backoff crescente antes de
// reportar erro — isso é o que resolve o "0 notícias encontradas" causado
// por bloqueio temporário, sem precisar trocar de fonte.
async function httpGetWithRetry(url, { retries = 3, baseDelayMs = 2000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await httpGet(url);
    } catch (err) {
      lastErr = err;
      const retryable = err.statusCode === 503 || err.statusCode === 429 || !err.statusCode;
      if (!retryable || attempt === retries) break;
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function decodeEntities(str = "") {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "") // remove tags HTML que às vezes vêm dentro do <description>
    .trim();
}

function extractTag(xmlItem, tag) {
  const match = xmlItem.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

/**
 * Faz o parsing manual de um feed RSS 2.0 (formato usado pelo Google News),
 * item por item, sem precisar de parser de XML completo.
 */
function parseRssItems(xml) {
  const items = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  for (const raw of itemMatches) {
    const title = extractTag(raw, "title");
    const link = extractTag(raw, "link");
    const pubDate = extractTag(raw, "pubDate");
    const description = extractTag(raw, "description");
    const sourceMatch = raw.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const source = sourceMatch ? decodeEntities(sourceMatch[1]) : "";

    if (title && link) {
      items.push({ title, link, pubDate, description, source });
    }
  }

  return items;
}

/**
 * Busca no Google News RSS por uma query específica, filtrado para BR/pt-BR.
 */
async function fetchGoogleNewsRSS(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  try {
    const xml = await httpGetWithRetry(url);
    return parseRssItems(xml);
  } catch (err) {
    console.warn(`⚠️  Falha ao buscar notícias para "${query}": ${err.message}`);
    return [];
  }
}

// Queries cobrindo os eventos que mais geram tráfego de busca no nicho:
// edital publicado, inscrições abertas, provas/resultados, principais bancas.
const NEWS_QUERIES = [
  "edital concurso público publicado",
  "concurso público inscrições abertas vagas",
  "resultado concurso público gabarito",
  "concurso público Cebraspe edital",
  "concurso público FGV edital",
  "concurso público Vunesp FCC edital",
  "concurso público prorrogação inscrições",
];

function isRecent(pubDate, maxAgeHours = 72) {
  if (!pubDate) return true; // sem data, não descarta — deixa a checagem de duplicidade filtrar
  const date = new Date(pubDate);
  if (isNaN(date.getTime())) return true;
  const ageHours = (Date.now() - date.getTime()) / 36e5;
  return ageHours <= maxAgeHours;
}

// Ruído comum em resultados de busca de notícias que não interessa ao nicho
// (concursos culturais/artísticos, "concurso de miss", loterias, etc.)
const NOISE_PATTERN = /miss|beleza|beauty|fotografia|redação escolar|loteria|sorteio|desenho infantil/i;

/**
 * Função principal: roda todas as queries, deduplica por link e por título
 * (títulos quase-idênticos entre fontes diferentes cobrindo a mesma notícia),
 * filtra ruído e notícias antigas, e devolve uma lista pronta para virar
 * tópicos de artigo.
 */
async function fetchAllConcursoNews({ maxAgeHours = 72 } = {}) {
  const all = [];
  for (const query of NEWS_QUERIES) {
    const items = await fetchGoogleNewsRSS(query);
    all.push(...items);
    // intervalo maior e com variação entre queries — várias chamadas rápidas
    // em sequência (típico de CI/datacenter) é o que costuma disparar 503/429
    await sleep(2500 + Math.floor(Math.random() * 1500));
  }

  const seenLinks = new Set();
  const seenTitleKeys = new Set();
  const result = [];

  for (const item of all) {
    if (seenLinks.has(item.link)) continue;
    if (NOISE_PATTERN.test(item.title)) continue;
    if (!isRecent(item.pubDate, maxAgeHours)) continue;

    // chave simplificada do título pra pegar quase-duplicatas entre fontes
    const titleKey = item.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 8)
      .join(" ");

    if (seenTitleKeys.has(titleKey)) continue;

    seenLinks.add(item.link);
    seenTitleKeys.add(titleKey);
    result.push(item);
  }

  return result;
}

module.exports = { fetchAllConcursoNews, fetchGoogleNewsRSS };
