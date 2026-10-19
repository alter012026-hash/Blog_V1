import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { commitFile, getFile, triggerVercelDeploy } from "../../../../lib/github-commit";

const DRAFTS_PATH = ".editorial-drafts.json";

async function readDrafts() {
  const file = await getFile(DRAFTS_PATH);
  if (!file) return [];
  const drafts = JSON.parse(file.content || "[]");
  if (!Array.isArray(drafts)) throw new Error(`${DRAFTS_PATH} precisa conter um array.`);
  return drafts;
}

async function writeDrafts(drafts, message) {
  await commitFile(DRAFTS_PATH, `${JSON.stringify(drafts, null, 2)}\n`, message);
}

function validateSources(sources) {
  if (!Array.isArray(sources)) return [];
  return [...new Set(sources.map((source) => String(source).trim()).filter(Boolean))]
    .map((source) => {
      const url = new URL(source);
      if (url.protocol !== "https:") throw new Error("As fontes precisam usar HTTPS.");
      return url.toString();
    });
}

function markPublished(content, verifiedAt) {
  const header = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!header) throw new Error("O rascunho não tem frontmatter válido.");
  const cleanFrontmatter = header[1]
    .split(/\r?\n/)
    .filter((line) => !/^(editorialStatus|lastVerifiedAt):/.test(line))
    .join("\n");
  return content.replace(
    header[0],
    `---\n${cleanFrontmatter}\neditorialStatus: "PUBLISHED"\nlastVerifiedAt: "${verifiedAt}"\n---`
  );
}

function appendVerifiedSources(content, sources) {
  const sourceLines = sources.map((source) => {
    const url = new URL(source);
    return `- [${url.hostname}](${source})`;
  });
  const withoutPreviousVerifiedBlock = content.replace(/\n## Fontes oficiais verificadas\n[\s\S]*$/i, "").trimEnd();
  return `${withoutPreviousVerifiedBlock}\n\n## Fontes oficiais verificadas\n\n${sourceLines.join("\n")}\n`;
}

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const drafts = await readDrafts();
    return NextResponse.json({
      drafts: drafts.filter((draft) => ["NEEDS_REVIEW", "VALIDATION_FAILED"].includes(draft.status)),
    });
  } catch (error) {
    console.error("[admin/editorial-review][GET]", error);
    return NextResponse.json({ error: "Não foi possível carregar a fila editorial." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { action, draftId } = payload || {};
    const drafts = await readDrafts();
    const index = drafts.findIndex((draft) => draft.id === draftId);
    if (index < 0) {
      return NextResponse.json({ error: "Rascunho não encontrado." }, { status: 404 });
    }

    const draft = drafts[index];
    if (!["NEEDS_REVIEW", "VALIDATION_FAILED"].includes(draft.status)) {
      return NextResponse.json({ error: "Este rascunho não está aguardando revisão." }, { status: 409 });
    }

    const reviewedAt = new Date().toISOString();
    if (action === "reject") {
      const reason = String(payload.reason || "").trim();
      if (!reason) {
        return NextResponse.json({ error: "Informe o motivo da rejeição." }, { status: 400 });
      }
      drafts[index] = {
        ...draft,
        status: "REJECTED",
        rejectionReason: reason.slice(0, 1000),
        history: [...(draft.history || []), { status: "REJECTED", at: reviewedAt, reason: reason.slice(0, 1000) }],
      };
      await writeDrafts(drafts, `editorial: rejeitar rascunho ${draft.file}`);
      return NextResponse.json({ ok: true, status: "REJECTED" });
    }

    if (action !== "approve") {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
    if (!payload.verifiedFacts || !payload.verifiedOfficialSources) {
      return NextResponse.json({
        error: "Confirme a checagem dos fatos e das fontes oficiais antes de publicar.",
      }, { status: 400 });
    }
    if (draft.validationIssues?.length) {
      return NextResponse.json({
        error: "O rascunho falhou nas validações automáticas e não pode ser aprovado. Gere uma nova versão.",
      }, { status: 409 });
    }

    let sources;
    try {
      sources = validateSources(payload.sources);
    } catch (error) {
      return NextResponse.json({ error: error.message || "URL de fonte inválida." }, { status: 400 });
    }
    if (!sources.length) {
      return NextResponse.json({ error: "Adicione ao menos uma fonte HTTPS verificada." }, { status: 400 });
    }

    const safeFile = String(draft.file || "");
    if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/i.test(safeFile)) {
      return NextResponse.json({ error: "Nome de arquivo do rascunho inválido." }, { status: 400 });
    }
    if (draft.targetFile && draft.targetFile !== safeFile) {
      return NextResponse.json({ error: "O rascunho aponta para um arquivo de atualização diferente." }, { status: 409 });
    }
    const existingPost = await getFile(`posts/${safeFile}`);
    if (draft.targetFile && !existingPost) {
      return NextResponse.json({ error: "O artigo original desta atualização não existe mais." }, { status: 409 });
    }
    if (existingPost && !draft.targetFile) {
      return NextResponse.json({
        error: "Já existe um artigo publicado com esse arquivo. Revise a duplicidade antes de aprovar.",
      }, { status: 409 });
    }

    const publishedAt = new Date().toISOString();
    const contentWithSources = appendVerifiedSources(draft.content, sources);
    const publishedContent = markPublished(contentWithSources, reviewedAt);
    if (existingPost?.content !== publishedContent) {
      await commitFile(`posts/${safeFile}`, publishedContent, `editorial: publicar ${safeFile}`);
    }

    drafts[index] = {
      ...draft,
      sourceUrls: sources,
      status: "PUBLISHED",
      publishedAt,
      reviewedAt,
      history: [...(draft.history || []), { status: "APPROVED", at: reviewedAt }, { status: "PUBLISHED", at: publishedAt }],
    };
    await writeDrafts(drafts, `editorial: registrar publicação ${safeFile}`);
    await triggerVercelDeploy();

    return NextResponse.json({ ok: true, status: "PUBLISHED", url: `/blog/${draft.slug}` });
  } catch (error) {
    console.error("[admin/editorial-review][POST]", error);
    return NextResponse.json({ error: error.message || "Falha no fluxo de revisão editorial." }, { status: 500 });
  }
}
