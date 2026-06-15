import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "posts");

function getUrls(mode, siteUrl) {
  if (!fs.existsSync(postsDir)) return [];
  const now = Date.now();
  const oneDayMs = 86400000;

  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => {
      if (mode !== "new") return true;
      const match = f.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!match) return false;
      return now - new Date(match[1]).getTime() < oneDayMs;
    })
    .map((f) => {
      const slug = f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
      return `${siteUrl}/blog/${slug}`;
    });
}

async function pingIndexNow(urls, siteUrl, key) {
  if (!key) return "  ⚠️  INDEXNOW_KEY não definida — pulando IndexNow.\n";
  let out = `📡 IndexNow — enviando ${urls.length} URL(s)...\n`;
  const endpoints = ["https://api.indexnow.org/indexnow", "https://www.bing.com/indexnow"];
  const body = JSON.stringify({
    host: siteUrl.replace(/https?:\/\//, ""),
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList: urls,
  });
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
      });
      out += `  ${res.status < 300 ? "✅" : "⚠️ "} ${ep} → ${res.status}\n`;
    } catch (e) {
      out += `  ❌ ${ep} → ${e.message}\n`;
    }
  }
  return out;
}

async function pingGoogleIndexing(urls) {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
  const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (!b64 && !filePath) {
    return "  ⚠️  Google Service Account não configurada.\n  → Configure GOOGLE_SERVICE_ACCOUNT_B64 no .env.local\n";
  }

  let out = `🔍 Google Indexing API — enviando ${urls.length} URL(s)...\n`;
  try {
    let sa;
    if (b64) {
      sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    } else {
      sa = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const { client_email, private_key: rawKey } = sa;
    const private_key = rawKey.replace(/\\n/g, "\n");

    const crypto = require("crypto");
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(`${header}.${payload}`);
    const jwt = `${header}.${payload}.${sign.sign(private_key, "base64url")}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) {
      return out + `  ⚠️  Token não obtido: ${JSON.stringify(tokenData)}\n`;
    }

    let ok = 0, errs = 0;
    for (const url of urls) {
      const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, type: "URL_UPDATED" }),
      });
      if (res.status === 200) { ok++; out += `  ✅ ${url}\n`; }
      else {
        errs++;
        const d = await res.json().catch(() => ({}));
        out += `  ⚠️  ${url} → ${res.status}: ${d?.error?.message || ""}\n`;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    out += `  📊 ${ok} OK | ${errs} erros\n`;
  } catch (e) {
    out += `  ❌ Erro: ${e.message}\n`;
  }
  return out;
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "new";

  // Lê site.config dinamicamente
  const raw = fs.readFileSync(path.join(process.cwd(), "site.config.js"), "utf8");
  const urlMatch = raw.match(/url\s*:\s*"([^"]*)"/);
  const siteUrl = (urlMatch?.[1] || "").replace(/\/$/, "");

  if (!siteUrl) {
    return NextResponse.json({ output: "❌ URL não configurada em site.config.js" });
  }

  const urls = getUrls(mode, siteUrl);
  let output = `🚀 Ping de Indexação\n   Site: ${siteUrl}\n   Modo: ${mode === "new" ? "posts das últimas 24h" : "todos os posts"} — ${urls.length} URL(s)\n\n`;

  output += "  ℹ️  Sitemap ping descontinuado pelo Google (jun/2023).\n     → Use Google Search Console para submeter o sitemap.\n\n";

  if (urls.length === 0) {
    output += "⚠️  Nenhuma URL encontrada para enviar.\n";
  } else {
    output += await pingIndexNow(urls, siteUrl, process.env.INDEXNOW_KEY || "");
    output += "\n";
    output += await pingGoogleIndexing(urls);
  }

  output += "\n✅ Concluído!";
  return NextResponse.json({ output });
}
