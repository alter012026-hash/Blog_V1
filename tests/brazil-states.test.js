const test = require("node:test");
const assert = require("node:assert/strict");
const { brazilStates, getBrazilState, postMatchesBrazilState } = require("../lib/brazil-states");

test("lists all 26 states and the Federal District with unique codes", () => {
  assert.equal(brazilStates.length, 27);
  assert.equal(new Set(brazilStates.map((state) => state.code)).size, 27);
  assert.equal(getBrazilState("df").name, "Distrito Federal");
  assert.equal(getBrazilState("XX"), null);
});

test("matches state names and capitals in article titles or excerpts", () => {
  const amazonas = getBrazilState("AM");
  assert.equal(postMatchesBrazilState({
    title: "Concurso ISS Manaus tem edital publicado",
    slug: "concurso-iss-manaus",
    excerpt: "Oportunidades para a capital.",
  }, amazonas), true);

  assert.equal(postMatchesBrazilState({
    title: "Como estudar para concursos públicos",
    slug: "como-estudar-para-concursos",
    excerpt: "Edital de Manaus citado apenas como exemplo.",
  }, amazonas), true);
});

test("matches state abbreviations only when tied to a contest-related title", () => {
  const rioGrandeDoSul = getBrazilState("RS");
  assert.equal(postMatchesBrazilState({
    title: "Concurso RS: edital abre vagas no estado",
    slug: "concurso-rs-edital-vagas",
  }, rioGrandeDoSul), true);
  assert.equal(postMatchesBrazilState({
    title: "Dicas para revisar português",
    slug: "dicas-para-revisar",
  }, rioGrandeDoSul), false);
});

test("handles missing post data and still returns false instead of crashing", () => {
  const sp = getBrazilState("SP");
  assert.equal(postMatchesBrazilState(null, sp), false);
  assert.equal(postMatchesBrazilState(undefined, sp), false);
  assert.equal(postMatchesBrazilState({}, sp), false);

  const ce = getBrazilState("CE");
  assert.equal(postMatchesBrazilState({
    title: "Edital de concurso para Fortaleza",
    excerpt: "Oportunidades para quem mora na capital cearense.",
  }, ce), true);
});
