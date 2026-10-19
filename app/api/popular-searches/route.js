import { NextResponse } from "next/server";
import { getAllPosts, getPostBySlug } from "../../../lib/posts";
import { getAccessToken, getPeriods, getServiceAccount, querySearchAnalytics } from "../../../lib/google-search-console";
import { getCategoryMeta } from "../../../lib/category-meta";
import config from "../../../site.config";

export const dynamic = "force-dynamic";

function normalizePath(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  } catch {
    return "";
  }
}

function getPublishedPostsByPath() {
  const byPath = new Map();
  for (const post of getAllPosts()) {
    const postPath = `/blog/${post.slug}`;
    if (!byPath.has(postPath)) byPath.set(postPath, getPostBySlug(post.slug) || post);
  }
  return byPath;
}

function rankTopics(rows, postsByPath) {
  const topics = new Map();

  for (const row of rows) {
    const query = String(row.keys?.[0] || "").trim().replace(/\s+/g, " ");
    const postPath = normalizePath(row.keys?.[1] || "");
    const post = postsByPath.get(postPath);
    if (!query || !post) continue;

    const key = query.toLocaleLowerCase("pt-BR");
    let topic = topics.get(key);
    if (!topic) {
      topic = { query, impressions: 0, clicks: 0, pages: new Map() };
      topics.set(key, topic);
    }

    const impressions = row.impressions || 0;
    const clicks = row.clicks || 0;
    topic.impressions += impressions;
    topic.clicks += clicks;

    const page = topic.pages.get(postPath) || { post, impressions: 0, clicks: 0 };
    page.impressions += impressions;
    page.clicks += clicks;
    topic.pages.set(postPath, page);
  }

  const ranked = Array.from(topics.values())
    .map((topic) => {
      const target = Array.from(topic.pages.values())
        .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)[0];
      return {
        query: topic.query,
        impressions: topic.impressions,
        clicks: topic.clicks,
        path: `/blog/${target.post.slug}`,
        title: target.post.title,
        category: target.post.category,
        hue: getCategoryMeta(target.post.category).hue,
      };
    })
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.query.localeCompare(b.query, "pt-BR"))
    .slice(0, 6);

  const maxImpressions = Math.max(ranked[0]?.impressions || 0, 1);
  return ranked.map(({ impressions, clicks, ...topic }) => ({
    ...topic,
    relativeImpressions: Math.round((impressions / maxImpressions) * 100),
  }));
}

export async function GET() {
  let serviceAccount;
  try {
    serviceAccount = getServiceAccount();
  } catch (error) {
    console.error("Não foi possível ler a credencial do Search Console:", error);
    return NextResponse.json({ error: "A credencial do Google não pôde ser lida." }, { status: 503 });
  }

  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    return NextResponse.json({ error: "O Search Console não está configurado no servidor." }, { status: 503 });
  }

  const property = process.env.SEARCH_CONSOLE_SITE_URL || `sc-domain:${new URL(config.url).hostname}`;
  const periods = getPeriods();

  try {
    const token = await getAccessToken(serviceAccount);
    const rows = await querySearchAnalytics(property, token, periods.current, ["query", "page"], [
      { field: "impressions", direction: "DESCENDING" },
    ]);
    const topics = rankTopics(rows, getPublishedPostsByPath());
    return NextResponse.json(
      { period: periods.current, topics, fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    console.error("Falha ao consultar os termos de busca do Search Console:", error);
    const status = error.status === 403 || error.status === 404 ? 503 : 502;
    return NextResponse.json({ error: "Não foi possível carregar os termos do Google Search Console." }, { status });
  }
}
