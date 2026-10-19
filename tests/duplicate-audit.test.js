const test = require("node:test");
const assert = require("node:assert/strict");
const { auditPosts } = require("../scripts/detect-topic-overlap");

function post({ file, title, slug, signature, entities = [] }) {
  return {
    file,
    title,
    slug,
    date: "2026-10-19",
    wordCount: signature.length,
    topicKey: slug,
    signature,
    entities: new Set(entities),
  };
}

test("finds same-topic candidates and provides scores and reasons", () => {
  const candidates = auditPosts([
    post({
      file: "2026-10-01-cronograma-estudos.md",
      title: "Como montar cronograma de estudos para concurso",
      slug: "cronograma-estudos-concurso",
      signature: ["planejamento", "revisao", "questoes", "semana"],
    }),
    post({
      file: "2026-10-05-cronograma-estudos-guia.md",
      title: "Cronograma de estudos: guia atualizado",
      slug: "cronograma-estudos-concurso",
      signature: ["planejamento", "revisao", "questoes", "rotina"],
    }),
  ]);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].score > 0, true);
  assert.equal(candidates[0].decision, "pending");
  assert.ok(candidates[0].reasons.length > 0);
  assert.equal(candidates[0].articles.length, 2);
});

test("retains reviewer false-positive decisions across audit runs", () => {
  const entries = [
    post({
      file: "2026-10-01-inss-edital.md",
      title: "INSS publica edital de concurso",
      slug: "inss-edital-concurso",
      signature: ["inss", "edital", "vagas", "inscricao", "prova"],
      entities: ["INSS"],
    }),
    post({
      file: "2026-10-02-inss-prova.md",
      title: "Concurso INSS: datas e etapas da prova",
      slug: "concurso-inss-prova",
      signature: ["inss", "edital", "vagas", "inscricao", "prova"],
      entities: ["INSS"],
    }),
  ];
  const firstRun = auditPosts(entries);
  const secondRun = auditPosts(entries, [{
    id: firstRun[0].id,
    decision: "false_positive",
    reviewReason: "Temas relacionados, mas necessidades de busca diferentes.",
    reviewedAt: "2026-10-19T12:00:00.000Z",
  }]);

  assert.equal(secondRun[0].decision, "false_positive");
  assert.equal(secondRun[0].reviewReason, "Temas relacionados, mas necessidades de busca diferentes.");
});

test("does not report unrelated article pairs", () => {
  const candidates = auditPosts([
    post({
      file: "2026-10-01-matematica.md",
      title: "Como estudar matemática financeira",
      slug: "matematica-financeira",
      signature: ["juros", "compostos", "taxas", "porcentagem"],
    }),
    post({
      file: "2026-10-02-saude-mental.md",
      title: "Como controlar ansiedade antes da prova",
      slug: "ansiedade-prova",
      signature: ["respiracao", "emocional", "sono", "calma"],
    }),
  ]);

  assert.deepEqual(candidates, []);
});
