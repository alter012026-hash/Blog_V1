import Link from "next/link";
import { getCategoryMeta } from "../lib/category-meta";

/** Blocos de cor por tema. Celular: carrossel com snap; desktop: grade. */
export default function CategoryCards({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="category-cards-wrap">
      <div className="category-cards-grid">
        {categories.map((cat) => {
          const meta = getCategoryMeta(cat.name);
          return (
            <Link
              key={cat.name}
              href={`/blog?categoria=${encodeURIComponent(cat.name)}`}
              className="category-card cat"
              style={{ "--h": meta.hue }}
            >
              <div className="category-card-top">
                <span className="category-card-code" aria-hidden="true">{meta.code}</span>
                <span className="category-card-count">
                  {cat.count} {cat.count === 1 ? "artigo" : "artigos"}
                </span>
              </div>
              <h3 className="category-card-title">{cat.name}</h3>
              <p className="category-card-desc">{meta.description}</p>
              <span className="category-card-cta">
                Ver artigos <span className="category-card-arrow" aria-hidden="true">→</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
