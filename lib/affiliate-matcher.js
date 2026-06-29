/**
 * lib/affiliate-matcher.js
 *
 * Dois modos de seleção de afiliados:
 *
 *  1. matchAffiliate (contextual por keywords)
 *     Tenta casar o conteúdo do post com as keywords de cada afiliado.
 *     Em caso de empate, usa o slug do post como desempate determinístico
 *     (hash simples) para garantir VARIAÇÃO entre posts.
 *     Se nenhum afiliado tiver match de keyword, faz FALLBACK por rotação
 *     baseada no slug — assim todo post sempre exibe algum afiliado.
 *
 *  2. getPinnedAffiliates
 *     Afiliados com `pinned: true` no config são exibidos em todos os
 *     posts, independente do conteúdo.
 *
 *  3. getAffiliatePair
 *     Novo helper: retorna até 2 afiliados por post (1 contextual/rotativo +
 *     1 diferente por rotação). Use no page.js para mostrar 2 caixas.
 */

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Hash determinístico simples de uma string → número inteiro.
 * Garante que o mesmo slug sempre retorna o mesmo número,
 * mas slugs diferentes retornam números diferentes.
 */
function slugHash(slug = "") {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Retorna o afiliado mais relevante para o conteúdo do post.
 * Em empate de score, usa o slug para desempatar de forma variada.
 * Se nenhum tiver keyword match, faz rotação pelo slug (fallback).
 *
 * @param {string} content - corpo do post (markdown ou texto puro)
 * @param {Array}  affiliates - config.affiliates
 * @param {string} slug - slug do post (para desempate e fallback)
 * @returns {object|null}
 */
function matchAffiliate(content, affiliates = [], slug = "") {
  const normalizedContent = normalize(content);
  const candidates = affiliates.filter((a) => !a.pinned);

  if (candidates.length === 0) return null;

  // Pontua cada afiliado
  const scored = candidates.map((aff) => {
    const score = (aff.keywords || []).reduce((acc, kw) => {
      return normalizedContent.includes(normalize(kw)) ? acc + 1 : acc;
    }, 0);
    return { aff, score };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));

  if (maxScore === 0) {
    // Nenhum match de keyword → rotação pelo slug (fallback)
    return candidates[slugHash(slug) % candidates.length];
  }

  // Filtra os que empataram no topo
  const tied = scored.filter((s) => s.score === maxScore);

  if (tied.length === 1) return tied[0].aff;

  // Desempata pelo slug (determinístico, mas varia entre posts)
  return tied[slugHash(slug) % tied.length].aff;
}

/**
 * Retorna um par de afiliados distintos para o post:
 *  - [0]: afiliado contextual (matchAffiliate)
 *  - [1]: segundo afiliado diferente, por rotação do slug + 1
 *
 * Útil para exibir 2 caixas de afiliados por post com variação real.
 *
 * @param {string} content
 * @param {Array}  affiliates
 * @param {string} slug
 * @returns {Array} array com 1 ou 2 afiliados (nunca repete o mesmo)
 */
function getAffiliatePair(content, affiliates = [], slug = "") {
  const candidates = affiliates.filter((a) => !a.pinned);
  if (candidates.length === 0) return [];

  const first = matchAffiliate(content, affiliates, slug);
  if (!first || candidates.length < 2) return first ? [first] : [];

  const firstIndex = candidates.findIndex((a) => a.id === first.id);
  // Pega o próximo na lista (rotação circular), pulando o primeiro
  const secondIndex = (firstIndex + 1 + (slugHash(slug) % (candidates.length - 1))) % candidates.length;
  // Garante que não repete
  const adjustedIndex = secondIndex === firstIndex
    ? (secondIndex + 1) % candidates.length
    : secondIndex;

  return [first, candidates[adjustedIndex]];
}

/**
 * Afiliados marcados com `pinned: true` — exibidos em todo post.
 */
function getPinnedAffiliates(affiliates = []) {
  return affiliates.filter((aff) => aff.pinned);
}

module.exports = { matchAffiliate, getAffiliatePair, getPinnedAffiliates, normalize };
