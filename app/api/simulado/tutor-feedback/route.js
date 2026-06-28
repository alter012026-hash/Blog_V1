import { NextResponse } from "next/server";
import { generateTutorFeedback } from "../../../../lib/quiz-generator";

export const maxDuration = 30;

// ── POST: gera o feedback do "Tutor IA" com base no resultado do simulado ──
// Nunca retorna erro 500 por falha de IA: se generateTutorFeedback não
// conseguir produzir um texto válido, devolve feedback: null + fallback:
// true, e o front-end mostra uma mensagem padrão em vez do card vazio.
export async function POST(request) {
  try {
    const payload = await request.json();
    const { banca, materia, score, total } = payload;

    if (!banca || !materia || typeof score !== "number" || typeof total !== "number" || total <= 0) {
      return NextResponse.json({ error: "Dados insuficientes para gerar o feedback." }, { status: 400 });
    }

    const pct = Math.round((score / total) * 100);
    const feedback = await generateTutorFeedback({ ...payload, pct });

    if (!feedback) {
      return NextResponse.json({ feedback: null, fallback: true });
    }

    return NextResponse.json({ feedback, fallback: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
