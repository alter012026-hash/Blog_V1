import Link from "next/link";

// Cores em hsla com baixa opacidade no fundo: funcionam tanto sobre o
// branco do tema claro quanto sobre o quase-preto do tema escuro, sem
// precisar de um segundo mapa de cores por tema.
const categoryStyles = {
  "Editais":               { bg: "hsla(215, 60%, 50%, 0.12)", color: "hsl(215, 60%, 55%)", border: "hsla(215, 60%, 50%, 0.25)" },
  "Técnicas de Estudo":    { bg: "hsla(142, 60%, 40%, 0.12)", color: "hsl(142, 55%, 45%)", border: "hsla(142, 60%, 40%, 0.25)" },
  "Concursos Abertos":     { bg: "hsla(38, 90%, 50%, 0.14)",  color: "hsl(32, 85%, 50%)",  border: "hsla(38, 90%, 50%, 0.28)" },
  "Materiais Gratuitos":   { bg: "hsla(262, 55%, 50%, 0.12)", color: "hsl(262, 55%, 60%)", border: "hsla(262, 55%, 50%, 0.25)" },
  "Cronograma de Estudos": { bg: "hsla(346, 75%, 50%, 0.12)", color: "hsl(346, 65%, 55%)", border: "hsla(346, 75%, 50%, 0.25)" },
  "Carreiras Públicas":    { bg: "hsla(190, 75%, 40%, 0.13)", color: "hsl(190, 65%, 48%)", border: "hsla(190, 75%, 40%, 0.26)" },
  "Questões Comentadas":   { bg: "hsla(24, 80%, 48%, 0.13)",  color: "hsl(24, 75%, 50%)",  border: "hsla(24, 80%, 48%, 0.26)" },
  "Geral":                 { bg: "hsla(220, 14%, 50%, 0.12)", color: "hsl(220, 14%, 50%)", border: "hsla(220, 14%, 50%, 0.25)" },
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
