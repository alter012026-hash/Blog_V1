const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const bank = require("../lib/quiz-bank.js");
const { getSimuladoCta } = require("../lib/simulado-links.js");
const postSlugs = require("../lib/post-slugs.cjs");
const { REDIRECTED_SLUGS } = require("../lib/redirects.js");

const dir = path.join(__dirname, "..", "posts");
const entries = postSlugs.buildSlugEntries(fs.readdirSync(dir).filter((f) => f.endsWith(".md")))
  .filter((e) => !REDIRECTED_SLUGS.has(e.slug));

function title(fileName) {
  return (fs.readFileSync(path.join(dir, fileName), "utf8").match(/^title:\s*"(.*)"/m) || [])[1] || "";
}

test("todo CTA de matéria aponta para banca e matéria que existem no banco", () => {
  for (const e of entries) {
    const cta = getSimuladoCta({ slug: e.slug, title: title(e.fileName) });
    if (!cta) continue;
    assert.ok(cta.href.startsWith("/simulado"), e.slug);
    if (cta.tipo === "materia") {
      assert.ok(bank.BANCAS.includes(cta.banca), `${e.slug}: banca ${cta.banca}`);
      assert.ok(bank.getMaterias(cta.banca).includes(cta.materia), `${e.slug}: ${cta.banca} não tem ${cta.materia}`);
      const u = new URL(cta.href, "https://x.test");
      assert.equal(u.searchParams.get("banca"), cta.banca);
      assert.equal(u.searchParams.get("materia"), cta.materia);
    }
    if (cta.tipo === "banca") assert.ok(bank.BANCAS.includes(cta.banca), e.slug);
  }
});

test("matérias coerentes: Direito, Português, Informática e Raciocínio", () => {
  const casos = [
    ["como-gabaritar-questoes-de-direito-constitucional-guia-atualizado", "Direito Constitucional"],
    ["responsabilidade-civil-do-estado-o-que-os-concursos-cobram", "Direito Administrativo"],
    ["estrategia-para-questoes-de-informatica-em-concursos", "Informática"],
    ["como-resolver-questoes-de-raciocinio-logico-em-concursos-dicas-praticas", "Raciocínio Lógico"],
    ["como-usar-conectivos-para-melhorar-a-coesao-na-redacao-de-concurso", "Português"],
  ];
  for (const [slug, materia] of casos) assert.equal(getSimuladoCta({ slug })?.materia, materia, slug);
});

test("notícia de edital não ganha CTA de matéria", () => {
  const noticias = [
    "concurso-estrategia-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital-2026-09-24",
    "concursos-ja-autorizado-para-minas-gerais-2026",
    "panorama-dos-concursos-em-agosto-de-2026-oportunidades-de-ate-r-32-mil-edital-un",
  ];
  for (const slug of noticias) assert.notEqual(getSimuladoCta({ slug })?.tipo, "materia", slug);
  assert.equal(getSimuladoCta({ slug: "carreira-de-auditor-fiscal-vale-a-pena" }), null);
});

test("artigo que cita uma banca recebe CTA da banca; método de estudo recebe o desafio do dia", () => {
  assert.equal(getSimuladoCta({ slug: "gcm-salvador", title: "GCM Salvador contrata a FGV: o que esperar da prova" })?.banca, "FGV");
  assert.equal(getSimuladoCta({ slug: "revisao-espacada-para-memorizar-legislacao" })?.href, "/simulado#desafio");
  assert.equal(getSimuladoCta({ slug: "editais-e-provas-anteriores-gratuitas-para-baixar" })?.href, "/simulado#provas-oficiais");
});

test("cobertura: parte relevante do blog tem simulado, mas não todos", () => {
  const com = entries.filter((e) => getSimuladoCta({ slug: e.slug, title: title(e.fileName) })).length;
  assert.ok(com >= 20, `só ${com} artigos com CTA`);
  assert.ok(com < entries.length * 0.6, `${com} de ${entries.length}: CTA demais vira ruído`);
});

test("os artigos marcados noindex existem e o frontmatter é válido", () => {
  const noindex = fs.readdirSync(dir).filter((f) => /^noindex:\s*true/m.test(fs.readFileSync(path.join(dir, f), "utf8").split("\n---")[0]));
  assert.equal(noindex.length, 1);
});
