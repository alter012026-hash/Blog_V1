import Link from "next/link";

export default function PostCard({ post }) {
  const formattedDate = new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="post-card">
      <div className="post-card-meta">
        <span className="post-card-category">{post.category}</span>
        <span className="post-card-reading">{post.readingTime} de leitura</span>
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
