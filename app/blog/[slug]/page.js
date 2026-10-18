import { notFound } from "next/navigation";
import PostCard from "../../../components/PostCard";
import AffiliateBox from "../../../components/AffiliateBox";
import CuriosityCard from "../../../components/CuriosityCard";
import TakeawaysCard from "../../../components/TakeawaysCard";
import ReadProgressEnhanced from "../../../components/ReadProgressEnhanced";
import NewsletterInline from "../../../components/NewsletterInline";
import NewsletterPopup from "../../../components/NewsletterPopup";
import ArticleQA from "../../../components/ArticleQA";
import ArticleByline from "../../../components/ArticleByline";
import ArticleToc from "../../../components/ArticleToc";
import ShareBar from "../../../components/ShareBar";
import PostCover from "../../../components/PostCover";
import Link from "next/link";
import { getCategoryMeta } from "../../../lib/category-meta";
import { getAllSlugs, getPostBySlug, getPostContentHtml, getRelatedPosts, getAllPosts } from "../../../lib/posts";
import { matchAffiliate, getAffiliatePair, getPinnedAffiliates } from "../../../lib/affiliate-matcher";
import { extractFAQs, generateFAQSchema } from "../../../lib/faq-extractor";
import config from "../../../site.config";

export const revalidate = 3600;


// ---------------------------------------------------------------------------
// Gera todas as páginas estáticas no build
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(slug => ({ slug }));
}

// ---------------------------------------------------------------------------
// Metadata dinâmica por artigo — com OG image e Twitter card completos
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  const siteUrl = config.url;
  const pageUrl = `${siteUrl}/blog/${params.slug}`;
  // OG image: usa a rota /og/[slug] que gera a capa automaticamente
  // (dados passados via query string, já que a rota roda no Edge Runtime)
  const ogParams = new URLSearchParams({
    title: post.title,
    category: post.category ?? "Concursos",
    excerpt: post.excerpt ?? "",
    readingTime: post.readingTime ?? "",
  });
  const ogImageUrl = `${siteUrl}/og/${params.slug}?${ogParams.toString()}`;

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
      modifiedTime: post.updatedAt ?? post.date,
      authors: [config.author.name],
      tags: [post.targetKeyword, ...post.secondaryKeywords],
      // ✅ Imagem OG — essencial para preview no Facebook/WhatsApp
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      // ✅ Imagem Twitter card
      images: [ogImageUrl],
    },
    alternates: { canonical: pageUrl },
  };
}

// ---------------------------------------------------------------------------
// Divide o HTML do artigo ao meio para inserir afiliado inline
// ---------------------------------------------------------------------------
function splitContentAtMidpoint(html) {
  // Divide após o fechamento do ~30% do conteúdo (primeiro parágrafo além de 1/3)
  const paragraphs = html.split("</p>");
  if (paragraphs.length < 4) {
    // Artigo curto: não divide
    return { before: html, after: null };
  }
  const splitAt = Math.max(2, Math.floor(paragraphs.length * 0.35));
  const before = paragraphs.slice(0, splitAt).join("</p>") + "</p>";
  const after  = paragraphs.slice(splitAt).join("</p>");
  return { before, after };
}

// ---------------------------------------------------------------------------
// Âncoras nos <h2> + índice do artigo
// ---------------------------------------------------------------------------
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "secao";
}

function addHeadingIds(html) {
  const used = new Map();
  const toc = [];
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    let id = slugifyHeading(text);
    const n = used.get(id) || 0;
    used.set(id, n + 1);
    if (n > 0) id = `${id}-${n + 1}`;
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

// ---------------------------------------------------------------------------
// Página do post
// ---------------------------------------------------------------------------
export default async function PostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const rawHtml       = await getPostContentHtml(post.content);
  const { html: contentHtml, toc } = addHeadingIds(rawHtml);
  const relatedPosts  = getRelatedPosts(params.slug, post.category);
  const affiliatePair    = getAffiliatePair(post.content, config.affiliates, params.slug);
  const matchedAffiliate = affiliatePair[0] || null;
  const secondAffiliate  = affiliatePair[1] || null;
  const pinnedAffiliates = getPinnedAffiliates(config.affiliates);

  // Divide conteúdo para inserir afiliado no meio
  const { before: contentBefore, after: contentAfter } = splitContentAtMidpoint(contentHtml);

  // post.date vem como ISO completo (2026-06-27T00:00:00.000Z); extrai só
  // YYYY-MM-DD. (Antes: new Date(post.date + "T12:00:00") → "Invalid Date".)
  const dm = String(post.date || "").match(/(\d{4})-(\d{2})-(\d{2})/);
  const formattedDate = dm
    ? new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3])).toLocaleDateString("pt-BR", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
      })
    : "";

  const siteUrl  = config.url;
  const pageUrl  = `${siteUrl}/blog/${params.slug}`;
  const ogParams = new URLSearchParams({
    title: post.title,
    category: post.category ?? "Concursos",
    excerpt: post.excerpt ?? "",
    readingTime: post.readingTime ?? "",
  });
  const ogImage  = `${siteUrl}/og/${params.slug}?${ogParams.toString()}`;

  // JSON-LD Article — com image e dateModified corretos
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    // ✅ dateModified separado — usa updatedAt do frontmatter se existir
    dateModified: post.updatedAt ?? post.date,
    author: { "@type": "Organization", name: config.author.name, url: config.url },
    publisher: {
      "@type": "Organization",
      name: config.name,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    // ✅ Imagem do artigo — essencial para Google Discover / rich results
    image: {
      "@type": "ImageObject",
      url: ogImage,
      width: 1200,
      height: 630,
    },
    keywords: [post.targetKeyword, ...post.secondaryKeywords].join(", "),
    wordCount: post.wordCount,
    articleSection: post.category,
    inLanguage: config.language,
  };

  // FAQ schema — só gera quando o post tem uma seção "## FAQ" ou
  // "## Perguntas Frequentes" com perguntas e respostas reais (nunca com
  // texto placeholder), pra habilitar rich results de FAQ no Google.
  const faqs = extractFAQs(post.content);
  const faqSchema = generateFAQSchema(faqs);

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início",  item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blog",    item: `${siteUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.category, item: `${siteUrl}/blog?categoria=${encodeURIComponent(post.category)}` },
      { "@type": "ListItem", position: 4, name: post.title, item: pageUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <ReadProgressEnhanced />

      <main>
        <article className="article-shell cat" style={{ "--h": getCategoryMeta(post.category).hue }}>
          <div className="container article-grid">
            <div className="article-main">

              {/* Cabeçalho do artigo */}
              <header className="article-header">
                <nav className="breadcrumb" aria-label="Você está em">
                  <Link href="/">Início</Link><span aria-hidden="true">/</span>
                  <Link href="/blog">Artigos</Link><span aria-hidden="true">/</span>
                  <Link href={`/blog?categoria=${encodeURIComponent(post.category)}`}>{post.category}</Link>
                </nav>

                <div className="article-art" aria-hidden="true">
                  <PostCover slug={params.slug} category={post.category} />
                </div>

                <div className="article-category-bar">
                  <span className="article-cat-badge">{post.category}</span>
                  <span className="article-meta-item">
                    <time dateTime={post.date}>{formattedDate}</time>
                  </span>
                  <span className="article-meta-item">{post.readingTime} de leitura</span>
                </div>

                <h1 className="article-title">{post.title}</h1>
                <p className="article-excerpt">{post.excerpt}</p>
                <ArticleByline />
                <ShareBar url={pageUrl} title={post.title} />
              </header>

              <ArticleToc items={toc} variant="mobile" />

              {/* Spoiler do artigo — o que o leitor vai encontrar */}
              <TakeawaysCard takeaways={post.takeaways} />

              {/* Imagem de capa gerada por IA */}
              {post.coverImage && (
                <div className="article-cover-image">
                  <img src={post.coverImage} alt={post.title} width="1059" height="556" loading="eager" decoding="async" />
                </div>
              )}

              {/* Curiosidade */}
              <CuriosityCard curiosity={post.curiosity} />

            {/* Primeira metade do conteúdo */}
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: contentBefore }}
            />

            {/* ✅ Afiliado no meio do artigo (contextual, se houver match) */}
            {contentAfter && matchedAffiliate && (
              <AffiliateBox affiliate={matchedAffiliate} />
            )}

            {/* 📬 Newsletter inline no meio do artigo — alta conversão */}
            {contentAfter && (
              <NewsletterInline variant="article" />
            )}

            {/* Segunda metade do conteúdo (ou nada se artigo for curto) */}
            {contentAfter && (
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: contentAfter }}
              />
            )}

            {/* Afiliado contextual no fim (só se NÃO foi inserido no meio) */}
            {!contentAfter && matchedAffiliate && (
              <AffiliateBox affiliate={matchedAffiliate} />
            )}

            {/* Segundo afiliado — sempre no fim do artigo, diferente do primeiro */}
            {secondAffiliate && (
              <AffiliateBox affiliate={secondAffiliate} />
            )}

            {/* Afiliados fixos — sempre exibidos */}
            {pinnedAffiliates.map((aff) => (
              <AffiliateBox key={aff.id} affiliate={aff} />
            ))}

            {/* 🤖 Tire sua dúvida — Q&A via IA com contexto do artigo */}
            <ArticleQA slug={params.slug} />

              <ShareBar url={pageUrl} title={post.title} />
            </div>

            <aside className="article-aside">
              <ArticleToc items={toc} variant="desktop" />
            </aside>
          </div>

          {/* Posts relacionados */}
          {relatedPosts.length > 0 && (
            <div className="container related-wrap">
              <aside className="related-posts">
                <h3>Continue estudando</h3>
                <div className="posts-grid">
                  {relatedPosts.map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              </aside>
            </div>
          )}
        </article>
      </main>

      <NewsletterPopup />
    </>
  );
}
