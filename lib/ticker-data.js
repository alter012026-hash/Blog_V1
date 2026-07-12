import { getAllPosts } from "./posts";

/**
 * Lista leve de "curiosidades" (campo já existente no frontmatter de cada
 * post, usado no CuriosityCard dentro do artigo) para alimentar o ticker
 * lateral fixo — reaproveita conteúdo que já existe, sem precisar de uma
 * fonte de dados nova. Cada item linka de volta pro artigo de origem.
 */
export function getTickerItems(limit = 24) {
  const posts = getAllPosts().filter((p) => p.curiosity);

  const items = posts.slice(0, limit).map((p) => ({
    slug: p.slug,
    category: p.category,
    text: truncate(p.curiosity, 130),
  }));

  return items;
}

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 0 ? lastSpace : max).trim() + "…";
}
