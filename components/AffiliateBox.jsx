export default function AffiliateBox({ affiliate, slug }) {
  if (!affiliate) return null;

  return (
    <aside className="affiliate-box" aria-label={`Indicação: ${affiliate.name}`}>
      <span className="affiliate-box-tag">Indicação com link afiliado</span>
      <p className="affiliate-box-text">{affiliate.cta}</p>
      <p className="affiliate-box-disclosure">
        Podemos receber comissão se você contratar por este link, sem custo adicional para você.
      </p>
      <a
        href={affiliate.url}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="affiliate-box-link"
        data-analytics-event="affiliate_click"
        data-partner-id={affiliate.id || "unknown"}
        data-page-slug={slug || "unknown"}
      >
        {affiliate.name} →
      </a>
    </aside>
  );
}
