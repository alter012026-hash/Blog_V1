/**
 * lib/affiliate-matcher.js
 *
 * Os afiliados são cadastrados em site.config.js (e editáveis pelo painel
 * /admin) com uma lista de `keywords`, mas nada no projeto usava esses dados
 * pra inserir o link de fato nos posts — eles só apareciam na tela de
 * gerenciamento do admin, sem nenhum efeito no site público.
 *
 * Este módulo faz o "casamento" simples: conta quantas keywords de cada
 * afiliado aparecem no corpo do post e retorna o mais relevante (ou nenhum,
 * se não houver nenhum match). Mantém só 1 afiliado por post pra não virar
 * uma parede de propaganda.
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

module.exports = { matchAffiliate, normalize };
