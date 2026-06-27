import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import fs from "fs";
import path from "path";
import { generateValidatedArticle, generateCuriosity, buildArticleFile } from "../../../../lib/article-generator";
import { commitFile, deleteFile, getFile, triggerVercelDeploy } from "../../../../lib/github-commit";
import config from "../../../../site.config.js";

const qualityLogPath = path.join(process.cwd(), ".quality-log.json");

const QUALITY_LOG_REPO_PATH = ".quality-log.json";
const SIGNATURES_REPO_PATH = ".content-signatures.json";

// ── Leitura: usa o filesystem local (somente leitura) ──────────────────
// Isso funciona bem mesmo na Vercel, porque o build inclui esses arquivos
// como vieram do último commit no Git — GET nunca precisa escrever nada.
function readLocalJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
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
    const entries = dedupeByFile(readLocalJson(qualityLogPath, []));

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

// ── Escrita: tudo via GitHub Contents API ───────────────────────────────
// Nunca usa fs.writeFileSync em produção: o filesystem da Vercel é read-only
// (ou, no máximo, /tmp efêmero), então qualquer escrita local se perderia no
// próximo cold start / deploy e nunca apareceria no Git. Em vez disso, este
// endpoint comita o resultado direto no repositório — exatamente como o
// .github/workflows/generate-articles.yml já faz com `git commit && git push`
// — e o push aciona o build normal da Vercel (mais o deploy hook, se configurado).
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
    if (!safeFile.endsWith(".md")) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    // Busca o post atual direto do GitHub (fonte da verdade), não do disco local,
    // pra garantir que estamos lendo o conteúdo realmente publicado.
    const existing = await getFile(`posts/${safeFile}`);
    if (!existing) {
      return NextResponse.json({ error: "Arquivo não encontrado no repositório" }, { status: 404 });
    }

    const existingFrontmatter = {
      date: existing.content.match(/^date:\s*"([^"]*)"/m)?.[1],
      category: existing.content.match(/^category:\s*"([^"]*)"/m)?.[1],
      curiosity: existing.content.match(/^curiosity:\s*"([^"]*)"/m)?.[1],
    };

    // Assinaturas de conteúdo existentes, para checar similaridade (igual ao script CLI).
    const signaturesFile = await getFile(SIGNATURES_REPO_PATH);
    const signatures = signaturesFile ? JSON.parse(signaturesFile.content || "[]") : [];

    const result = await generateValidatedArticle({
      topic,
      category: existingFrontmatter.category,
      generation: config.generation,
      existingSignatures: signatures.map((s) => ({ slug: s.slug, words: s.words })),
      previousContent: existing.content,
    });

    // Curiosidade do card "💡 Curiosidade" — gerada 1x aqui, junto com a
    // regeneração do artigo. Se falhar, buildArticleFile preserva a
    // curiosidade anterior (em existingFrontmatter.curiosity).
    const curiosity = await generateCuriosity(result.body);

    const article = buildArticleFile({
      title: result.title,
      body: result.body,
      topic,
      category: existingFrontmatter.category,
      forceFile: safeFile,
      existingFrontmatter,
      curiosity,
    });

    // 1) Commita o post regenerado
    await commitFile(
      `posts/${article.file}`,
      article.content,
      `✍️ Regenerar artigo: ${article.file}`
    );

    // 2) Atualiza o log de qualidade (mesmo formato que o script CLI grava)
    const qualityLogFile = await getFile(QUALITY_LOG_REPO_PATH);
    const qualityLog = qualityLogFile ? JSON.parse(qualityLogFile.content || "[]") : [];
    qualityLog.push({
      timestamp: new Date().toISOString(),
      file: article.file,
      slug: article.slug,
      title: article.normalizedTitle,
      category: article.category,
      provider: result.provider,
      wordCount: result.wordCount,
      fillerCount: result.fillerCount,
      similarity: Math.round(result.maxSim * 100),
      similarTo: result.mostSimilarSlug,
      status: result.issues.length > 0 ? "ressalvas" : "ok",
      issues: result.issues,
    });
    await commitFile(
      QUALITY_LOG_REPO_PATH,
      JSON.stringify(qualityLog.slice(-400), null, 2),
      `chore: atualizar log de qualidade (${article.file})`
    );

    // 3) Atualiza as assinaturas de conteúdo (pra futuras checagens de similaridade)
    signatures.push({ slug: article.slug, words: result.signature });
    await commitFile(
      SIGNATURES_REPO_PATH,
      JSON.stringify(signatures.slice(-400), null, 2),
      `chore: atualizar assinaturas de conteúdo (${article.file})`
    );

    // 4) Dispara o rebuild na Vercel (se VERCEL_DEPLOY_HOOK estiver configurado)
    const deploy = await triggerVercelDeploy();

    return NextResponse.json({
      ok: true,
      file: article.file,
      provider: result.provider,
      wordCount: result.wordCount,
      issues: result.issues,
      deployTriggered: deploy.triggered,
      note: "Commit enviado ao GitHub. O site será atualizado no próximo deploy da Vercel (alguns minutos).",
    });
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

    if (!safeFile.endsWith(".md")) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    const deleted = await deleteFile(`posts/${safeFile}`, `🗑️ Remover post: ${safeFile}`);
    if (!deleted) {
      return NextResponse.json({ error: "Arquivo não encontrado no repositório" }, { status: 404 });
    }

    // remove a entrada do log de qualidade
    const qualityLogFile = await getFile(QUALITY_LOG_REPO_PATH);
    if (qualityLogFile) {
      const entries = JSON.parse(qualityLogFile.content || "[]").filter((e) => e.file !== safeFile);
      await commitFile(
        QUALITY_LOG_REPO_PATH,
        JSON.stringify(entries, null, 2),
        `chore: remover log de qualidade (${safeFile})`
      );
    }

    // remove a assinatura de conteúdo correspondente
    const signaturesFile = await getFile(SIGNATURES_REPO_PATH);
    if (signaturesFile) {
      try {
        const sigs = JSON.parse(signaturesFile.content || "[]").filter((s) => s.file !== safeFile);
        await commitFile(
          SIGNATURES_REPO_PATH,
          JSON.stringify(sigs, null, 2),
          `chore: remover assinatura de conteúdo (${safeFile})`
        );
      } catch {}
    }

    const deploy = await triggerVercelDeploy();

    return NextResponse.json({ ok: true, deployTriggered: deploy.triggered });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
