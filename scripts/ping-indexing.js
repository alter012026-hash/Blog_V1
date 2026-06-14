#!/usr/bin/env node
/**
 * ping-indexing.js
 * 
 * Notifica Google, Bing e outros buscadores sobre URLs novas/atualizadas.
 * Usa IndexNow (Bing, Yandex, DuckDuckGo) + Google Indexing API.
 * 
 * Uso:
 *   node scripts/ping-indexing.js                     → pinga todos os posts
 *   node scripts/ping-indexing.js --new               → só posts das últimas 24h
 *   node scripts/ping-indexing.js --url /blog/meu-post → URL específica
 */

require("dotenv").config({ path: ".env.local", override: false });

const fs   = require("fs");
const path = require("path");

// ── Config ────────────────────────────────────────────────────────────────────
let siteConfigRaw = require("../site.config.js");
const siteConfig  = siteConfigRaw?.default || siteConfigRaw || {};
const SITE_URL    = (siteConfig.url || "").replace(/\/$/, "");

const INDEXNOW_KEY      = process.env.INDEXNOW_KEY      || "";
const GOOGLE_INDEX_KEY  = process.env.GOOGLE_INDEX_KEY  || ""; // Service Account JSON (base64 ou path)

if (!SITE_URL) {
  console.error("❌ site.config.js não tem 'url' definida.");
  process.exit(1);
}

// ── CLI Args ──────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const onlyNew   = args.includes("--new");
const singleUrl = args.includes("--url") ? args[args.indexOf("--url") + 1] : null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getPostUrls() {
  const postsDir = path.resolve(__dirname, "../posts");
  if (!fs.existsSync(postsDir)) return [];

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => {
      if (!onlyNew) return true;
      const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return false;
      const fileDate = new Date(dateMatch[1]).getTime();
      return now - fileDate < oneDayMs;
    })
    .map((f) => {
      const slug = f
        .replace(/^\d{4}-\d{2}-\d{2}-/, "")
        .replace(/\.md$/, "");
      return `${SITE_URL}/blog/${slug}`;
    });
}

// ── IndexNow (Bing, Yandex, DuckDuckGo) ──────────────────────────────────────
async function pingIndexNow(urls) {
  if (!INDEXNOW_KEY) {
    console.log("⚠️  INDEXNOW_KEY não definida — pulando IndexNow.");
    console.log("   → Crie uma chave em https://www.indexnow.org e adicione ao .env.local");
    return;
  }

  console.log(`\n📡 IndexNow — enviando ${urls.length} URL(s)...`);

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];

  const body = JSON.stringify({
    host:    SITE_URL.replace("https://", "").replace("http://", ""),
    key:     INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  });

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
      });

      const status = res.status;
      if (status === 200 || status === 202) {
        console.log(`  ✅ ${endpoint} → ${status}`);
      } else {
        const text = await res.text().catch(() => "");
        console.log(`  ⚠️  ${endpoint} → ${status} ${text.slice(0, 100)}`);
      }
    } catch (err) {
      console.log(`  ❌ ${endpoint} → ${err.message}`);
    }
    await sleep(500);
  }
}

// ── Google Indexing API ───────────────────────────────────────────────────────
// Usa JWT manual (sem dependência extra do googleapis)
async function getGoogleAccessToken() {
  let serviceAccountJson;

  // Aceita JSON em base64 (variável de ambiente) ou path para arquivo
  if (process.env.GOOGLE_SERVICE_ACCOUNT_B64) {
    serviceAccountJson = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
    );
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
    serviceAccountJson = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_PATH, "utf8")
    );
  } else {
    return null;
  }

  const { client_email, private_key } = serviceAccountJson;

  const now   = Math.floor(Date.now() / 1000);
  const claim = {
    iss:   client_email,
    scope: "https://www.googleapis.com/auth/indexing",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  };

  // JWT simples usando Node crypto (sem deps externas)
  const crypto  = require("crypto");
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const sign    = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(private_key, "base64url");
  const jwt = `${header}.${payload}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  return data.access_token || null;
}

async function pingGoogle(urls) {
  console.log(`\n🔍 Google Indexing API — enviando ${urls.length} URL(s)...`);

  let token;
  try {
    token = await getGoogleAccessToken();
  } catch (err) {
    console.log(`  ⚠️  Não foi possível obter token Google: ${err.message}`);
    console.log("  → Configure GOOGLE_SERVICE_ACCOUNT_B64 ou GOOGLE_SERVICE_ACCOUNT_PATH no .env.local");
    return;
  }

  if (!token) {
    console.log("  ⚠️  Google Service Account não configurada — pulando Google Indexing API.");
    console.log("  → Veja README.indexing.md para instruções de configuração.");
    return;
  }

  let ok = 0, errs = 0;

  for (const url of urls) {
    try {
      const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ url, type: "URL_UPDATED" }),
      });

      if (res.status === 200) {
        ok++;
        console.log(`  ✅ ${url}`);
      } else {
        errs++;
        const data = await res.json().catch(() => ({}));
        console.log(`  ⚠️  ${url} → ${res.status}: ${data?.error?.message || ""}`);
      }
    } catch (err) {
      errs++;
      console.log(`  ❌ ${url} → ${err.message}`);
    }

    // Respeita quota: 200 req/dia, max ~1 req/s
    await sleep(600);
  }

  console.log(`  📊 Google: ${ok} OK | ${errs} erros`);
}

// ── Sitemap ping (fallback clássico para Google) ──────────────────────────────
async function pingSitemapGoogle() {
  const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap.xml`);
  const pingUrl    = `https://www.google.com/ping?sitemap=${sitemapUrl}`;

  try {
    const res = await fetch(pingUrl);
    if (res.status === 200) {
      console.log(`\n  ✅ Sitemap ping Google → OK`);
    } else {
      console.log(`\n  ⚠️  Sitemap ping Google → ${res.status}`);
    }
  } catch (err) {
    console.log(`\n  ❌ Sitemap ping Google → ${err.message}`);
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Ping de Indexação — Aprovado Já");
  console.log(`   Site: ${SITE_URL}`);

  let urls;

  if (singleUrl) {
    urls = [`${SITE_URL}${singleUrl.startsWith("/") ? singleUrl : "/" + singleUrl}`];
    console.log(`   Modo: URL única → ${urls[0]}`);
  } else {
    urls = getPostUrls();
    const mode = onlyNew ? "posts das últimas 24h" : "todos os posts";
    console.log(`   Modo: ${mode} — ${urls.length} URL(s) encontrada(s)`);
  }

  if (urls.length === 0) {
    console.log("\n⚠️  Nenhuma URL para enviar.");
    return;
  }

  // Sempre faz o ping do sitemap
  await pingSitemapGoogle();

  // IndexNow (Bing / Yandex / DDG)
  await pingIndexNow(urls);

  // Google Indexing API (job postings / livestream — funciona melhor para esses tipos,
  // mas notifica o Google crawler de qualquer URL)
  await pingGoogle(urls);

  console.log("\n✅ Concluído!\n");
}

main().catch((err) => {
  console.error("ERRO FATAL:", err.message);
  process.exit(1);
});
