/**
 * lib/email-service.js
 *
 * Envio real de e-mail transacional, via Resend (https://resend.com).
 *
 * Por quê Resend: o projeto já chama provedores externos via fetch puro
 * (Groq, OpenRouter, Gemini, GitHub — ver lib/article-generator.js e
 * lib/github-commit.js), então seguir o mesmo padrão aqui (sem precisar
 * instalar um SDK de e-mail/SMTP) mantém a stack simples. Resend tem
 * plano gratuito (100 e-mails/dia, 3.000/mês), funciona bem com domínios
 * verificados na Vercel e a API é uma chamada HTTP só.
 *
 * Antes deste arquivo, o "envio de resultado" no /simulado era só um link
 * mailto: que abria o cliente de e-mail do PRÓPRIO usuário — ou seja,
 * nenhum e-mail de fato saía do servidor, e o dono do site nunca capturava
 * o lead de verdade. Esta função substitui isso por um envio de verdade,
 * partindo do servidor, com um template HTML.
 *
 * Configuração necessária em .env.local / variáveis de ambiente da Vercel:
 *   RESEND_API_KEY=re_xxxxxxxx        (criar em https://resend.com/api-keys)
 *   RESEND_FROM_EMAIL="Passeja Concursos <resultado@seudominio.com.br>"
 *     (sem domínio verificado, pode usar temporariamente o remetente de
 *      teste do Resend: "Passeja Concursos <onboarding@resend.dev>" — mas
 *      ele só entrega para o e-mail da conta Resend, não para qualquer
 *      destinatário; para produção, verifique seu domínio em
 *      https://resend.com/domains)
 */

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getGradeLabel(pct) {
  if (pct >= 90) return { label: "Excelente! 🏆", color: "#10B981" };
  if (pct >= 70) return { label: "Aprovado! ✅", color: "#16A34A" };
  if (pct >= 50) return { label: "Quase lá! 💪", color: "#F59E0B" };
  return { label: "Continue estudando! 📚", color: "#EF4444" };
}

/**
 * Monta o HTML do e-mail de resultado. Usa apenas estilos inline (sem
 * <style> em bloco e sem CSS moderno como grid/flex), porque clientes de
 * e-mail (Gmail, Outlook etc.) renderizam HTML/CSS de forma muito mais
 * limitada que um navegador — tabelas e inline-styles são o jeito que
 * funciona de forma consistente em todos eles.
 */
function buildResultEmailHtml({ nome, banca, materia, score, total, pct, xp, maxStreak, avgTime, tutorFeedback }) {
  const safeName = escapeHtml(nome || "Concurseiro(a)");
  const safeBanca = escapeHtml(banca || "");
  const safeMateria = escapeHtml(materia || "");
  const grade = getGradeLabel(pct);

  const feedbackBlock = tutorFeedback
    ? `
    <tr>
      <td style="padding:0 32px 28px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2FF;border-radius:12px;border:1px solid #C7D2FE;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#4338CA;text-transform:uppercase;letter-spacing:0.04em;">🤖 Feedback do Tutor IA</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#312E81;">${escapeHtml(tutorFeedback).replace(/\n/g, "<br/>")}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1B3A6B,#2C5396);padding:36px 32px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:13px;color:rgba(255,255,255,0.75);font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Passeja Concursos</p>
              <p style="margin:0;font-size:42px;font-weight:800;color:#fff;line-height:1;">${pct}%</p>
              <p style="margin:8px 0 0 0;font-size:18px;font-weight:700;color:#fff;">${grade.label}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0 0 4px 0;font-size:16px;color:#111827;">Olá, ${safeName}! 👋</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#4B5563;">
                Você acertou <strong>${score} de ${total}</strong> questões no simulado de <strong>${safeMateria}</strong> (banca ${safeBanca}). Veja o resumo do seu desempenho abaixo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding:4px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
                      <tr><td style="padding:14px;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">⚡ ${xp}</p>
                        <p style="margin:2px 0 0 0;font-size:11px;color:#6B7280;">XP Total</p>
                      </td></tr>
                    </table>
                  </td>
                  <td width="50%" style="padding:4px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
                      <tr><td style="padding:14px;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">🔥 ${maxStreak}</p>
                        <p style="margin:2px 0 0 0;font-size:11px;color:#6B7280;">Maior sequência</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:4px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
                      <tr><td style="padding:14px;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:700;color:#111827;">⏱️ ${avgTime}s</p>
                        <p style="margin:2px 0 0 0;font-size:11px;color:#6B7280;">Tempo médio/questão</p>
                      </td></tr>
                    </table>
                  </td>
                  <td width="50%" style="padding:4px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;">
                      <tr><td style="padding:14px;text-align:center;">
                        <p style="margin:0;font-size:20px;font-weight:700;color:${grade.color};">🎯 ${pct}%</p>
                        <p style="margin:2px 0 0 0;font-size:11px;color:#6B7280;">Taxa de acerto</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${feedbackBlock}
          <tr>
            <td style="padding:0 32px 36px 32px;text-align:center;">
              <a href="https://passejaconcursos.com.br/simulado" style="display:inline-block;background:#1B3A6B;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;">Fazer novo simulado →</a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">Você recebeu este e-mail porque solicitou seu resultado em passejaconcursos.com.br</p>
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
 * Envia o e-mail de resultado do simulado via Resend.
 * Lança erro se RESEND_API_KEY não estiver configurada ou se a API
 * responder com falha — quem chama (app/api/simulado/send-result) decide
 * como exibir isso ao usuário.
 */
async function sendResultEmail({ to, nome, banca, materia, score, total, pct, xp, maxStreak, avgTime, tutorFeedback }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY ausente — configure essa variável de ambiente (veja .env.example) para habilitar o envio de e-mail."
    );
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Passeja Concursos <onboarding@resend.dev>";
  const subject = `Seu resultado no Simulado: ${pct}% em ${materia} (${banca})`;
  const html = buildResultEmailHtml({ nome, banca, materia, score, total, pct, xp, maxStreak, avgTime, tutorFeedback });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(`Resend HTTP ${res.status}: ${errBody?.message || "falha desconhecida"}`);
  }

  return await res.json();
}

module.exports = {
  buildResultEmailHtml,
  sendResultEmail,
};
