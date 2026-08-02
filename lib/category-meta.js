/**
 * lib/category-meta.js
 *
 * Metadados visuais e editoriais das categorias do blog, num só lugar —
 * antes cada categoria tinha cor definida só dentro de PostCard.jsx, e
 * ficava desatualizado sempre que uma categoria nova era adicionada em
 * site.config.js (3 das 11 categorias caíam no cinza genérico "Geral").
 * Usado por PostCard.jsx (tag de categoria) e CategoryCards.jsx (home).
 *
 * Cores em hsla com baixa opacidade: funcionam tanto no tema claro
 * quanto no escuro sem precisar de um segundo mapa por tema.
 */

const CATEGORY_META = {
  "Editais": {
    bg: "hsla(215, 60%, 50%, 0.12)", color: "hsl(215, 60%, 45%)", border: "hsla(215, 60%, 50%, 0.25)",
    code: "ED",
    description: "Editais publicados, prazos de inscrição e o que mudou em cada concurso.",
  },
  "Técnicas de Estudo": {
    bg: "hsla(142, 60%, 40%, 0.12)", color: "hsl(142, 55%, 34%)", border: "hsla(142, 60%, 40%, 0.25)",
    code: "TE",
    description: "Métodos de estudo, revisão espaçada e como manter a rotina.",
  },
  "Concursos Abertos": {
    bg: "hsla(38, 90%, 50%, 0.14)", color: "hsl(32, 85%, 38%)", border: "hsla(38, 90%, 50%, 0.28)",
    code: "CA",
    description: "Vagas e inscrições abertas agora, por órgão e banca.",
  },
  "Materiais Gratuitos": {
    bg: "hsla(262, 55%, 50%, 0.12)", color: "hsl(262, 55%, 46%)", border: "hsla(262, 55%, 50%, 0.25)",
    code: "MG",
    description: "Apostilas, videoaulas e questões comentadas sem custo.",
  },
  "Cronograma de Estudos": {
    bg: "hsla(346, 75%, 50%, 0.12)", color: "hsl(346, 65%, 42%)", border: "hsla(346, 75%, 50%, 0.25)",
    code: "CE",
    description: "Como montar e ajustar seu plano de estudos até a prova.",
  },
  "Carreiras Públicas": {
    bg: "hsla(190, 75%, 40%, 0.13)", color: "hsl(190, 70%, 32%)", border: "hsla(190, 75%, 40%, 0.26)",
    code: "CP",
    description: "Rotina, salário e requisitos de cada carreira pública.",
  },
  "Questões Comentadas": {
    bg: "hsla(24, 80%, 48%, 0.13)", color: "hsl(24, 75%, 40%)", border: "hsla(24, 80%, 48%, 0.26)",
    code: "QC",
    description: "Resolução comentada de questões de provas anteriores.",
  },
  "Informática para Concursos": {
    bg: "hsla(200, 65%, 45%, 0.12)", color: "hsl(200, 65%, 38%)", border: "hsla(200, 65%, 45%, 0.25)",
    code: "IC",
    description: "Word, Excel e segurança da informação cobrados em prova.",
  },
  "Redação e Discursiva": {
    bg: "hsla(310, 45%, 50%, 0.12)", color: "hsl(310, 45%, 42%)", border: "hsla(310, 45%, 50%, 0.25)",
    code: "RD",
    description: "Estrutura, coesão e nota máxima nas provas discursivas.",
  },
  "Direito Administrativo": {
    bg: "hsla(230, 45%, 50%, 0.12)", color: "hsl(230, 45%, 44%)", border: "hsla(230, 45%, 50%, 0.25)",
    code: "DA",
    description: "Os pontos de direito administrativo mais cobrados em concurso.",
  },
  "Concursos de Tribunais": {
    bg: "hsla(170, 55%, 38%, 0.13)", color: "hsl(170, 55%, 28%)", border: "hsla(170, 55%, 38%, 0.26)",
    code: "CT",
    description: "Preparação para concursos de tribunais estaduais e federais.",
  },
  "Geral": {
    bg: "hsla(220, 14%, 50%, 0.12)", color: "hsl(220, 14%, 42%)", border: "hsla(220, 14%, 50%, 0.25)",
    code: "GE",
    description: "Outros conteúdos úteis para a preparação do concurso.",
  },
};

function codeFromName(name) {
  const letters = name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(" ").filter(Boolean);
  if (letters.length === 0) return "GE";
  if (letters.length === 1) return letters[0].slice(0, 2).toUpperCase();
  return (letters[0][0] + letters[1][0]).toUpperCase();
}

function getCategoryMeta(name) {
  if (CATEGORY_META[name]) return CATEGORY_META[name];
  // Categoria nova, ainda sem entrada fixa (ex.: adicionada em site.config.js
  // mas este arquivo não foi atualizado) — gera um código a partir do nome
  // em vez de cair sempre no mesmo cinza "Geral".
  return { ...CATEGORY_META["Geral"], code: codeFromName(name), description: CATEGORY_META["Geral"].description };
}

module.exports = { CATEGORY_META, getCategoryMeta };
