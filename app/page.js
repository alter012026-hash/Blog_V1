import Link from "next/link";
import PostCard from "../components/PostCard";
import LatestCarousel from "../components/LatestCarousel";
import CategoryCards from "../components/CategoryCards";
import QuickStart from "../components/QuickStart";
import HeroSheet from "../components/HeroSheet";
import NewsletterInline from "../components/NewsletterInline";
import BrazilStateMap from "../components/BrazilStateMap";
import AdSense from "../components/AdSense";
import AdSliverGuard from "../components/AdSliverGuard";
import { getAllPosts, getCategoryStats, getPostBySlug } from "../lib/posts";
import { getWeeklyFeatured } from "../lib/weekly-featured";
import config from "../site.config";

export const revalidate = 3600;

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

export default function HomePage() {
  const allPosts = getAllPosts();
  const weeklyFeatured = getWeeklyFeatured();
  const weeklyFeaturedPost = weeklyFeatured ? getPostBySlug(weeklyFeatured.slug) : null;
  const currentTime = Date.now();
  const weekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
  const weeklyPosts = allPosts
    .filter((post) => {
      const publishedAt = post.date ? new Date(post.date).getTime() : NaN;
      return post.slug !== weeklyFeaturedPost?.slug
        && publishedAt >= weekAgo
        && publishedAt <= currentTime;
    })
    .slice(0, 3);
  const weeklyPostSlugs = new Set(weeklyPosts.map((post) => post.slug));
  const latestPosts = allPosts
    .filter((post) => post.slug !== weeklyFeaturedPost?.slug
      && !weeklyPostSlugs.has(post.slug))
    .slice(0, 10);
  const categoryStats = getCategoryStats();

  // O painel de anúncio só existe quando o AdSense está realmente configurado
  // e em produção. Antes ele aparecia como uma caixa vazia ("Publicidade" sem anúncio).
  const adsReady = Boolean(
    process.env.NODE_ENV === "production" &&
    config.adsense.enabled &&
    config.adsense.slots.sidebar &&
    config.adsense.publisherId !== "ca-pub-XXXXXXXXXXXXXXXX"
  );

  return (
    <main>
      <AdSliverGuard />
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <HeroSheet />
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Guia direto para passar em concurso público</h1>
            <p className="hero-desc">
              Editais que mudaram, cronogramas prontos, materiais gratuitos e simulado.
              Tudo em português claro, para ler no celular entre um estudo e outro.
            </p>
            <div className="hero-actions">
              <Link href="/blog?categoria=Editais" className="btn btn--hl">Ver editais da semana</Link>
              <Link href="/simulado" className="btn btn--ghost">Fazer um simulado</Link>
            </div>
            <p className="hero-facts">
              {allPosts.length} artigos em {categoryStats.length} temas, atualizados com frequência.
            </p>
          </div>
          <QuickStart />
        </div>
      </section>

      {weeklyFeaturedPost && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="section-label">Escolhido pela redação</p>
                <h2 className="section-title">Destaque da semana</h2>
              </div>
            </div>
            <div className="posts-grid">
              <PostCard post={weeklyFeaturedPost} featured photo={weeklyFeaturedPost.coverImage} />
            </div>
          </div>
        </section>
      )}

      {/* ── Seletor de estado + espaço para anúncio ───────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-label">Oportunidades perto de você</p>
              <h2 className="section-title">Explore concursos por estado</h2>
            </div>
          </div>
          <div className={`state-ad-grid ${adsReady ? "" : "state-ad-grid--solo"}`.trim()}>
            <div className="state-explorer-panel">
              <p className="state-explorer-intro">
                Escolha uma região no mapa para encontrar editais e notícias relacionados ao seu estado.
              </p>
              <BrazilStateMap />
            </div>
            {adsReady && (
              <aside className="home-ad-panel" aria-label="Espaço publicitário">
                <span className="home-ad-label">Publicidade</span>
                <AdSense
                  slot={config.adsense.slots.sidebar}
                  placement="home"
                  format="auto"
                  label={false}
                />
              </aside>
            )}
          </div>
        </div>
      </section>

      {weeklyPosts.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="section-label">Publicados nos últimos 7 dias</p>
                <h2 className="section-title">Artigos recentes da semana</h2>
              </div>
              <Link href="/blog" className="section-link">Ver todos</Link>
            </div>
            <div className="posts-grid">
              {weeklyPosts.map((post) => <PostCard key={post.slug} post={post} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Novos artigos ────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Novos artigos</h2>
            <Link href="/blog" className="section-link">Ver todos</Link>
          </div>
          <LatestCarousel posts={latestPosts} />
        </div>
      </section>

      {/* ── Temas ────────────────────────────────────────────── */}
      {categoryStats.length > 0 && (
        <section className="section section--alt section--tight">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Explore por tema</h2>
            </div>
            <CategoryCards categories={categoryStats} />
          </div>
        </section>
      )}

      {/* ── Ferramentas ──────────────────────────────────────── */}
      <section className="section">
        <div className="container tools-grid">
          <Link href="/simulado" className="tool tool--exam">
            <div className="tool-choices" aria-hidden="true">
              <i>A</i><i>B</i><i className="is-marked">C</i><i>D</i><i>E</i>
            </div>
            <h2 className="tool-title">Simulado com feedback na hora</h2>
            <p className="tool-text">Escolha a banca e a matéria, responda questões e veja o gabarito comentado, com XP e sequência de acertos.</p>
            <span className="tool-cta">Iniciar simulado <span aria-hidden="true">→</span></span>
          </Link>
          <Link href="/materiais" className="tool tool--files">
            <div className="tool-files" aria-hidden="true"><b>Videoaulas</b><b>PDF</b><b>Resumos</b></div>
            <h2 className="tool-title">Materiais gratuitos, sem cadastro</h2>
            <p className="tool-text">Videoaulas, apostilas e resumos reunidos em uma pasta pública. Baixe o que precisar.</p>
            <span className="tool-cta">Ver materiais <span aria-hidden="true">→</span></span>
          </Link>
        </div>
      </section>

      {/* ── Como produzimos ──────────────────────────────────── */}
      <section className="section section--alt">
        <div className="container trust">
          <div className="trust-intro">
            <h2 className="section-title">Conteúdo com fonte e revisão</h2>
            <p>{config.methodology.summary}</p>
            <p><Link className="section-link" href="/metodologia">Entenda como produzimos</Link></p>
          </div>
          <div className="trust-list">
            {[
              ["Fontes oficiais", "Editais, Diário Oficial e legislação são a base de cada texto."],
              ["Apoio de IA, com revisão", "A IA acelera a redação; a checagem e a curadoria são editoriais."],
              ["Atualização contínua", "Páginas de editais mudam: acompanhe o que mudou na semana."],
            ].map(([t, d]) => (
              <div key={t} className="trust-item">
                <span className="trust-check"><Check /></span>
                <div><h3>{t}</h3><p>{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <NewsletterInline variant="home" />
        </div>
      </section>
    </main>
  );
}
