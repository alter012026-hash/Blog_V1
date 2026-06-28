import { NextResponse } from "next/server";
import { sendResultEmail } from "../../../../lib/email-service";

export const maxDuration = 20;

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── POST: envia o e-mail real com o resultado do simulado ──────────────
// Substitui o antigo link mailto: (que nunca enviava nada do servidor,
// só abria o cliente de e-mail do próprio usuário). Ver lib/email-service.js
// para a implementação via Resend e o motivo da escolha do provedor.
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, nome, banca, materia, score, total, xp, maxStreak, avgTime, tutorFeedback } = body;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }
    if (typeof score !== "number" || typeof total !== "number" || !total) {
      return NextResponse.json({ error: "Dados do resultado incompletos." }, { status: 400 });
    }

    const pct = Math.round((score / total) * 100);

    await sendResultEmail({
      to: email,
      nome,
      banca,
      materia,
      score,
      total,
      pct,
      xp: xp || 0,
      maxStreak: maxStreak || 0,
      avgTime: avgTime || 0,
      tutorFeedback: tutorFeedback || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
