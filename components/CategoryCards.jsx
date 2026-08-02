import Link from "next/link";
import { getCategoryMeta } from "../lib/category-meta";

/**
 * Grade de categorias da home — substitui a lista de pílulas simples
 * (ainda usada em /blog para filtro) por cards no espírito "diário
 * oficial" do design system: código de matéria em mono (como um índice
 * de classificação de gazeta), título em serifa, contagem real de posts,
 * e uma régua de destaque que se estende no hover em vez de sombra/
 * gradiente genérico. Entrada animada via .reveal-stagger (mesmo
 * mecanismo de components/ScrollReveal.jsx usado no resto do site).
 */
export default function CategoryCards({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="category-cards-wrap">
      <p className="category-scroll-hint">Arraste para o lado →</p>
      <div className="category-cards-grid reveal-stagger">
        {categories.map((cat) => {
          const meta = getCategoryMeta(cat.name);
          return (
            <Link
              key={cat.name}
              href={`/blog?categoria=${encodeURIComponent(cat.name)}`}
              className="category-card"
              style={{ "--cat-color": meta.color, "--cat-border": meta.border, "--cat-bg": meta.bg }}
            >
              <div className="category-card-top">
                <span className="category-card-code">{meta.code}</span>
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
