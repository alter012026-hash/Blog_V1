import { NextResponse } from "next/server";
import { addSubscriber, isValidEmail } from "../../../../lib/newsletter-service";

export const maxDuration = 15;

// Limite simples de tamanho para evitar abuso óbvio do campo "nome".
function sanitizeName(name) {
  if (typeof name !== "string") return undefined;
  const trimmed = name.trim().slice(0, 80);
  return trimmed || undefined;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const firstName = sanitizeName(body.name);

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Informe um e-mail válido." },
        { status: 400 }
      );
    }

    await addSubscriber({ email, firstName });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Só expomos a mensagem do erro quando ELE PRÓPRIO foi lançado por nós
    // de forma controlada (ex: addSubscriber lança err.status = 400 para
    // "e-mail inválido"). Qualquer erro vindo da API do Resend (chave
    // ausente/inválida, audience errada, rede, etc.) é tratado como erro
    // interno genérico — não expomos esses detalhes para quem está se
    // inscrevendo no site.
    const isClientError = err.status === 400;
    const status = isClientError ? 400 : 500;
    const message = isClientError
      ? err.message
      : "Não foi possível concluir sua inscrição agora. Tente novamente em alguns minutos.";

    if (!isClientError) {
      console.error("Erro ao inscrever na newsletter:", err.message);
    }

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
