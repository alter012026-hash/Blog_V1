const test = require("node:test");
const assert = require("node:assert/strict");
const { buildSlugEntries } = require("../lib/post-slugs.cjs");

test("o post mais antigo mantém o slug e os repetidos ganham a data", () => {
  const e = buildSlugEntries([
    "2026-08-06-concurso-r-o-que-mudou.md",
    "2026-08-01-concurso-r-o-que-mudou.md",
    "2026-08-11-concurso-r-o-que-mudou.md",
  ]);
  const by = Object.fromEntries(e.map((x) => [x.fileName, x.slug]));
  assert.equal(by["2026-08-01-concurso-r-o-que-mudou.md"], "concurso-r-o-que-mudou");
  assert.equal(by["2026-08-06-concurso-r-o-que-mudou.md"], "concurso-r-o-que-mudou-2026-08-06");
  assert.equal(by["2026-08-11-concurso-r-o-que-mudou.md"], "concurso-r-o-que-mudou-2026-08-11");
});

test("todos os slugs são únicos e a ordem de entrada é preservada", () => {
  const files = ["2026-01-01-a.md", "2026-01-02-a.md", "2026-01-02-b.md"];
  const e = buildSlugEntries(files);
  assert.deepEqual(e.map((x) => x.fileName), files);
  assert.equal(new Set(e.map((x) => x.slug)).size, files.length);
});

test("slug curto não colide por substring (ex.: 'inss')", () => {
  const e = buildSlugEntries(["2026-01-01-inss.md", "2026-01-02-carreira-no-inss.md"]);
  assert.deepEqual(e.map((x) => x.slug), ["inss", "carreira-no-inss"]);
});
