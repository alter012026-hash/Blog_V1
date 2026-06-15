import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "site.config.js");

function readConfigRaw() {
  return fs.readFileSync(CONFIG_PATH, "utf8");
}

function parseAffiliates(raw) {
  // Extrai o bloco de affiliates do JS usando regex
  const match = raw.match(/affiliates\s*:\s*(\[[\s\S]*?\]),\s*\n\s*\/\//);
  if (!match) return [];
  try {
    // eslint-disable-next-line no-eval
    return eval(match[1]);
  } catch {
    return [];
  }
}

function serializeAffiliate(aff) {
  const keywords = aff.keywords.map((k) => `"${k}"`).join(", ");
  return `    {\n      id: "${aff.id}",\n      name: "${aff.name}",\n      url: "${aff.url}",\n      keywords: [${keywords}],\n      cta: "${aff.cta}",\n    }`;
}

function updateAffiliatesInConfig(raw, affiliates) {
  const newBlock = `affiliates: [\n${affiliates.map(serializeAffiliate).join(",\n")},\n  ],`;
  return raw.replace(/affiliates\s*:\s*\[[\s\S]*?\],(\s*\n\s*\/\/)/, `${newBlock}$1`);
}

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const raw = readConfigRaw();
  const affiliates = parseAffiliates(raw);
  return NextResponse.json({ affiliates });
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const { affiliates } = await request.json();
    const raw = readConfigRaw();
    const updated = updateAffiliatesInConfig(raw, affiliates);
    fs.writeFileSync(CONFIG_PATH, updated, "utf8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
