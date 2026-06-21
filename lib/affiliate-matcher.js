/**
 * lib/affiliate-matcher.js
 *
 * Os afiliados são cadastrados em site.config.js (e editáveis pelo painel
 * /admin) com uma lista de `keywords`, mas nada no projeto usava esses dados
 * pra inserir o link de fato nos posts — eles só apareciam na tela de
 * gerenciamento do admin, sem nenhum efeito no site público.
 *
 * Este módulo faz dois tipos de seleção:
 *  - matchAffiliate: casa o conteúdo do post com as `keywords` de cada
 *    afiliado e retorna o mais relevante (ou nenhum, se não houver match).
 *    Mantém só 1 afiliado por post pra não virar uma parede de propaganda.
 *  - getPinnedAffiliates: afiliados marcados com `pinned: true` no config,
 *    que não têm relação temática com o conteúdo do blog (ex: programas de
 *    afiliados genéricos de renda extra) e por isso são exibidos sempre,
 *    em todo post, em vez de depender de match de palavra-chave.
 */

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos pra comparação mais tolerante
}

/**
 * @param {string} content - corpo do post (markdown ou texto puro)
 * @param {Array} affiliates - config.affiliates
 * @returns {object|null} o afiliado com mais matches, ou null se nenhum bater
 */
function matchAffiliate(content, affiliates = []) {
  const normalizedContent = normalize(content);

  let best = null;
  let bestScore = 0;

  for (const aff of affiliates) {
    // afiliados "pinned" têm exibição garantida em outro lugar da página
    // (ver getPinnedAffiliates) e não devem competir pelo matching por keyword.
    if (aff.pinned) continue;
    if (!aff.keywords || aff.keywords.length === 0) continue;

    const score = aff.keywords.reduce((acc, kw) => {
      return normalizedContent.includes(normalize(kw)) ? acc + 1 : acc;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      best = aff;
    }
  }

  return bestScore > 0 ? best : null;
}

/**
 * Afiliados marcados com `pinned: true` no site.config.js — exibidos em todo
 * post, independente do conteúdo (não competem no matching por keyword).
 * @param {Array} affiliates - config.affiliates
 * @returns {Array}
 */
function getPinnedAffiliates(affiliates = []) {
  return affiliates.filter((aff) => aff.pinned);
}

module.exports = { matchAffiliate, getPinnedAffiliates, normalize };
