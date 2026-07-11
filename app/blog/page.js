import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PostCard from "../../components/PostCard";
import ScrollReveal from "../../components/ScrollReveal";
import { getAllPosts, getAllCategories } from "../../lib/posts";
import { getSearchIndex } from "../../lib/search-index";
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
  const allPosts    = getAllPosts();
  const categories  = getAllCategories();
  const searchIndex = getSearchIndex();

  const filteredPosts = categoria
    ? allPosts.filter(p => p.category === categoria)
    : allPosts;

  return (
    <>
      <Header posts={searchIndex} />
      <ScrollReveal />

      <main>
        <section className="hero" style={{ padding: "56px 0 40px" }}>
          <div className="container">
            <p className="hero-eyebrow">✦ Todos os artigos</p>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>
              {categoria ? `${categoria}` : "Blog"}
            </h1>
            <p className="hero-desc" style={{ marginBottom: 0 }}>
              {filteredPosts.length} artigo{filteredPosts.length !== 1 ? "s" : ""} publicado{filteredPosts.length !== 1 ? "s" : ""}
            </p>
          </div>
        </section>

        <section className="section section--light">
          <div className="container">

            {/* Filtro de categorias */}
            <div className="categories-filter">
              <Link
                href="/blog"
                className={`cat-btn ${!categoria ? "active" : ""}`}
              >
                Todos
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat}
                  href={`/blog?categoria=${encodeURIComponent(cat)}`}
                  className={`cat-btn ${categoria === cat ? "active" : ""}`}
                >
                  {cat}
                </Link>
              ))}
            </div>

            {filteredPosts.length > 0 ? (
              <div className="posts-grid reveal-stagger">
                {filteredPosts.map(post => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "80px 0" }}>
                Nenhum artigo encontrado nesta categoria.
              </p>
            )}

          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
