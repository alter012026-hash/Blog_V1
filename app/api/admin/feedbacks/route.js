import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { getFile } from "../../../../lib/github-commit";

const FEEDBACKS_PATH = ".feedbacks-real.json";

export async function GET() {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const file = await getFile(FEEDBACKS_PATH);
    const items = file ? JSON.parse(file.content || "[]") : [];

    const sorted = (Array.isArray(items) ? items : [])
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const avgScore = sorted.length
      ? Math.round(sorted.reduce((sum, item) => sum + (Number(item.score || 0) || 0), 0) / sorted.length)
      : 0;

    return NextResponse.json({
      total: sorted.length,
      averageScore: avgScore,
      items: sorted.slice(0, 50),
      latest: sorted[0] || null,
    });
  } catch (err) {
    console.error("[admin/feedbacks]", err);
    return NextResponse.json({ error: err.message || "Erro ao carregar feedbacks." }, { status: 500 });
  }
}
