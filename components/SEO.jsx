import Head from "next/head";
import config from "../../site.config";

export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  article,
  keywords,
}) {
  const siteTitle = title ? `${title} | ${config.name}` : config.name;
  const siteDescription = description || config.description;
  const siteUrl = config.url;
  const pageUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const image = ogImage ? `${siteUrl}${ogImage}` : `${siteUrl}${config.seo.ogImage}`;

  // JSON-LD para artigos (rico para SEO)
  const articleSchema = article
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: siteDescription,
        image: image,
        datePublished: article.date,
        dateModified: article.date,
        author: {
          "@type": "Organization",
          name: config.author.name,
          url: `${siteUrl}/metodologia`,
        },
        publisher: {
          "@type": "Organization",
          name: config.name,
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/logo.png`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        keywords: keywords?.join(", "),
        wordCount: article.wordCount,
        articleSection: article.category,
        inLanguage: config.language,
      }
    : null;

  // JSON-LD para o site
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    description: config.description,
    url: siteUrl,
    inLanguage: config.language,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Head>
      {/* Básico */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={keywords?.join(", ") || config.keywords.join(", ")} />
      <link rel="canonical" href={pageUrl} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
      <meta name="language" content={config.language} />

      {/* OpenGraph */}
      <meta property="og:type" content={article ? "article" : "website"} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={config.name} />
      <meta property="og:locale" content={config.locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={image} />
      {config.seo.twitterHandle && (
        <meta name="twitter:site" content={config.seo.twitterHandle} />
      )}

      {/* Artigo específico */}
      {article && (
        <>
          <meta property="article:published_time" content={article.date} />
          <meta property="article:author" content={config.author.name} />
          <meta property="article:section" content={article.category} />
          {keywords?.map(kw => (
            <meta key={kw} property="article:tag" content={kw} />
          ))}
        </>
      )}

      {/* Google Search Console */}
      {config.seo.googleSiteVerification && (
        <meta
          name="google-site-verification"
          content={config.seo.googleSiteVerification}
        />
      )}

      {/* AdSense */}
      {config.adsense.enabled && config.adsense.publisherId !== "ca-pub-XXXXXXXXXXXXXXXX" && (
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsense.publisherId}`}
          crossOrigin="anonymous"
        />
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}

      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#0f172a" />
    </Head>
  );
}
