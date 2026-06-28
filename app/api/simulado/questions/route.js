import { NextResponse } from "next/server";
import { generateQuizWithAI } from "../../../../lib/quiz-generator";
import { getQuestions } from "../../../../lib/quiz-bank";

// Chamadas de IA pro simulado (OpenRouter → Gemini, sem Groq — ver
// lib/quiz-generator.js) costumam responder em poucos segundos, mas o
// plano padrão da Vercel corta funções serverless em 10s. 30s dá margem
// confortável sem precisar de plano pago para isso funcionar.
export const maxDuration = 30;

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 15;

// ── POST: gera (ou recupera) as questões de um simulado ─────────────────
// Estratégia: tenta gerar via IA primeiro (questões inéditas, infinitas);
// se a IA falhar ou devolver menos do que o mínimo aceitável (todos os
// provedores fora do ar, JSON inválido, etc.), cai para o banco estático
// — o mesmo princípio de "nunca travar a experiência" usado no resto do
// projeto (ex.: lib/article-generator.js com a curiosidade dos posts).
export async function POST(request) {
  try {
    const { banca, materia, quantidade } = await request.json();

    if (!banca || !materia) {
      return NextResponse.json({ error: "banca e materia são obrigatórios" }, { status: 400 });
    }

    const n = Math.min(Math.max(parseInt(quantidade, 10) || 10, MIN_QUESTIONS), MAX_QUESTIONS);

    let aiResult = null;
    let aiError = null;
    try {
      aiResult = await generateQuizWithAI({ banca, materia, quantidade: n });
    } catch (err) {
      aiError = err.message;
    }

    if (aiResult && aiResult.questions.length >= Math.min(MIN_QUESTIONS, n)) {
      return NextResponse.json({
        questions: aiResult.questions,
        source: "ai",
        provider: aiResult.provider,
      });
    }

    // Fallback: banco estático (ver lib/quiz-bank.js)
    const fallbackQuestions = getQuestions(banca, materia, n);
    if (fallbackQuestions.length < MIN_QUESTIONS) {
      return NextResponse.json(
        { error: "Questões insuficientes para esta combinação de banca e matéria." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      questions: fallbackQuestions,
      source: "fallback",
      aiError: aiError || "IA retornou poucas questões válidas",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
