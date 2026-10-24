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
  recordEngagement,
  recordVisit,
  visitorHash,
} from "../../../lib/visit-store";
import { classifyChannel, cleanUtm, parseGeo, parseUserAgent } from "../../../lib/visit-meta";

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
    if (!checkRateLimit(`track:${ip}`, { limit: 240, windowMs: 60_000 }).allowed) return done();

    const body = await request.json().catch(() => null);
    const path = normalizePath(body?.path, new Set(getAllSlugs()));
    if (!path) return done();

    // Tempo na página + rolagem + rejeição (enviado ao sair da página).
    if (body?.t === "e") {
      await recordEngagement({
        path,
        seconds: body.sec,
        scroll: body.scroll,
        first: body.first === true,
        bounce: body.first === true && Number(body.pages) === 1,
      });
      return done();
    }

    const entry = body?.entry === true;
    const utm = entry ? cleanUtm(body?.utm) : null;
    const source = normalizeReferrer(body?.referrer, host);
    const { device, browser, os } = parseUserAgent(userAgent);
    const geo = parseGeo(request.headers);

    await recordVisit({
      path,
      referrer: source,
      visitor: visitorHash({ ip, userAgent, day: dayKey() }),
      device, browser, os,
      ...geo,
      channel: classifyChannel(source, utm || {}),
      entry,
      utm,
    });
  } catch (error) {
    console.error("[track]", error.message);
  }
  return done();
}
