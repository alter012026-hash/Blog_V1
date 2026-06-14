
import Link from "next/link";

const categoryStyles = {
  "Editais":               { bg: "#EFF6FF", color: "#1B3A6B", border: "rgba(27,58,107,0.15)" },
  "Técnicas de Estudo":    { bg: "#F0FDF4", color: "#166534", border: "rgba(22,101,52,0.15)" },
  "Concursos Abertos":     { bg: "#FFFBEB", color: "#92400E", border: "rgba(245,158,11,0.25)" },
  "Materiais Gratuitos":   { bg: "#F5F3FF", color: "#5B21B6", border: "rgba(91,33,182,0.15)" },
  "Cronograma de Estudos": { bg: "#FFF1F2", color: "#9F1239", border: "rgba(244,63,94,0.2)"  },
  "Carreiras Públicas":    { bg: "#ECFEFF", color: "#155E75", border: "rgba(6,182,212,0.2)"  },
  "Questões Comentadas":   { bg: "#FFF7ED", color: "#9A3412", border: "rgba(234,88,12,0.2)"  },
};

export default function PostCard({ post, featured }) {
  const formattedDate = new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const catStyle = categoryStyles[post.category] || {
    bg: "#EFF6FF", color: "#1B3A6B", border: "rgba(27,58,107,0.15)"
  };

  return (
    <article className={`post-card ${featured ? "post-card--featured" : ""}`}>
      <div className="post-card-meta">
        <span
          className="post-card-category"
          style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
        >
          {post.category}
        </span>
        <span className="post-card-reading">{post.readingTime}</span>
      </div>

      <h2 className="post-card-title">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>

      <p className="post-card-excerpt">{post.excerpt}</p>

      <div className="post-card-footer">
        <time className="post-card-date" dateTime={post.date}>{formattedDate}</time>
        <Link href={`/blog/${post.slug}`} className="post-card-link">
          Ler artigo →
        </Link>
      </div>
    </article>
  );
}
