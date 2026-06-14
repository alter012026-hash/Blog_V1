import Link from "next/link";

const categoryStyles = {
  "Editais":               { bg: "#EFF6FF", color: "#1B3A6B", border: "rgba(27,58,107,0.15)" },
  "Técnicas de Estudo":    { bg: "#F0FDF4", color: "#166534", border: "rgba(22,101,52,0.15)" },
  "Concursos Abertos":     { bg: "#FFFBEB", color: "#92400E", border: "rgba(245,158,11,0.25)" },
  "Materiais Gratuitos":   { bg: "#F5F3FF", color: "#5B21B6", border: "rgba(91,33,182,0.15)" },
  "Cronograma de Estudos": { bg: "#FFF1F2", color: "#9F1239", border: "rgba(244,63,94,0.2)"  },
  "Carreiras Públicas":    { bg: "#ECFEFF", color: "#155E75", border: "rgba(6,182,212,0.2)"  },
  "Questões Comentadas":   { bg: "#FFF7ED", color: "#9A3412", border: "rgba(234,88,12,0.2)"  },
  "Geral":                 { bg: "#F8FAFC", color: "#475569", border: "rgba(71,85,105,0.15)" },
};

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
  const catStyle = categoryStyles[post.category] || categoryStyles["Geral"];

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
