/**
 * lib/news-clustering.js
 *
 * Agrupa notícias relacionadas (mesmo órgão/concurso, ângulos diferentes)
 * para que generate-article.js produza UM artigo consolidado por grupo,
 * em vez de um artigo raso por notícia isolada.
 *
 * Exemplo do problema que isso resolve:
 *   "Governo confirma estudo de concurso do INSS"
 *   "Ministro comenta déficit de servidores no INSS"
 *   "Sindicato cobra edital do INSS"
 *   "Comissão do concurso do INSS é cogitada"
 * → 4 notícias, mesmo assunto. Sem agrupar, isso vira 4 artigos finos e
 *   quase-redundantes. Agrupado, vira 1 artigo completo: "Concurso INSS:
 *   tudo o que mudou nesta semana e o que esperar do edital" — mais útil
 *   pro leitor e com mais chance de ranquear (cobre o assunto por inteiro
 *   em vez de fatiar em pedaços que competem entre si por SEO).
 *
 * Estratégia: clustering guloso por similaridade Jaccard de palavras
 * significativas do título (sem exigir dependência nova nem embeddings —
 * o vocabulário do nicho é pequeno o suficiente pra isso funcionar bem).
 */

const STOPWORDS = new Set([
  "para", "como", "mais", "sobre", "concurso", "concursos", "publico",
  "publica", "publicos", "publicas", "edital", "editais", "noticia",
  "noticias", "confirma", "anuncia", "anuncia", "governo", "após", "apos",
  "ainda", "pode", "podem", "deve", "devem", "vai", "vao", "com", "sem",
  "dos", "das", "que", "uma", "uns", "umas", "por", "tem", "sera", "será",
  "nova", "novo", "novas", "novos", "diz", "veja", "saiba", "entenda",
]);

function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

/**
 * Extrai as palavras significativas de um título (>3 letras, fora da
 * stoplist) como um Map palavra->peso — a "impressão digital" usada pra
 * medir similaridade. Siglas/acrônimos (INSS, MEC, FGV — tudo em maiúsculas
 * no título original) recebem peso maior: títulos curtos de notícia raramente
 * compartilham muitas palavras comuns, mas compartilhar a MESMA sigla de
 * órgão/banca é o sinal mais forte de que duas notícias tratam do mesmo caso.
 */
function tokenize(title = "") {
  const rawWords = title.match(/[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9]*/g) || [];
  const weights = new Map();

  for (const raw of rawWords) {
    const norm = normalize(raw).trim();
    if (norm.length <= 3 || STOPWORDS.has(norm)) continue;

    const isAcronym = /^[A-ZÀ-Ú]{2,}$/.test(raw); // ex.: INSS, MEC, FGV
    const weight = isAcronym ? 3 : 1;
    weights.set(norm, Math.max(weights.get(norm) || 0, weight));
  }

  return weights;
}

/**
 * Jaccard ponderado: cada token pesa conforme tokenize() acima, então
 * compartilhar uma sigla de órgão pesa mais que compartilhar uma palavra
 * genérica qualquer.
 */
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;

  let interWeight = 0;
  let unionWeight = 0;
  const keys = new Set([...a.keys(), ...b.keys()]);

  for (const key of keys) {
    const wa = a.get(key) || 0;
    const wb = b.get(key) || 0;
    interWeight += Math.min(wa, wb);
    unionWeight += Math.max(wa, wb);
  }

  return unionWeight === 0 ? 0 : interWeight / unionWeight;
}

/**
 * Clustering guloso: cada item entra no cluster existente mais parecido
 * (se acima do limiar), senão abre um cluster novo. Não é O(n²) ideal para
 * milhares de itens, mas a fila de pendentes (.pending-news-topics.json)
 * é limitada a dezenas de itens, então isso é irrelevante na prática.
 *
 * @param {Array<{title:string, link:string, source?:string, pubDate?:string, snippet?:string}>} items
 * @param {number} similarityThreshold - quão parecidos os títulos precisam ser pra entrar no mesmo cluster
 * @returns {Array<{items: Array, tokens: Set<string>}>} clusters ordenados do maior pro menor
 */
function clusterNews(items, similarityThreshold = 0.22) {
  const clusters = [];

  for (const item of items) {
    const tokens = tokenize(item.title);
    let bestCluster = null;
    let bestSim = 0;

    for (const cluster of clusters) {
      const sim = jaccard(tokens, cluster.tokens);
      if (sim > bestSim) {
        bestSim = sim;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestSim >= similarityThreshold) {
      bestCluster.items.push(item);
      for (const [token, weight] of tokens) {
        bestCluster.tokens.set(token, Math.max(bestCluster.tokens.get(token) || 0, weight));
      }
    } else {
      clusters.push({ items: [item], tokens });
    }
  }

  return clusters.sort((a, b) => b.items.length - a.items.length);
}

/**
 * Deriva um título de tópico para um cluster consolidado (2+ notícias).
 * Usa a entidade (órgão, banca, sigla) mais frequente entre os títulos
 * originais — capturada como palavra capitalizada que não seja um termo
 * genérico do nicho (Concurso, Edital, Governo, etc).
 */
const GENERIC_CAPITALIZED = new Set([
  "Concurso", "Concursos", "Edital", "Editais", "Governo", "Ministério",
  "Ministerio", "Brasil", "Nacional", "Federal", "Estado", "Estados",
]);

function deriveClusterTopic(items) {
  const freq = new Map();

  for (const item of items) {
    const words = item.title.match(/\b[A-ZÀ-Ú][\wÀ-ÿ]*\b/g) || [];
    for (const w of words) {
      if (GENERIC_CAPITALIZED.has(w)) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }

  let entity = null;
  let best = 0;
  for (const [word, count] of freq) {
    if (count > best) {
      best = count;
      entity = word;
    }
  }

  if (entity) {
    return `Concurso ${entity}: o que mudou nesta semana e o que esperar do edital`;
  }

  // Sem entidade clara em comum — usa o título da notícia mais recente
  // como âncora em vez de inventar um título genérico.
  return items[0].title;
}

module.exports = { clusterNews, tokenize, jaccard, deriveClusterTopic };
