import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ ok: true });
      // Cookie de sessão simples (24h)
      response.cookies.set("admin_auth", Buffer.from(ADMIN_PASSWORD).toString("base64"), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
        sameSite: "strict",
      });
      return response;
    }

    return NextResponse.json({ ok: false, error: "Senha incorreta" }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("admin_auth");
  return response;
}
