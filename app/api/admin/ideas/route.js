import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { generateValidatedArticle, buildArticleFile } from "../../../../lib/article-generator";
import { commitFile, getFile, triggerVercelDeploy } from "../../../../lib/github-commit";
import config from "../../../../site.config.js";

const SIGNATURES_REPO_PATH = ".content-signatures.json";
const QUALITY_LOG_REPO_PATH = ".quality-log.json";

/**
 * POST /api/admin/ideas
 *
 * Recebe um array de dúvidas (extraídas manualmente ou de URL) e gera
 * um artigo para cada uma, commitando direto no repositório.
 *
 * Body: { doubts: string[], category?: string }
 *
 * Retorna: { generated: Array<{ topic, file, words, provider }>, errors: Array<{ topic, error }> }
 */
export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { doubts, category } = await request.json();

    if (!Array.isArray(doubts) || doubts.length === 0) {
      return NextResponse.json({ error: "Envie ao menos uma dúvida." }, { status: 400 });
    }

    const chosenCategory = category || config.generation.categories[0];
    const generated = [];
    const errors = [];

    // Carrega as assinaturas de conteúdo já publicado (mesmo arquivo que o
    // fluxo de regeneração usa) — sem isso, posts gerados a partir de
    // "dúvidas" nunca eram comparados contra o que já existe no blog, o que
    // foi uma das causas dos posts quase-duplicados.
    const signaturesFile = await getFile(SIGNATURES_REPO_PATH);
    let signatures = signaturesFile ? JSON.parse(signaturesFile.content || "[]") : [];

    const qualityLogFile = await getFile(QUALITY_LOG_REPO_PATH);
    const qualityLog = qualityLogFile ? JSON.parse(qualityLogFile.content || "[]") : [];

    for (const rawDoubt of doubts.slice(0, 5)) { // máx 5 por vez
      const topic = rawDoubt.trim();
      if (!topic) continue;

      try {
        const result = await generateValidatedArticle({
          topic,
          category: chosenCategory,
          generation: config.generation,
          existingSignatures: signatures.map((s) => ({ slug: s.slug, words: s.words })),
        });

        const article = buildArticleFile({
          title: result.title,
          body: result.body,
          topic,
          category: chosenCategory,
        });

        await commitFile(
          `posts/${article.file}`,
          article.content,
          `💡 Artigo de dúvida: ${article.file}`
        );

        // Atualiza assinaturas e log de qualidade em memória nesta requisição,
        // pra que a 2ª/3ª dúvida do mesmo lote já seja comparada contra a 1ª
        // (evita gerar dois artigos quase iguais dentro do mesmo lote de 5).
        signatures.push({ slug: article.slug, words: result.signature });
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

        generated.push({
          topic,
          file: article.file,
          words: result.wordCount,
          provider: result.provider,
          similarity: Math.round(result.maxSim * 100),
          similarTo: result.mostSimilarSlug,
          issues: result.issues,
        });
      } catch (err) {
        errors.push({ topic, error: err.message });
      }
    }

    // Persiste assinaturas e log atualizados (1x ao final, não por item)
    if (generated.length > 0) {
      await commitFile(
        SIGNATURES_REPO_PATH,
        JSON.stringify(signatures.slice(-400), null, 2),
        "chore: atualizar assinaturas de conteúdo (dúvidas)"
      );
      await commitFile(
        QUALITY_LOG_REPO_PATH,
        JSON.stringify(qualityLog.slice(-400), null, 2),
        "chore: atualizar log de qualidade (dúvidas)"
      );
      await triggerVercelDeploy().catch(() => {});
    }

    return NextResponse.json({ generated, errors });
  } catch (err) {
    console.error("[ideas/route]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
