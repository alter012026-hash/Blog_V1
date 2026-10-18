/**
 * lib/category-meta.js
 *
 * Identidade visual de cada categoria — num só lugar.
 *
 * Cada categoria tem um MATIZ (hue, 0–360). Todo o resto (fundo suave,
 * cor forte, anéis da capa) é calculado no CSS a partir de `--h`, e muda
 * sozinho entre tema claro e escuro (ver app/styles/tokens.css → `.cat`).
 * Para criar uma categoria nova basta acrescentar uma linha aqui; se
 * esquecer, getCategoryMeta() gera matiz e código a partir do nome.
 *
 * Usado por PostCard / PostCover / CategoryCards / Header de artigo.
 */

const CATEGORY_META = {
  "Editais": {
    hue: 230, code: "ED",
    description: "Editais publicados, prazos de inscrição e o que mudou em cada concurso.",
  },
  "Técnicas de Estudo": {
    hue: 150, code: "TE",
    description: "Métodos de estudo, revisão espaçada e como manter a rotina.",
  },
  "Concursos Abertos": {
    hue: 28, code: "CA",
    description: "Vagas e inscrições abertas agora, por órgão e banca.",
  },
  "Materiais Gratuitos": {
    hue: 275, code: "MG",
    description: "Apostilas, videoaulas e questões comentadas sem custo.",
  },
  "Cronograma de Estudos": {
    hue: 338, code: "CE",
    description: "Como montar e ajustar seu plano de estudos até a prova.",
  },
  "Carreiras Públicas": {
    hue: 190, code: "CP",
    description: "Rotina, salário e requisitos de cada carreira pública.",
  },
  "Questões Comentadas": {
    hue: 8, code: "QC",
    description: "Resolução comentada de questões de provas anteriores.",
  },
  "Informática para Concursos": {
    hue: 205, code: "IC",
    description: "Word, Excel e segurança da informação cobrados em prova.",
  },
  "Redação e Discursiva": {
    hue: 305, code: "RD",
    description: "Estrutura, coesão e nota máxima nas provas discursivas.",
  },
  "Direito Administrativo": {
    hue: 255, code: "DA",
    description: "Os pontos de direito administrativo mais cobrados em concurso.",
  },
  "Concursos de Tribunais": {
    hue: 168, code: "CT",
    description: "Preparação para concursos de tribunais estaduais e federais.",
  },
  "Geral": {
    hue: 222, code: "GE",
    description: "Outros conteúdos úteis para a preparação do concurso.",
  },
};

function codeFromName(name) {
  const letters = name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(" ").filter(Boolean);
  if (letters.length === 0) return "GE";
  if (letters.length === 1) return letters[0].slice(0, 2).toUpperCase();
  return (letters[0][0] + letters[1][0]).toUpperCase();
}

function hueFromName(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function withLegacyColors(meta) {
  // Chaves antigas (bg/color/border) mantidas para qualquer código que
  // ainda as leia; o CSS novo usa só `--h`.
  const h = meta.hue;
  return {
    ...meta,
    bg: `hsla(${h}, 80%, 50%, 0.12)`,
    color: `hsl(${h}, 70%, 38%)`,
    border: `hsla(${h}, 80%, 50%, 0.28)`,
  };
}

function getCategoryMeta(name) {
  const key = name || "Geral";
  if (CATEGORY_META[key]) return withLegacyColors(CATEGORY_META[key]);
  return withLegacyColors({
    hue: hueFromName(key),
    code: codeFromName(key),
    description: CATEGORY_META["Geral"].description,
  });
}

module.exports = { CATEGORY_META, getCategoryMeta };
