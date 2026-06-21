import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PostCard from "../components/PostCard";
import ScrollReveal from "../components/ScrollReveal";
import { getAllPosts, getAllCategories } from "../lib/posts";
import { getSearchIndex } from "../lib/search-index";
import config from "../site.config";

export const revalidate = 3600; // revalida a cada hora

export default function HomePage() {
  const allPosts = getAllPosts();
  const featuredPost = allPosts[0];
  const latestPosts = allPosts.slice(1, 7);
  const categories = getAllCategories();
  const searchIndex = getSearchIndex();

  return (
    <>
      <Header posts={searchIndex} />
      <ScrollReveal />

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <p className="hero-eyebrow">✦ {config.niche}</p>
            <h1>
              Tudo Sobre Concursos<br />
              para quem quer <em>ser aprovado</em>
            </h1>
            <p className="hero-desc">{config.description}</p>
            <Link href="/blog" className="hero-cta">
              Explorar artigos →
            </Link>
          </div>
        </section>

        {/* Destaque */}
        {featuredPost && (
          <section className="section section--light reveal">
            <div className="container">
              <div className="section-header">
                <p className="section-label">Artigo em destaque</p>
                <h2 className="section-title">Última publicação</h2>
              </div>
              <PostCard post={featuredPost} featured />
            </div>
          </section>
        )}

        {/* Categorias */}
        {categories.length > 0 && (
          <section className="section section--alt reveal">
            <div className="container">
              <div className="section-header">
                <p className="section-label">Navegue por tema</p>
                <h2 className="section-title">Categorias</h2>
              </div>
              <div className="categories-filter">
                {categories.map(cat => (
                  <Link key={cat} href={`/blog?categoria=${encodeURIComponent(cat)}`} className="cat-btn">
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Posts recentes */}
        <section className="section section--light">
          <div className="container">
            <div className="section-header reveal">
              <p className="section-label">Conteúdo recente</p>
              <h2 className="section-title">Artigos publicados</h2>
            </div>

            {latestPosts.length > 0 ? (
              <div className="posts-grid reveal-stagger">
                {latestPosts.map(post => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "48px 0" }}>
                Os artigos serão publicados em breve. Execute o script de geração para começar.
              </p>
            )}

            {allPosts.length > 7 && (
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <Link href="/blog" className="hero-cta">
                  Ver todos os artigos →
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
