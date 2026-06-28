/**
 * lib/newsletter-service.js
 *
 * Newsletter diária de novos posts, usando Resend Contacts + Broadcasts.
 *
 * IMPORTANTE — histórico: a primeira versão deste arquivo usava o modelo
 * antigo do Resend ("Audiences" com um audienceId próprio, endpoint
 * /audiences/{id}/contacts). Em nov/2025 o Resend lançou a "New Contacts
 * Experience": Contacts passaram a ser entidades GLOBAIS na conta,
 * identificadas só pelo e-mail — sem precisar criar/copiar nenhum
 * audienceId. O painel "Audiences" virou só uma tela chamada "Audience"
 * (singular) que já mostra todos os contatos da conta direto. Esta versão
 * do arquivo já usa a API nova.
 *
 * Por quê Resend Contacts e não um banco de dados próprio:
 * O filesystem da Vercel em produção é somente leitura (ver comentário em
 * lib/github-commit.js), então não dá pra guardar a lista de inscritos em
 * um arquivo local. O projeto já usa Resend para e-mail transacional
 * (lib/email-service.js), e o Resend guarda os Contacts pra você (grátis
 * até 1.000), com unsubscribe automático. Isso evita precisar de
 * Postgres/Supabase só para guardar e-mails.
 *
 * Fluxo:
 *  1. Visitante se inscreve no site → addSubscriber() cria um Contact
 *     global na conta (POST /contacts).
 *  2. Todo dia, um GitHub Action chama /api/newsletter/send-daily, que:
 *     a) verifica se algum post foi publicado nas últimas 24h
 *     b) se sim, chama sendDailyBroadcast() → cria e envia um Broadcast
 *        para todos os Contacts não descadastrados
 *     c) se não, não faz nada (pula o dia)
 *
 * Variáveis de ambiente necessárias:
 *   RESEND_API_KEY      — já usada por lib/email-service.js
 *   RESEND_FROM_EMAIL   — já usada por lib/email-service.js
 *   NEWSLETTER_CRON_SECRET — segredo compartilhado com o GitHub Action,
 *                         pra evitar que qualquer pessoa dispare o envio
 *                         batendo na rota publicamente.
 *
 * (RESEND_AUDIENCE_ID NÃO é mais necessário — mantido como no-op se ainda
 * estiver definido em algum ambiente antigo, mas o código não usa.)
 */

const RESEND_API = "https://api.resend.com";

function getApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY ausente — configure essa variável de ambiente (veja .env.example)."
    );
  }
  return apiKey;
}

function getFrom() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Passeja Concursos <onboarding@resend.dev>"
  );
}

async function resendRequest(path, options = {}) {
  const apiKey = getApiKey();
  const res = await fetch(`${RESEND_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.message || `HTTP ${res.status}`;
    const err = new Error(`Resend API error: ${message}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Adiciona um e-mail como Contact global na conta do Resend. Idempotente:
 * se o contato já existir, tratamos como sucesso (não duplica, a chave é
 * o e-mail).
 */
async function addSubscriber({ email, firstName }) {
  if (!isValidEmail(email)) {
    const err = new Error("E-mail inválido.");
    err.status = 400;
    throw err;
  }

  try {
    const data = await resendRequest("/contacts", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        firstName: firstName || undefined,
        unsubscribed: false,
      }),
    });
    return { ok: true, id: data?.id };
  } catch (err) {
    // Resend retorna erro quando o contato já existe — tratamos como
    // sucesso "idempotente" para não assustar quem já está inscrito
    // tentando se inscrever de novo.
    if (err.status === 409 || /already exists/i.test(err.body?.message || "")) {
      return { ok: true, alreadySubscribed: true };
    }
    throw err;
  }
}

/** Remove (descadastra) um contato. */
async function removeSubscriber({ email }) {
  return resendRequest(`/contacts/${encodeURIComponent(email.trim().toLowerCase())}`, {
    method: "DELETE",
  });
}

/** Lista todos os Contacts da conta (usado pelo admin para mostrar o total). */
async function listSubscribers() {
  const data = await resendRequest("/contacts", { method: "GET" });
  const contacts = data?.data || [];
  const active = contacts.filter((c) => !c.unsubscribed);
  return {
    total: contacts.length,
    active: active.length,
    unsubscribed: contacts.length - active.length,
    contacts,
  };
}

/**
 * Monta o HTML do e-mail diário com os posts novos.
 * Estilo inline, igual ao padrão de lib/email-service.js, para renderizar
 * bem em clientes de e-mail (Gmail, Outlook etc.).
 */
function buildDailyEmailHtml({ posts, siteUrl, siteName }) {
  const postsHtml = posts
    .map(
      (post) => `
        <tr>
          <td style="padding:0 32px 20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;border:1px solid #E5E7EB;">
              <tr>
                <td style="padding:20px 22px;">
                  <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#1B3A6B;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(post.category || "Concursos")}</p>
                  <p style="margin:0 0 8px 0;font-size:17px;font-weight:700;color:#111827;line-height:1.35;">${escapeHtml(post.title)}</p>
                  <p style="margin:0 0 14px 0;font-size:14px;line-height:1.55;color:#4B5563;">${escapeHtml(post.excerpt || "")}</p>
                  <a href="${siteUrl}/blog/${post.slug}" style="display:inline-block;background:#1B3A6B;color:#fff;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:7px;">Ler artigo →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    )
    .join("");

  const headline =
    posts.length === 1
      ? "Novo artigo no ar! 📬"
      : `${posts.length} novos artigos no ar! 📬`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1B3A6B,#2C5396);padding:32px 32px 28px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:13px;color:rgba(255,255,255,0.75);font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(siteName)}</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#fff;">${headline}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 4px 32px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4B5563;">
                Confira o que saiu de novo no blog ${escapeHtml(siteName)}:
              </p>
            </td>
          </tr>
          ${postsHtml}
          <tr>
            <td style="padding:8px 32px 32px 32px;text-align:center;">
              <a href="${siteUrl}/blog" style="color:#1B3A6B;text-decoration:none;font-weight:600;font-size:13px;">Ver todos os artigos →</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                Você recebeu este e-mail porque se inscreveu na newsletter de ${escapeHtml(siteName)}.<br/>
                {{{RESEND_UNSUBSCRIBE_URL}}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Cria e envia (send: true) um Broadcast para todos os Contacts ativos da
 * conta, avisando sobre os posts novos. Sem segmentId = manda para todos
 * os contatos não descadastrados. Retorna o resultado da API do Resend.
 */
async function sendDailyBroadcast({ posts, siteUrl, siteName }) {
  if (!posts?.length) {
    throw new Error("sendDailyBroadcast chamado sem posts.");
  }

  const from = getFrom();
  const subject =
    posts.length === 1
      ? `📬 Novo no blog: ${posts[0].title}`
      : `📬 ${posts.length} novos artigos no ${siteName}`;

  const html = buildDailyEmailHtml({ posts, siteUrl, siteName });

  const data = await resendRequest("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      from,
      subject,
      html,
      send: true,
    }),
  });

  return data;
}

module.exports = {
  addSubscriber,
  removeSubscriber,
  listSubscribers,
  sendDailyBroadcast,
  buildDailyEmailHtml,
  isValidEmail,
};
