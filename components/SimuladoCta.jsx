import Link from "next/link";

/**
 * Chamada para o simulado dentro do artigo. Só é renderizada quando
 * lib/simulado-links.js encontra um simulado coerente com o assunto.
 */
export default function SimuladoCta({ cta }) {
  if (!cta) return null;
  return (
    <aside className="sim-cta" aria-label="Pratique com o simulado">
      <div className="sim-cta-bubbles" aria-hidden="true">
        <i>A</i><i>B</i><i className="is-marked">C</i><i>D</i><i>E</i>
      </div>
      <div className="sim-cta-body">
        <p className="sim-cta-eyebrow">Simulado gratuito</p>
        <h2 className="sim-cta-title">{cta.titulo}</h2>
        <p className="sim-cta-text">{cta.texto}</p>
        <Link href={cta.href} className="btn btn--hl sim-cta-btn">
          {cta.botao} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  );
}
