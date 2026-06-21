export default function AffiliateBox({ affiliate }) {
  if (!affiliate) return null;

  return (
    <aside className="affiliate-box" aria-label={`Indicação: ${affiliate.name}`}>
      <span className="affiliate-box-tag">Recomendado</span>
      <p className="affiliate-box-text">{affiliate.cta}</p>
      <a
        href={affiliate.url}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="affiliate-box-link"
      >
        {affiliate.name} →
      </a>
    </aside>
  );
}
