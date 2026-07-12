import { NextResponse } from "next/server";
import { getAllPosts } from "../../../../lib/posts";
import { sendDailyBroadcast } from "../../../../lib/newsletter-service";
import { getFile, commitFile } from "../../../../lib/github-commit";
import config from "../../../../site.config";

export const maxDuration = 30;

const STATE_PATH = "data/newsletter-state.json";

/**
 * GET /api/newsletter/send-daily
 *
 * Pensada para ser chamada 1x/dia por um GitHub Action (mesmo padrão do
 * .github/workflows/generate-articles.yml), nunca diretamente pelo
 * navegador — por isso exige o header Authorization com o segredo
 * NEWSLETTER_CRON_SECRET.
 *
 * Lógica:
 *  1. Lê data/newsletter-state.json no repo (via GitHub API) para saber
 *     qual foi o post mais recente já avisado por e-mail.
 *  2. Olha getAllPosts() (mais recente primeiro) e separa os posts que
 *     ainda não foram avisados E que têm até 48h de publicados — a janela
 *     de 48h (em vez de 24h "duro") absorve atraso do cron sem deixar de
 *     avisar um post legítimo, mas sem nunca reenviar o que já foi avisado
 *     uma vez (isso é controlado pelo state, não pela janela de tempo).
 *  3. Se não houver posts novos: não envia nada (pula o dia), 200 OK.
 *  4. Se houver: dispara 1 Broadcast no Resend com todos os posts novos
 *     de uma vez, e atualiza o state com o slug mais recente.
 */
export async function GET(request) {
  const secret = process.env.NEWSLETTER_CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") || "";

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "NEWSLETTER_CRON_SECRET não configurado no servidor." },
      { status: 500 }
    );
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    const posts = getAllPosts(); // já vem ordenado: mais recente primeiro

    if (!posts.length) {
      return NextResponse.json({ ok: true, sent: false, reason: "Nenhum post encontrado." });
    }

    // ── 1. Lê o state atual (qual foi o último slug avisado) ──
    let state = { lastNotifiedSlug: null, lastNotifiedDate: null };
    let stateSha = null;
    try {
      const file = await getFile(STATE_PATH);
      if (file) {
        state = JSON.parse(file.content);
        stateSha = file.sha;
      }
    } catch {
      // Se o arquivo ainda não existir ou der erro de parse, segue com o
      // state default — na primeira execução isso é esperado.
    }

    // ── 2. Define quais posts são "novos" desde o último envio ──
    const now = Date.now();
    const windowMs = 48 * 60 * 60 * 1000; // 48h de tolerância
    const lastNotifiedIndex = state.lastNotifiedSlug
      ? posts.findIndex((p) => p.slug === state.lastNotifiedSlug)
      : -1;

    let newPosts;
    if (lastNotifiedIndex === -1) {
      // Nunca avisamos nada ainda (ou o post de referência não existe mais):
      // considera "novo" só o que foi publicado dentro da janela de tolerância,
      // para não disparar um e-mail com os 75 posts antigos de uma vez.
      newPosts = posts.filter((p) => {
        const d = p.date ? new Date(p.date).getTime() : 0;
        return d && now - d < windowMs;
      });
    } else {
      // Tudo que está "antes" do último avisado na lista (mais recente primeiro)
      newPosts = posts.slice(0, lastNotifiedIndex);
    }

    if (!newPosts.length) {
      return NextResponse.json({ ok: true, sent: false, reason: "Nenhum post novo nas últimas 24h." });
    }

    // ── 3. Envia o broadcast ──
    const result = await sendDailyBroadcast({
      posts: newPosts,
      siteUrl: config.url,
      siteName: config.name,
    });

    // ── 4. Atualiza o state (slug mais recente entre os avisados agora) ──
    const newState = {
      lastNotifiedSlug: newPosts[0].slug,
      lastNotifiedDate: new Date().toISOString(),
      lastBroadcastId: result?.id || null,
    };

    try {
      await commitFile(
        STATE_PATH,
        JSON.stringify(newState, null, 2) + "\n",
        `chore: atualiza state da newsletter (${newPosts.length} post(s) avisado(s))`
      );
    } catch (err) {
      // Se o commit do state falhar, ainda assim o e-mail já foi enviado —
      // melhor avisar no log do que falhar a resposta inteira por isso.
      console.error("Falha ao salvar newsletter-state.json:", err.message);
    }

    return NextResponse.json({
      ok: true,
      sent: true,
      postsNotified: newPosts.map((p) => p.slug),
      broadcastId: result?.id || null,
    });
  } catch (err) {
    // "Segment sem contatos" não é uma falha real do sistema — é um
    // estado normal enquanto ninguém se inscreveu ainda (ou logo após a
    // correção de jul/2026, quando um Segment novo foi criado do zero).
    // Sem esse tratamento, o GitHub Action falha (exit 1) todo santo dia
    // até a primeira inscrição chegar, gerando alerta de falha por nada.
    const noContacts = /has no contacts|no contacts/i.test(err.message || "");
    if (noContacts) {
      return NextResponse.json({
        ok: true,
        sent: false,
        reason: "Segment da newsletter ainda não tem nenhum inscrito — nada para enviar.",
      });
    }

    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
