import Link from "next/link";
import PostCard from "../../components/PostCard";
import { getAllPosts, getAllCategories } from "../../lib/posts";
import { getCategoryMeta } from "../../lib/category-meta";
import { getBrazilState, postMatchesBrazilState } from "../../lib/brazil-states";
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
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const categoria = params?.categoria || null;
  const estado = getBrazilState(params?.estado);
  const baseUrl = `${config.url}/blog`;
  const pageTitle = [categoria, estado ? `Concursos em ${estado.name}` : null].filter(Boolean).join(" | ");

  return {
    title: pageTitle || "Blog",
    description: pageTitle
      ? `Artigos${categoria ? ` sobre ${categoria}` : ""}${estado ? ` relacionados a concursos em ${estado.name}` : ""} no ${config.name}.`
      : `Todos os artigos sobre ${config.niche} publicados no ${config.name}.`,
    alternates: { canonical: baseUrl },
    robots: categoria || estado
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function BlogPage({ searchParams }) {
  const params = await searchParams;
  const categoria = params?.categoria || null;
  const estado = getBrazilState(params?.estado);
  const allPosts = getAllPosts();
  const categories = getAllCategories();

  const filteredPosts = allPosts.filter((post) =>
    (!categoria || post.category === categoria) &&
    (!estado || postMatchesBrazilState(post, estado))
  );
  const n = filteredPosts.length;
  const blogTitle = estado
    ? `Concursos em ${estado.name}`
    : categoria || "Todos os artigos";

  return (
    <main>
      <section className="hero hero--page">
        <div className="container">
          <h1>{blogTitle}</h1>
          <p className="hero-desc">
            {estado
              ? `Editais, notícias e conteúdos relacionados a ${estado.name} e ${estado.capital}.`
              : categoria
                ? getCategoryMeta(categoria).description
                : "Editais, cronogramas, carreiras e técnicas de estudo para concurso público."}
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="container">
          <div className="filter-bar">
            <div className="categories-filter" role="list">
              <Link
                href={estado ? `/blog?estado=${estado.code}` : "/blog"}
                className={`cat-btn ${!categoria ? "active" : ""}`}
              >
                Todos
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?${new URLSearchParams({
                    ...(estado ? { estado: estado.code } : {}),
                    categoria: cat,
                  }).toString()}`}
                  className={`cat-btn cat ${categoria === cat ? "active" : ""}`}
                  style={{ "--h": getCategoryMeta(cat).hue }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {estado && (
            <p className="state-filter-notice">
              Exibindo artigos relacionados a {estado.name}.
              <Link href={categoria ? `/blog?categoria=${encodeURIComponent(categoria)}` : "/blog"}>
                Limpar estado
              </Link>
            </p>
          )}
          <p className="results-count">{n} artigo{n !== 1 ? "s" : ""}</p>

          {n > 0 ? (
            <div className="posts-grid posts-grid--long">
              {filteredPosts.map((post) => (
                <PostCard key={post.slug} post={post} headingLevel={2} />
              ))}
            </div>
          ) : (
            <p className="empty-state">
              {estado
                ? `Ainda não encontramos artigos específicos para ${estado.name}.`
                : "Nenhum artigo nesta categoria ainda."}{" "}
              <Link href={categoria ? `/blog?categoria=${encodeURIComponent(categoria)}` : "/blog"} className="section-link">
                Ver todos os artigos
              </Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
