import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PostCard from "../components/PostCard";
import ScrollReveal from "../components/ScrollReveal";
import WelcomeCountdownRotator from "../components/WelcomeCountdownRotator";
import NewsletterInline from "../components/NewsletterInline";
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

        {/* Boas-vindas ↔ Countdown — próximo post */}
        <section className="cd-section">
          <WelcomeCountdownRotator postCount={allPosts.length} categoryCount={categories.length} />
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

        {/* Banner Simulado */}
        <section className="section section--alt reveal">
          <div className="container">
            <Link href="/simulado" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
              borderRadius: "var(--radius-xl)", padding: "36px 40px",
              textDecoration: "none", color: "#fff", gap: 24, flexWrap: "wrap",
              boxShadow: "var(--shadow-lg)", position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", top: -40, right: -40, width: 200, height: 200,
                background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none"
              }} />
              <div>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.75, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  ✦ Novo recurso
                </p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                  🎯 Simulado Gamificado
                </h2>
                <p style={{ opacity: 0.88, maxWidth: 480, lineHeight: 1.6, fontSize: "0.95rem" }}>
                  Teste seus conhecimentos com questões reais de concursos. Escolha a banca, a matéria e receba feedback instantâneo com XP e rankings.
                </p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius)",
                padding: "14px 28px", fontWeight: 700, fontSize: "1rem",
                whiteSpace: "nowrap", backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.25)", flexShrink: 0
              }}>
                Iniciar simulado →
              </div>
            </Link>
          </div>
        </section>

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
        {/* 📬 Newsletter — após os artigos recentes, momento de maior engajamento */}
        <section className="section section--alt reveal">
          <div className="container">
            <NewsletterInline variant="home" />
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}