import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import PostCard from "../../../components/PostCard";
import AffiliateBox from "../../../components/AffiliateBox";
import { getAllSlugs, getPostBySlug, getPostContentHtml, getRelatedPosts } from "../../../lib/posts";
import { matchAffiliate, getPinnedAffiliates } from "../../../lib/affiliate-matcher";
import config from "../../../site.config";

export const revalidate = 3600;

// Gera todas as páginas estáticas no build
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(slug => ({ slug }));
}

// Metadata dinâmica por artigo
export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  const siteUrl = config.url;
  const pageUrl = `${siteUrl}/blog/${params.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: [post.targetKeyword, ...post.secondaryKeywords],
    authors: [{ name: config.author.name }],
    openGraph: {
      type: "article",
      url: pageUrl,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [config.author.name],
      tags: [post.targetKeyword, ...post.secondaryKeywords],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    alternates: { canonical: pageUrl },
  };
}

export default async function PostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const contentHtml = await getPostContentHtml(post.content);
  const relatedPosts = getRelatedPosts(params.slug, post.category);
  const matchedAffiliate = matchAffiliate(post.content, config.affiliates);
  const pinnedAffiliates = getPinnedAffiliates(config.affiliates);

  const formattedDate = new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // JSON-LD Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: config.author.name },
    publisher: {
      "@type": "Organization",
      name: config.name,
      logo: { "@type": "ImageObject", url: `${config.url}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${config.url}/blog/${params.slug}` },
    keywords: [post.targetKeyword, ...post.secondaryKeywords].join(", "),
    wordCount: post.wordCount,
    articleSection: post.category,
    inLanguage: config.language,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Header />

      <main>
        <article>
          <div className="article-layout">
            {/* Header do artigo */}
            <header className="article-header">
              <div className="article-category-bar">
                <span className="article-cat-badge">{post.category}</span>
                <span className="article-meta-item">
                  <time dateTime={post.date}>{formattedDate}</time>
                </span>
                <span className="article-meta-item">{post.readingTime} de leitura</span>
                <span className="article-meta-item">{post.wordCount.toLocaleString("pt-BR")} palavras</span>
              </div>

              <h1 className="article-title">{post.title}</h1>
              <p className="article-excerpt">{post.excerpt}</p>
            </header>

            <hr className="article-divider" />

            {/* Corpo do artigo */}
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* Indicação de afiliado relevante ao tema do post */}
            {matchedAffiliate && <AffiliateBox affiliate={matchedAffiliate} />}

            {/* Afiliados fixos (sem relação temática com o conteúdo, exibidos sempre) */}
            {pinnedAffiliates.map((aff) => (
              <AffiliateBox key={aff.id} affiliate={aff} />
            ))}

            {/* Posts relacionados */}
            {relatedPosts.length > 0 && (
              <aside className="related-posts">
                <h3>Artigos relacionados</h3>
                <div className="posts-grid">
                  {relatedPosts.map(p => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              </aside>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
