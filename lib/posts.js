import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const postsDirectory = path.join(process.cwd(), "posts");

/* =========================
   HELPERS SEGURAS
========================= */

function parseDate(date) {
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

function cleanExcerpt(content) {
  return content
    .replace(/[#*_>\-\[\]]/g, "") // remove markdown básico
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

/* =========================
   POSTS
========================= */

export function getAllPosts() {
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory).filter(f => f.endsWith(".md"));

  const posts = fileNames.map(fileName => {
    const slug = fileName
      .replace(/^\d{4}-\d{2}-\d{2}-/, "")
      .replace(/\.md$/, "");

    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // leitura
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    const safeDate = parseDate(data.date);

    return {
      slug,
      fileName,
      title: data.title || "",
      date: safeDate ? safeDate.toISOString() : null,
      category: data.category || "Geral",
      excerpt: data.excerpt || cleanExcerpt(content) + "...",
      curiosity: data.curiosity || null,
      coverImage: data.coverImage || null,
      targetKeyword: data.targetKeyword || "",
      secondaryKeywords: data.secondaryKeywords || [],
      readingTime: `${readingTime} min`,
      wordCount,
    };
  });

  // ordenação segura (mais recente primeiro)
  return posts.sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return db - da;
  });
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

  const safeDate = parseDate(data.date);

  return {
    slug,
    title: data.title || "",
    date: safeDate ? safeDate.toISOString() : null,
    category: data.category || "Geral",
    excerpt: data.excerpt || cleanExcerpt(content) + "...",
    curiosity: data.curiosity || null,
    coverImage: data.coverImage || null,
    targetKeyword: data.targetKeyword || "",
    secondaryKeywords: data.secondaryKeywords || [],
    readingTime: `${readingTime} min`,
    wordCount,
    content,
  };
}

export async function getPostContentHtml(content) {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content);

  let html = processed.toString();

  // Envolve cada <table> num container com scroll horizontal próprio.
  // Tabelas de markdown (comparativos, cronogramas) podem ter várias
  // colunas; sem isso, em telas estreitas elas espremem o texto até
  // ficar ilegível ou estouram a largura da página inteira.
  html = html.replace(/<table>/g, '<div class="table-scroll"><table>');
  html = html.replace(/<\/table>/g, "</table></div>");

  return html;
}

/* =========================
   CATEGORIAS
========================= */

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

/* =========================
   SLUGS
========================= */

export function getAllSlugs() {
  if (!fs.existsSync(postsDirectory)) return [];

  return fs.readdirSync(postsDirectory)
    .filter(f => f.endsWith(".md"))
    .map(f =>
      f
        .replace(/^\d{4}-\d{2}-\d{2}-/, "")
        .replace(/\.md$/, "")
    );
}