// -----------------------------------------------------------------------
// Estatísticas de visitas — armazenamento em Upstash Redis (REST).
//
// Por que Redis e não arquivo/Git? O site roda na Vercel (filesystem somente
// leitura) e não tem banco de dados. Upstash Redis tem plano gratuito, é
// instalado em 1 clique pelo Marketplace da Vercel e dispensa dependências
// novas: aqui falamos com ele por fetch (API REST).
//
// Variáveis aceitas (a integração da Vercel cria um dos dois pares):
//   KV_REST_API_URL / KV_REST_API_TOKEN
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//
// Chaves (uma por dia, fuso America/Sao_Paulo):
//   pv:t:YYYY-MM-DD  contador de visualizações do dia
//   pv:u:YYYY-MM-DD  HyperLogLog de visitantes únicos do dia
//   pv:p:YYYY-MM-DD  hash  caminho -> visualizações
//   pv:r:YYYY-MM-DD  hash  origem  -> visualizações
//
// Privacidade: não há cookie nem armazenamento no navegador. O visitante é
// um hash de (IP + navegador + dia + segredo) que muda todo dia e não pode
// ser revertido para o IP.
// -----------------------------------------------------------------------

import crypto from "crypto";

const TZ = "America/Sao_Paulo";

/* ───────────── configuração ───────────── */

function getConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function isVisitStoreConfigured() {
  return Boolean(getConfig());
}

/** Executa uma lista de comandos Redis em uma única requisição HTTP. */
async function pipeline(commands) {
  const cfg = getConfig();
  if (!cfg) throw new Error("Armazenamento de visitas não configurado.");
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash respondeu ${res.status}`);
  const data = await res.json();
  return data.map((item) => {
    if (item && item.error) throw new Error(item.error);
    return item ? item.result : null;
  });
}

/* ───────────── datas (fuso de Brasília) ───────────── */

/** "YYYY-MM-DD" no fuso de São Paulo. */
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

/** Soma (ou subtrai) dias em uma string "YYYY-MM-DD" sem sofrer com fuso. */
export function addDays(key, delta) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Os últimos `count` dias terminando em `endKey`, do mais antigo ao mais novo. */
export function lastDays(count, endKey = dayKey()) {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) out.push(addDays(endKey, -i));
  return out;
}

/* ───────────── filtros e normalização ───────────── */

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|okhttp|scrapy/i;

export function isBot(userAgent) {
  if (!userAgent) return true;
  return BOT_RE.test(userAgent);
}

const STATIC_PATHS = new Set([
  "/", "/blog", "/simulado", "/materiais", "/concursos",
  "/contato", "/metodologia", "/privacidade", "/sobre",
]);

/**
 * Normaliza o caminho recebido do navegador e devolve null se não for uma
 * página pública conhecida. Validar contra uma lista fechada impede que
 * alguém infle o Redis enviando caminhos aleatórios.
 *
 * @param {string} raw
 * @param {Set<string>|string[]} knownSlugs slugs dos artigos existentes
 */
export function normalizePath(raw, knownSlugs = []) {
  if (typeof raw !== "string" || raw.length > 200) return null;
  let p = raw.split("#")[0].split("?")[0].trim();
  if (!p.startsWith("/")) return null;
  p = p.replace(/\/+$/, "") || "/";
  if (STATIC_PATHS.has(p)) return p;
  const m = p.match(/^\/blog\/([a-z0-9-]+)$/);
  if (m) {
    const set = knownSlugs instanceof Set ? knownSlugs : new Set(knownSlugs);
    if (set.has(m[1])) return p;
  }
  return null;
}

/** Reduz o referrer ao domínio. Devolve "Direto" se vazio ou do próprio site. */
export function normalizeReferrer(referrer, siteHost) {
  if (!referrer || typeof referrer !== "string") return "Direto";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    const own = String(siteHost || "").replace(/^www\./, "").replace(/:\d+$/, "").toLowerCase();
    if (!host || host === own) return "Direto";
    if (/^(l|m|lm)\.facebook\.com$|^facebook\.com$/.test(host)) return "facebook.com";
    if (/^(t\.co|twitter\.com|x\.com)$/.test(host)) return "x.com";
    if (/^google\./.test(host) || /\.google\./.test(host)) return "google";
    if (/^(bing|duckduckgo|yahoo|ecosia)\./.test(host)) return host.split(".")[0];
    if (/^(l\.)?instagram\.com$/.test(host)) return "instagram.com";
    return host.slice(0, 80);
  } catch {
    return "Direto";
  }
}

/** Hash diário e irreversível do visitante. */
export function visitorHash({ ip, userAgent, day }) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "passeja";
  return crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}|${day}|${secret}`)
    .digest("hex")
    .slice(0, 24);
}

/* ───────────── escrita ───────────── */

export async function recordVisit({ path, referrer, visitor, now = new Date() }) {
  const day = dayKey(now);
  await pipeline([
    ["INCR", `pv:t:${day}`],
    ["PFADD", `pv:u:${day}`, visitor],
    ["HINCRBY", `pv:p:${day}`, path, 1],
    ["HINCRBY", `pv:r:${day}`, referrer || "Direto", 1],
  ]);
}

/* ───────────── leitura ───────────── */

function hashToObject(flat) {
  const obj = {};
  if (!Array.isArray(flat)) return obj;
  for (let i = 0; i < flat.length; i += 2) obj[flat[i]] = Number(flat[i + 1]) || 0;
  return obj;
}

function topEntries(map, limit) {
  return Object.entries(map)
    .map(([key, views]) => ({ key, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/**
 * Lê as estatísticas dos últimos `range` dias.
 * Também busca o período imediatamente anterior (só visualizações) para
 * calcular a variação — exceto em períodos longos, para poupar comandos.
 */
export async function readStats(range, { titleBySlug = {} } = {}) {
  const days = lastDays(range);
  const withPrevious = range <= 90;
  const prevDays = withPrevious ? lastDays(range, addDays(days[0], -1)) : [];

  const commands = [];
  for (const d of days) {
    commands.push(["GET", `pv:t:${d}`]);
    commands.push(["PFCOUNT", `pv:u:${d}`]);
    commands.push(["HGETALL", `pv:p:${d}`]);
    commands.push(["HGETALL", `pv:r:${d}`]);
  }
  for (const d of prevDays) commands.push(["GET", `pv:t:${d}`]);

  const results = await pipeline(commands);

  const series = [];
  const pages = {};
  const refs = {};
  let cursor = 0;
  for (const d of days) {
    const views = Number(results[cursor]) || 0;
    const visitors = Number(results[cursor + 1]) || 0;
    const dayPages = hashToObject(results[cursor + 2]);
    const dayRefs = hashToObject(results[cursor + 3]);
    cursor += 4;
    series.push({ date: d, views, visitors });
    for (const [k, v] of Object.entries(dayPages)) pages[k] = (pages[k] || 0) + v;
    for (const [k, v] of Object.entries(dayRefs)) refs[k] = (refs[k] || 0) + v;
  }

  let previousViews = null;
  if (withPrevious) {
    previousViews = 0;
    for (let i = 0; i < prevDays.length; i += 1) previousViews += Number(results[cursor + i]) || 0;
  }

  const totalViews = series.reduce((sum, d) => sum + d.views, 0);
  const totalVisitors = series.reduce((sum, d) => sum + d.visitors, 0);
  const today = series[series.length - 1] || { views: 0, visitors: 0 };
  const yesterday = series[series.length - 2] || { views: 0, visitors: 0 };

  return {
    range,
    series,
    totals: {
      views: totalViews,
      visitors: totalVisitors,
      avgPerDay: Math.round((totalViews / Math.max(series.length, 1)) * 10) / 10,
      previousViews,
      today,
      yesterday,
    },
    pages: topEntries(pages, 15).map(({ key, views }) => {
      const slug = key.startsWith("/blog/") ? key.slice(6) : null;
      return { path: key, title: slug ? titleBySlug[slug] || slug : key === "/" ? "Página inicial" : key, views };
    }),
    referrers: topEntries(refs, 10).map(({ key, views }) => ({ source: key, views })),
  };
}
