import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../lib/admin-auth";
import { checkRateLimit, getClientIp } from "../../../lib/rate-limit";
import { getAllSlugs } from "../../../lib/posts";
import {
  dayKey,
  isBot,
  isVisitStoreConfigured,
  normalizePath,
  normalizeReferrer,
  recordVisit,
  visitorHash,
} from "../../../lib/visit-store";

export const dynamic = "force-dynamic";

// Sempre responde 204: o rastreio nunca deve gerar erro visível para o leitor.
const done = () => new NextResponse(null, { status: 204 });

export async function POST(request) {
  try {
    if (!isVisitStoreConfigured()) return done();

    // Só aceita chamadas do próprio site.
    const host = request.headers.get("host") || "";
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== host) return done();
      } catch {
        return done();
      }
    }

    const userAgent = request.headers.get("user-agent") || "";
    if (isBot(userAgent)) return done();

    // Ignora pré-carregamentos do navegador.
    const purpose = `${request.headers.get("purpose") || ""}${request.headers.get("sec-purpose") || ""}`;
    if (/prefetch|prerender/i.test(purpose)) return done();

    // Suas próprias visitas (logado no /admin) não entram na conta.
    if (checkAdminAuth()) return done();

    const ip = getClientIp(request);
    if (!checkRateLimit(`track:${ip}`, { limit: 120, windowMs: 60_000 }).allowed) return done();

    const body = await request.json().catch(() => null);
    const path = normalizePath(body?.path, new Set(getAllSlugs()));
    if (!path) return done();

    await recordVisit({
      path,
      referrer: normalizeReferrer(body?.referrer, host),
      visitor: visitorHash({ ip, userAgent, day: dayKey() }),
    });
  } catch (error) {
    console.error("[track]", error.message);
  }
  return done();
}
