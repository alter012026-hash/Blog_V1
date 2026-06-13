import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

const postsDirectory = path.join(process.cwd(), "posts");

export function getAllPosts() {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith(".md"));

  const posts = fileNames.map(fileName => {
    const slug = fileName.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Calcular tempo de leitura
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    return {
      slug,
      fileName,
      title: data.title || "",
      date: data.date || "",
      category: data.category || "Geral",
      excerpt: data.excerpt || content.slice(0, 160) + "...",
      targetKeyword: data.targetKeyword || "",
      secondaryKeywords: data.secondaryKeywords || [],
      readingTime: `${readingTime} min`,
      wordCount,
    };
  });

  // Ordenar por data (mais recente primeiro)
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug) {
  if (!fs.existsSync(postsDirectory)) return null;

  const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith(".md"));
  const fileName = fileNames.find(f => f.includes(slug));
  if (!fileName) return null;

  const fullPath = path.join(postsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return {
    slug,
    title: data.title || "",
    date: data.date || "",
    category: data.category || "Geral",
    excerpt: data.excerpt || content.slice(0, 160) + "...",
    targetKeyword: data.targetKeyword || "",
    secondaryKeywords: data.secondaryKeywords || [],
    readingTime: `${readingTime} min`,
    wordCount,
    content,
  };
}

export async function getPostContentHtml(content) {
  const processed = await remark().use(remarkHtml, { sanitize: false }).process(content);
  return processed.toString();
}

export function getAllCategories() {
  const posts = getAllPosts();
  const categories = [...new Set(posts.map(p => p.category))];
  return categories.sort();
}

export function getPostsByCategory(category) {
  return getAllPosts().filter(p => p.category === category);
}

export function getRelatedPosts(slug, category, limit = 3) {
  return getAllPosts()
    .filter(p => p.slug !== slug && p.category === category)
    .slice(0, limit);
}

export function getAllSlugs() {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs.readdirSync(postsDirectory)
    .filter(f => f.endsWith(".md"))
    .map(f => f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, ""));
}
