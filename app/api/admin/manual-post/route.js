import { NextResponse } from "next/server";
import { checkAdminAuth } from "../../../../lib/admin-auth";
import { commitFile, getFile, deleteFile, triggerVercelDeploy } from "../../../../lib/github-commit";
import { slugify } from "../../../../lib/article-generator";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "posts");

function escapeForYaml(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function buildExcerpt(body, fallbackTitle) {
  const plain = String(body || "")
    .replace(/[#*_>`\-\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return fallbackTitle || "Post manual";
  return plain.slice(0, 160) || fallbackTitle || "Post manual";
}

function parseDate(date) {
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

function buildManualMarkdown({ title, slug, category, excerpt, body, coverImage, forceFile, existingFrontmatter }) {
  const normalizedTitle = String(title || "Post manual").trim() || "Post manual";
  const safeSlug = slugify(
    forceFile
      ? forceFile.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "")
      : (slug || title || "post-manual")
  );
  const date = existingFrontmatter?.date || (forceFile?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || new Date().toISOString().slice(0, 10));
  const file = forceFile || `${date}-${safeSlug}.md`;
  const cleanedBody = String(body || "").trim();
  const finalExcerpt = String(excerpt || buildExcerpt(cleanedBody, normalizedTitle)).trim();
  const finalCategory = existingFrontmatter?.category || category || "Geral";
  const finalCoverImage = coverImage || existingFrontmatter?.coverImage || null;

  const frontmatter = [
    "---",
    `title: "${escapeForYaml(normalizedTitle)}"`,
    `date: "${date}"`,
    `category: "${escapeForYaml(finalCategory)}"`,
    `excerpt: "${escapeForYaml(finalExcerpt)}"`,
    finalCoverImage ? `coverImage: "${escapeForYaml(finalCoverImage)}"` : null,
    "---",
    "",
    "",
  ].filter(Boolean).join("\n");

  return { file, slug: safeSlug, content: `${frontmatter}${cleanedBody}\n` };
}

function summarizePost(fileName) {
  const fullPath = path.join(postsDirectory, fileName);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  const slug = fileName.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
  const safeDate = parseDate(data.date || fileName.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]);
  const words = content.split(/\s+/).filter(Boolean).length;

  return {
    file: fileName,
    title: data.title || slug,
    slug,
    date: safeDate ? safeDate.toISOString().slice(0, 10) : "",
    category: data.category || "Geral",
    excerpt: data.excerpt || buildExcerpt(content, data.title || slug),
    coverImage: data.coverImage || null,
    words,
  };
}

export async function GET(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const requestedFile = searchParams.get("file")?.trim();

    if (requestedFile) {
      const existing = await getFile(`posts/${requestedFile}`);
      if (!existing) {
        return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
      }
      const { data, content } = matter(existing.content);
      return NextResponse.json({
        post: {
          file: requestedFile,
          title: data.title || "",
          slug: requestedFile.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, ""),
          category: data.category || "Geral",
          excerpt: data.excerpt || "",
          content,
          coverImage: data.coverImage || "",
          date: data.date || "",
        },
      });
    }

    if (!fs.existsSync(postsDirectory)) {
      return NextResponse.json({ posts: [] });
    }

    const fileNames = fs.readdirSync(postsDirectory).filter((file) => file.endsWith(".md"));
    const posts = fileNames.map(summarizePost).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[admin/manual-post][GET]", err);
    return NextResponse.json({ error: err.message || "Erro ao listar posts." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { title, slug, category, excerpt, body, coverImage, file } = payload || {};

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Informe um título para o post." }, { status: 400 });
    }
    if (!body || !String(body).trim()) {
      return NextResponse.json({ error: "Escreva o conteúdo do post manual." }, { status: 400 });
    }

    const targetFile = typeof file === "string" ? file.trim() : "";
    let existingFrontmatter = null;
    if (targetFile) {
      const existing = await getFile(`posts/${targetFile}`);
      if (existing) {
        const parsed = matter(existing.content);
        existingFrontmatter = parsed.data;
      }
    }

    const article = buildManualMarkdown({
      title,
      slug,
      category,
      excerpt,
      body,
      coverImage,
      forceFile: targetFile || undefined,
      existingFrontmatter,
    });

    await commitFile(
      `posts/${article.file}`,
      article.content,
      targetFile ? `✏️ Editar post manual: ${article.file}` : `📝 Post manual: ${article.file}`
    );

    await triggerVercelDeploy().catch(() => {});

    return NextResponse.json({
      ok: true,
      file: article.file,
      slug: article.slug,
      url: `/blog/${article.slug}`,
    });
  } catch (err) {
    console.error("[admin/manual-post]", err);
    return NextResponse.json({ error: err.message || "Erro ao publicar post manual." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { file } = await request.json();
    const safeFile = String(file || "").trim();
    if (!safeFile || !safeFile.endsWith(".md")) {
      return NextResponse.json({ error: "Arquivo inválido para remoção." }, { status: 400 });
    }

    await deleteFile(`posts/${safeFile}`, `🗑️ Remover post manual: ${safeFile}`);
    await triggerVercelDeploy().catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/manual-post][DELETE]", err);
    return NextResponse.json({ error: err.message || "Erro ao remover post manual." }, { status: 500 });
  }
}
