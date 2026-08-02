import Link from "next/link";
import { getCategoryMeta } from "../lib/category-meta";

function formatDate(dateStr) {
  if (!dateStr) return null;

  // Se vier como ISO completo (2026-06-13T...), extrai só a data
  // Se vier como YYYY-MM-DD, usa direto
  const match = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  // Constrói sem fuso: usar UTC explicitamente evita o "Invalid Date" por timezone
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (isNaN(d.getTime())) return null;

  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function PostCard({ post, featured }) {
  const formattedDate = formatDate(post.date);
  const catStyle = getCategoryMeta(post.category || "Geral");

  return (
    <article className={`post-card ${featured ? "post-card--featured" : ""}`}>
      <div className="post-card-meta">
        <span
          className="post-card-category"
          style={{
            background: catStyle.bg,
            color: catStyle.color,
            borderColor: catStyle.border,
          }}
        >
          {post.category || "Geral"}
        </span>
        <span className="post-card-reading">{post.readingTime}</span>
      </div>

      <h2 className="post-card-title">
        <Link href={`/blog/${post.slug}`}>{post.title || "Sem título"}</Link>
      </h2>

      {post.excerpt && (
        <p className="post-card-excerpt">{post.excerpt}</p>
      )}

      <div className="post-card-footer">
        {formattedDate ? (
          <time className="post-card-date" dateTime={post.date}>
            {formattedDate}
          </time>
        ) : (
          <span className="post-card-date" style={{ opacity: 0.4 }}>—</span>
        )}
        <Link href={`/blog/${post.slug}`} className="post-card-link">
          Ler artigo →
        </Link>
      </div>
    </article>
  );
}
