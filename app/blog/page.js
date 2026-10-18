import Link from "next/link";
import PostCard from "../../components/PostCard";
import { getAllPosts, getAllCategories } from "../../lib/posts";
import { getCategoryMeta } from "../../lib/category-meta";
import config from "../../site.config";

// ✅ OBRIGATÓRIO: força modo dinâmico para que searchParams funcione
// Com revalidate estático, o Next.js 14 ignora searchParams completamente
export const dynamic = "force-dynamic";

// generateMetadata (em vez de `metadata` estático) porque precisamos
// reagir ao ?categoria= na URL:
//  - canonical sempre aponta pra /blog "limpo" — isso diz ao Google que
//    /blog?categoria=X é uma variação de /blog, não uma página nova.
//  - noindex,follow nas variantes filtradas — evita que cada categoria vire
//    uma página indexada duplicada (era o que estava acontecendo: o GSC
//    mostrava /blog?categoria=Editais posicionado como página própria).
//    "follow" mantém os links dos posts sendo rastreados normalmente.
export function generateMetadata({ searchParams }) {
  const categoria = searchParams?.categoria || null;
  const baseUrl = `${config.url}/blog`;

  return {
    title: categoria ? `${categoria}` : "Blog",
    description: categoria
      ? `Artigos sobre ${categoria} no ${config.name}.`
      : `Todos os artigos sobre ${config.niche} publicados no ${config.name}.`,
    alternates: { canonical: baseUrl },
    robots: categoria
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default function BlogPage({ searchParams }) {
  const categoria = searchParams?.categoria || null;
  const allPosts = getAllPosts();
  const categories = getAllCategories();

  const filteredPosts = categoria
    ? allPosts.filter((p) => p.category === categoria)
    : allPosts;
  const n = filteredPosts.length;

  return (
    <main>
      <section className="hero hero--page">
        <div className="container">
          <h1>{categoria ? categoria : "Todos os artigos"}</h1>
          <p className="hero-desc">
            {categoria
              ? getCategoryMeta(categoria).description
              : "Editais, cronogramas, carreiras e técnicas de estudo para concurso público."}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="container">
          <div className="filter-bar">
            <div className="categories-filter" role="list">
              <Link href="/blog" className={`cat-btn ${!categoria ? "active" : ""}`}>Todos</Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?categoria=${encodeURIComponent(cat)}`}
                  className={`cat-btn cat ${categoria === cat ? "active" : ""}`}
                  style={{ "--h": getCategoryMeta(cat).hue }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <p className="results-count">{n} artigo{n !== 1 ? "s" : ""}</p>

          {n > 0 ? (
            <div className="posts-grid posts-grid--long">
              {filteredPosts.map((post) => (
                <PostCard key={post.slug} post={post} headingLevel={2} />
              ))}
            </div>
          ) : (
            <p className="empty-state">Nenhum artigo nesta categoria ainda. <Link href="/blog" className="section-link">Ver todos</Link></p>
          )}
        </div>
      </section>
    </main>
  );
}
