import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { generateValidatedArticle, buildArticleFile } from "../../../../lib/article-generator";
import { commitFile, triggerVercelDeploy } from "../../../../lib/github-commit";
import config from "../../../../site.config.js";

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

    for (const rawDoubt of doubts.slice(0, 5)) { // máx 5 por vez
      const topic = rawDoubt.trim();
      if (!topic) continue;

      try {
        const result = await generateValidatedArticle({
          topic,
          category: chosenCategory,
          generation: config.generation,
          existingSignatures: [],
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

        generated.push({
          topic,
          file: article.file,
          words: result.wordCount,
          provider: result.provider,
        });
      } catch (err) {
        errors.push({ topic, error: err.message });
      }
    }

    // Aciona deploy na Vercel se gerou algo
    if (generated.length > 0) {
      await triggerVercelDeploy().catch(() => {});
    }

    return NextResponse.json({ generated, errors });
  } catch (err) {
    console.error("[ideas/route]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
