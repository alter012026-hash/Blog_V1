import { NextResponse } from "next/server";
import { sendResultEmail } from "../../../../lib/email-service";
import { commitFile, getFile } from "../../../../lib/github-commit";

export const maxDuration = 20;

const FEEDBACKS_PATH = ".feedbacks-real.json";

async function persistFeedbackRecord(record) {
  const existing = await getFile(FEEDBACKS_PATH);
  let items = [];

  if (existing?.content) {
    try {
      const parsed = JSON.parse(existing.content);
      items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];
    } catch {
      items = [];
    }
  }

  const normalized = {
    createdAt: new Date().toISOString(),
    email: String(record.email || "").trim().toLowerCase(),
    nome: String(record.nome || "").trim(),
    banca: String(record.banca || "").trim(),
    materia: String(record.materia || "").trim(),
    score: Number(record.score || 0),
    total: Number(record.total || 0),
    pct: Number(record.pct || 0),
    xp: Number(record.xp || 0),
    maxStreak: Number(record.maxStreak || 0),
    avgTime: Number(record.avgTime || 0),
    tutorFeedback: String(record.tutorFeedback || "").trim(),
  };

  const next = [normalized, ...items].slice(0, 200);

  await commitFile(
    FEEDBACKS_PATH,
    JSON.stringify(next, null, 2),
    `💬 Persistir feedback real: ${normalized.email || "anonimo"}`
  );
}

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

    try {
      await persistFeedbackRecord({
        email,
        nome,
        banca,
        materia,
        score,
        total,
        pct,
        xp,
        maxStreak,
        avgTime,
        tutorFeedback,
      });
    } catch (persistErr) {
      console.warn("[send-result] persistFeedbackRecord falhou:", persistErr.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
