import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays, dayKey, isBot, lastDays, normalizePath, normalizeReferrer, visitorHash,
} from "../lib/visit-store.js";

test("dayKey usa o fuso de São Paulo (23h30 em Brasília ainda é o mesmo dia)", () => {
  // 2026-10-25T02:30Z = 23:30 de 24/10 em Brasília (UTC-3)
  assert.equal(dayKey(new Date("2026-10-25T02:30:00Z")), "2026-10-24");
  assert.equal(dayKey(new Date("2026-10-25T03:30:00Z")), "2026-10-25");
});

test("addDays e lastDays atravessam virada de mês e ano", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.deepEqual(lastDays(3, "2026-01-01"), ["2025-12-30", "2025-12-31", "2026-01-01"]);
});

test("isBot bloqueia robôs e UA vazio, libera navegadores", () => {
  assert.equal(isBot(""), true);
  assert.equal(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)"), true);
  assert.equal(isBot("Mozilla/5.0 (compatible; bingbot/2.0)"), true);
  assert.equal(isBot("curl/8.4.0"), true);
  assert.equal(isBot("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36"), false);
});

test("normalizePath só aceita páginas públicas conhecidas", () => {
  const slugs = new Set(["como-estudar-para-concursos-publicos"]);
  assert.equal(normalizePath("/", slugs), "/");
  assert.equal(normalizePath("/blog/?categoria=Editais", slugs), "/blog");
  assert.equal(normalizePath("/blog/como-estudar-para-concursos-publicos/", slugs), "/blog/como-estudar-para-concursos-publicos");
  assert.equal(normalizePath("/blog/slug-inexistente", slugs), null);
  assert.equal(normalizePath("/admin", slugs), null);
  assert.equal(normalizePath("/api/track", slugs), null);
  assert.equal(normalizePath("https://evil.com/", slugs), null);
  assert.equal(normalizePath(123, slugs), null);
});

test("normalizeReferrer resume a origem ao domínio", () => {
  assert.equal(normalizeReferrer("", "site.com"), "Direto");
  assert.equal(normalizeReferrer("https://www.site.com/blog", "site.com"), "Direto");
  assert.equal(normalizeReferrer("https://www.google.com.br/search?q=x", "site.com"), "google");
  assert.equal(normalizeReferrer("https://l.facebook.com/l.php?u=x", "site.com"), "facebook.com");
  assert.equal(normalizeReferrer("https://t.co/abc", "site.com"), "x.com");
  assert.equal(normalizeReferrer("lixo", "site.com"), "Direto");
});

test("visitorHash muda por dia e não expõe o IP", () => {
  const a = visitorHash({ ip: "200.1.2.3", userAgent: "UA", day: "2026-10-24" });
  const b = visitorHash({ ip: "200.1.2.3", userAgent: "UA", day: "2026-10-25" });
  const c = visitorHash({ ip: "200.1.2.3", userAgent: "UA", day: "2026-10-24" });
  assert.notEqual(a, b);
  assert.equal(a, c);
  assert.ok(!a.includes("200"));
});
