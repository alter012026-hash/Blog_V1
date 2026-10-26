const test = require("node:test");
const assert = require("node:assert/strict");
const { validateQuestion, buildQuizPrompt } = require("../lib/quiz-generator.js");

const base = { enunciado: "Enunciado de teste com tamanho suficiente.", explicacao: "Explicação de teste com tamanho suficiente." };

test("Cebraspe: só aceita itens Certo/Errado", () => {
  assert.ok(validateQuestion({ ...base, alternativas: ["Certo", "Errado"], gabarito: 1 }, "ce"));
  assert.ok(!validateQuestion({ ...base, alternativas: ["a", "b", "c", "d", "e"], gabarito: 1 }, "ce"));
  assert.ok(!validateQuestion({ ...base, alternativas: ["Errado", "Certo"], gabarito: 0 }, "ce"));
});

test("demais bancas: exige 5 alternativas distintas e gabarito 0–4", () => {
  const alts = ["a", "b", "c", "d", "e"];
  assert.ok(validateQuestion({ ...base, alternativas: alts, gabarito: 4 }, "mc"));
  assert.ok(!validateQuestion({ ...base, alternativas: alts, gabarito: 5 }, "mc"));
  assert.ok(!validateQuestion({ ...base, alternativas: ["a", "b", "c", "d"], gabarito: 0 }, "mc"));
  assert.ok(!validateQuestion({ ...base, alternativas: ["a", "a", "c", "d", "e"], gabarito: 0 }, "mc"));
});
