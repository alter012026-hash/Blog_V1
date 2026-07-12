"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Duas "réguas" fixas nos vãos laterais (só aparecem quando a tela é larga
 * o bastante pra sobrar espaço de verdade — ver breakpoint em globals.css)
 * com curiosidades dos artigos rolando em loop contínuo, tipo ticker.
 * Pausa no hover, direções opostas em cada lado pra não parecer espelhado.
 *
 * Fica de fora em páginas de "modo foco" (admin, simulado) onde esse tipo
 * de estímulo lateral atrapalharia mais do que ajudaria.
 */
export default function SideTicker({ items }) {
  const pathname = usePathname();

  if (!items || items.length < 4) return null;
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/simulado")) return null;

  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  return (
    <>
      <Rail side="left" items={left} />
      <Rail side="right" items={right} />
    </>
  );
}

function Rail({ side, items }) {
  // Duplica a lista pra permitir o loop sem "salto" visível (técnica
  // clássica de marquee: anima só até -50%, que corresponde ao fim da
  // primeira cópia — a segunda cópia já está posicionada logo em seguida).
  const doubled = [...items, ...items];

  return (
    <aside className={`side-ticker side-ticker--${side}`} aria-hidden="true">
      <div className={`side-ticker-track side-ticker-track--${side}`}>
        {doubled.map((item, i) => (
          <Link
            key={`${item.slug}-${i}`}
            href={`/blog/${item.slug}`}
            className="side-ticker-card"
            tabIndex={-1}
          >
            <span className="side-ticker-tag">💡 Curiosidade</span>
            <p className="side-ticker-text">{item.text}</p>
          </Link>
        ))}
      </div>
    </aside>
  );
}
