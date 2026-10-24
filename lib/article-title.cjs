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

  // Molde genérico gerado pelo agrupador de notícias, ex.:
  // "Concurso Par: O que Mudou Nesta Semana e o que Esperar do Edital".
  // Qualquer título nesse formato é rejeitado, seja qual for o nome depois de "Concurso".
  if (
    /(o que mudou (nesta|na|esta) semana|mudan[çc]as recentes|novidades da semana)/i.test(value) &&
    /o que esperar/i.test(value)
  ) {
    return "O título usa o molde genérico “o que mudou nesta semana e o que esperar do edital”. Cite os órgãos/concursos reais e o dado mais forte (vagas, salário, banca ou prazo).";
  }

  // Data solta no título (ex.: "... ? 2026-08-01") não é título editorial.
  if (/\b20\d{2}-\d{2}-\d{2}\b/.test(value)) {
    return "O título não deve conter datas no formato 2026-08-01. Descreva o assunto do artigo.";
  }

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
