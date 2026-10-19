const GENERIC_CONTEST_LABELS = new Set([
  "blog",
  "concurso",
  "concursos",
  "direcao",
  "edital",
  "editais",
  "gabarito",
  "gran",
  "governo",
  "noticia",
  "noticias",
  "oportunidade",
  "oportunidades",
  "semana",
]);

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getEditorialTitleIssue(title) {
  const value = String(title || "").trim();
  if (!value) return "Informe um título para o artigo.";

  const contestLabel = value.match(/^concurso\s+([a-zÀ-ÿ]+)/i);
  if (contestLabel) {
    const label = normalize(contestLabel[1]);
    if (label.length === 1 || GENERIC_CONTEST_LABELS.has(label)) {
      return "O título parece conter um rótulo de notícia ou nome incompleto (por exemplo, “Concurso R”). Use o nome oficial do órgão/concurso ou descreva as oportunidades tratadas.";
    }
  }

  return null;
}

module.exports = { getEditorialTitleIssue };
