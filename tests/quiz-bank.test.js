const test = require("node:test");
const assert = require("node:assert/strict");
const bank = require("../lib/quiz-bank.js");

test("toda questão tem estrutura válida", () => {
  const ids = new Set();
  for (const q of bank.allQuestions()) {
    assert.ok(!ids.has(q.id), `id duplicado: ${q.id}`);
    ids.add(q.id);
    assert.ok(q.enunciado.length >= 20, `${q.id}: enunciado curto`);
    assert.ok(q.explicacao.length >= 20, `${q.id}: explicação curta`);
    assert.ok(Number.isInteger(q.gabarito) && q.gabarito >= 0 && q.gabarito < q.alternativas.length, `${q.id}: gabarito fora do intervalo`);
    assert.ok([1, 2, 3].includes(q.nivel), `${q.id}: nível inválido`);
    assert.ok(q.assunto, `${q.id}: sem assunto`);
    const uniq = new Set(q.alternativas.map((a) => a.trim().toLowerCase()));
    assert.equal(uniq.size, q.alternativas.length, `${q.id}: alternativas repetidas`);
  }
});

test("CEBRASPE usa itens Certo/Errado; as demais bancas, 5 alternativas", () => {
  for (const q of bank.allQuestions()) {
    if (q.banca === "CEBRASPE") {
      assert.equal(q.formato, "ce");
      assert.deepEqual(q.alternativas, ["Certo", "Errado"]);
    } else {
      assert.equal(q.formato, "mc");
      assert.equal(q.alternativas.length, 5, `${q.id}`);
    }
  }
});

test("embaralhar alternativas preserva a resposta correta", () => {
  for (const q of bank.allQuestions()) {
    const original = q.alternativas[q.gabarito];
    for (let i = 0; i < 20; i++) {
      const p = bank.getQuestionById(q.id);
      assert.equal(p.alternativas[p.gabarito], original, q.id);
    }
  }
});

test("desafio do dia é determinístico e muda de um dia para o outro", () => {
  const a = bank.getDailyChallenge("2026-10-25").map((q) => q.id).join();
  const b = bank.getDailyChallenge("2026-10-25").map((q) => q.id).join();
  const c = bank.getDailyChallenge("2026-10-26").map((q) => q.id).join();
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("simulado completo da banca devolve todas as matérias", () => {
  for (const banca of bank.BANCAS) {
    const total = bank.countQuestions(banca);
    assert.equal(bank.getQuestions(banca, bank.ESCOPO_TODAS, 99).length, total);
  }
});
