import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const qualityLogPath = path.join(process.cwd(), ".quality-log.json");
const signaturesLogPath = path.join(process.cwd(), ".content-signatures.json");
const postsDir = path.join(process.cwd(), "posts");

function readLog() {
  if (!fs.existsSync(qualityLogPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(qualityLogPath, "utf8"));
  } catch {
    return [];
  }
}

function writeLog(entries) {
  fs.writeFileSync(qualityLogPath, JSON.stringify(entries, null, 2));
}

// mantém só a entrada mais recente de cada arquivo (regenerações criam entradas novas)
function dedupeByFile(entries) {
  const byFile = new Map();
  for (const e of entries) {
    if (!e.file) continue;
    byFile.set(e.file, e);
  }
  return [...byFile.values()];
}

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const entries = dedupeByFile(readLog());

    const shallow = entries
      .filter((e) => e.status === "raso")
      .sort((a, b) => (a.wordCount || 0) - (b.wordCount || 0));

    const duplicates = entries
      .filter((e) => e.status === "duplicado")
      .map((e) => ({ ...e }));

    const ok = entries.filter((e) => e.status === "ok" || e.status === "ressalvas");
    const errors = entries.filter((e) => e.status === "erro");

    return NextResponse.json({
      total: entries.length,
      okCount: ok.length,
      shallowCount: shallow.length,
      duplicateCount: duplicates.length,
      errorCount: errors.length,
      shallow,
      duplicates,
      errors,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { action, file, topic } = await request.json();

    if (action !== "regenerate") {
      return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
    if (!file || !topic) {
      return NextResponse.json({ error: "file e topic são obrigatórios" }, { status: 400 });
    }

    const safeFile = file.replace(/[^a-zA-Z0-9\-_.]/g, "");
    if (!safeFile.endsWith(".md") || !fs.existsSync(path.join(postsDir, safeFile))) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    const safeTopic = topic.replace(/"/g, '\\"');

    const output = await new Promise((resolve, reject) => {
      exec(
        `node scripts/generate-article.js --topic "${safeTopic}" --force-file "${safeFile}"`,
        { cwd: process.cwd(), timeout: 120000 },
        (error, stdout, stderr) => {
          if (error) reject(new Error(stderr || error.message));
          else resolve(stdout);
        }
      );
    });

    return NextResponse.json({ ok: true, output });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { file } = await request.json();
    const safeFile = (file || "").replace(/[^a-zA-Z0-9\-_.]/g, "");
    const filePath = path.join(postsDir, safeFile);

    if (!safeFile.endsWith(".md") || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    fs.unlinkSync(filePath);

    // remove a entrada do log de qualidade
    const entries = readLog().filter((e) => e.file !== safeFile);
    writeLog(entries);

    // remove a assinatura de conteúdo correspondente
    if (fs.existsSync(signaturesLogPath)) {
      try {
        const sigs = JSON.parse(fs.readFileSync(signaturesLogPath, "utf8"));
        const filtered = sigs.filter((s) => s.file !== safeFile);
        fs.writeFileSync(signaturesLogPath, JSON.stringify(filtered, null, 2));
      } catch {}
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
