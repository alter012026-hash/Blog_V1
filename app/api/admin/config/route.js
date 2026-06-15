import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "site.config.js");

function readConfigRaw() {
  return fs.readFileSync(CONFIG_PATH, "utf8");
}

function patchField(raw, field, value) {
  const escaped = String(value).replace(/"/g, '\\"');
  const regex = new RegExp(`(${field}\\s*:\\s*)"[^"]*"`, "g");
  return raw.replace(regex, `$1"${escaped}"`);
}

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  // Importa dinamicamente para pegar os valores atuais
  const configPath = path.join(process.cwd(), "site.config.js");
  // Lê e extrai campos básicos via regex (evita cache do require)
  const raw = readConfigRaw();

  const extract = (key) => {
    const m = raw.match(new RegExp(`${key}\\s*:\\s*"([^"]*)"`));
    return m ? m[1] : "";
  };

  const extractBool = (key) => {
    const m = raw.match(new RegExp(`${key}\\s*:\\s*(true|false)`));
    return m ? m[1] === "true" : false;
  };

  return NextResponse.json({
    name: extract("name"),
    tagline: extract("tagline"),
    description: extract("description"),
    url: extract("url"),
    twitterHandle: extract("twitterHandle"),
    googleSiteVerification: extract("googleSiteVerification"),
    adsenseEnabled: extractBool("enabled"),
    adsensePublisherId: extract("publisherId"),
    adsenseSlotHeader: extract("header"),
    adsenseSlotInArticle: extract("inArticle"),
    adsenseSlotSidebar: extract("sidebar"),
    authorName: extract("author.*?name") || extract("name"),
    authorBio: extract("bio"),
  });
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const data = await request.json();
    let raw = readConfigRaw();

    const stringFields = [
      "name", "tagline", "description", "url",
      "twitterHandle", "googleSiteVerification",
      "publisherId", "bio",
    ];

    for (const field of stringFields) {
      if (data[field] !== undefined) {
        raw = patchField(raw, field, data[field]);
      }
    }

    // Adsense slots
    if (data.adsenseSlotHeader !== undefined) {
      raw = raw.replace(/(header\s*:\s*)"[^"]*"/, `$1"${data.adsenseSlotHeader}"`);
    }
    if (data.adsenseSlotInArticle !== undefined) {
      raw = raw.replace(/(inArticle\s*:\s*)"[^"]*"/, `$1"${data.adsenseSlotInArticle}"`);
    }
    if (data.adsenseSlotSidebar !== undefined) {
      raw = raw.replace(/(sidebar\s*:\s*)"[^"]*"/, `$1"${data.adsenseSlotSidebar}"`);
    }

    // Adsense enabled (boolean)
    if (data.adsenseEnabled !== undefined) {
      raw = raw.replace(
        /(enabled\s*:\s*)(true|false)/,
        `$1${data.adsenseEnabled ? "true" : "false"}`
      );
    }

    fs.writeFileSync(CONFIG_PATH, raw, "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
