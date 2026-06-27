import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../../lib/admin-auth";

/**
 * GET /api/admin/ideas/fetch?url=...
 * Proxy server-side para buscar dúvidas de fóruns públicos (evita CORS).
 * Suporta Reddit JSON API.
 */
export async function GET(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "url é obrigatório" }, { status: 400 });

  // Só permite domínios conhecidos
  const allowed = ["reddit.com", "old.reddit.com"];
  const isAllowed = allowed.some(d => url.includes(d));
  if (!isAllowed) {
    return NextResponse.json({ error: "Domínio não permitido. Use Reddit." }, { status: 400 });
  }

  try {
    // Garante que é JSON do Reddit
    let fetchUrl = url;
    if (url.includes("reddit.com") && !url.includes(".json")) {
      fetchUrl = url.replace(/\/?(\?|$)/, ".json$1");
    }

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PassejaBlog/1.0)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Extrai títulos e selftext dos posts do Reddit
    const posts = data?.data?.children || [];
    const doubts = [];

    for (const { data: post } of posts) {
      const title = (post.title || "").trim();
      const body  = (post.selftext || "").trim();

      // Filtra: só posts que parecem perguntas ou dúvidas
      const isQuestion = /\?|como|o que|qual|quando|onde|precis|dúvida|duvida|ajuda|posso|pode|tenho que|necessário|documento|concurso/i.test(title + " " + body);
      if (!isQuestion) continue;
      if (title.length < 20) continue;

      doubts.push(title);

      // Se o corpo tem dúvida relevante e é curto, inclui também
      if (body && body.length > 30 && body.length < 280 && body !== title) {
        doubts.push(body.slice(0, 280));
      }
    }

    // Remove duplicatas e limita
    const unique = [...new Set(doubts)].slice(0, 30);
    return NextResponse.json({ doubts: unique, total: posts.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
