import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../../lib/admin-auth";
import {
  buildPrompt,
  cleanMarkdown,
  extractTitle,
  generateWithFallback,
} from "../../../../../lib/article-generator";

function buildExcerpt(body, fallbackTitle = "Post gerado por IA") {
  const plain = String(body || "")
    .replace(/[#*_>`\-\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return plain.slice(0, 160) || fallbackTitle;
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const action = String(payload?.action || "").trim().toLowerCase();
    const title = String(payload?.title || "").trim();
    const category = String(payload?.category || "Geral").trim();
    const body = String(payload?.body || "").trim();

    if (!action) {
      return NextResponse.json({ error: "Ação de IA ausente." }, { status: 400 });
    }

    let prompt = "";
    if (action === "generate") {
      if (!title) {
        return NextResponse.json({ error: "Informe um título para gerar o post com IA." }, { status: 400 });
      }
      prompt = buildPrompt(
        {
          topic: title,
          generation: {
            tone: "didático, objetivo e atualizado",
            audienceLevel: "candidatos de concursos públicos",
            minWords: 900,
          },
          previousContent: null,
        },
        null
      );
    }

    if (action === "review") {
      if (!body) {
        return NextResponse.json({ error: "Escreva o conteúdo antes de revisar com IA." }, { status: 400 });
      }
      prompt = `Você é um editor de blog para concursos públicos. Revise o texto abaixo com foco em clareza, fluidez e valor pedagógico para o público. Preserve o tema principal, corrija redundâncias, melhore a estrutura em markdown e retorne APENAS o conteúdo revisado.

Tema: "${title || "Post manual"}"
Categoria: "${category || "Geral"}"

Texto:
"""
${body}
"""`;
    }

    if (action === "correct") {
      if (!body) {
        return NextResponse.json({ error: "Escreva o conteúdo antes de corrigir com IA." }, { status: 400 });
      }
      prompt = `Você é um revisor/editor de texto. Corrija gramática, pontuação, estilo e clareza do texto abaixo em português brasileiro, sem mudar o tema central. Retorne APENAS o texto corrigido em markdown.

Texto:
"""
${body}
"""`;
    }

    if (!prompt) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    const { text, provider } = await generateWithFallback(prompt);
    const raw = String(text || "").trim();

    if (!raw) {
      return NextResponse.json({ error: "A IA retornou um texto vazio." }, { status: 500 });
    }

    if (action === "generate") {
      const generatedTitle = extractTitle(raw) || title;
      const generatedBody = cleanMarkdown(raw);
      return NextResponse.json({
        ok: true,
        provider,
        title: generatedTitle,
        body: generatedBody,
        excerpt: buildExcerpt(generatedBody, generatedTitle),
      });
    }

    return NextResponse.json({
      ok: true,
      provider,
      body: cleanMarkdown(raw),
    });
  } catch (err) {
    console.error("[admin/manual-post][ai]", err);
    return NextResponse.json({ error: err.message || "Erro ao usar a IA." }, { status: 500 });
  }
}
