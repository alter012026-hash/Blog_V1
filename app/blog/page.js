import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PostCard from "../../components/PostCard";
import { getAllPosts, getAllCategories } from "../../lib/posts";
import config from "../../../site.config";

export const revalidate = 3600;

export const metadata = {
  title: "Blog",
  description: `Todos os artigos sobre ${config.niche} publicados no ${config.name}.`,
};

export default function BlogPage({ searchParams }) {
  const categoria = searchParams?.categoria || null;
  const allPosts = getAllPosts();
  const categories = getAllCategories();

  const filteredPosts = categoria
    ? allPosts.filter(p => p.category === categoria)
    : allPosts;

  return (
    <>
      <Header />

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
              <div className="posts-grid">
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
