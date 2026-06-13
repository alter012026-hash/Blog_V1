import { getAllPosts } from "../../lib/posts";
import config from "../../../site.config";

export default function sitemap() {
  const posts = getAllPosts();
  const siteUrl = config.url;

  const staticPages = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/sobre`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const postPages = posts.map(post => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...postPages];
}
