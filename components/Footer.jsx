import Link from "next/link";
import config from "../site.config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">◆</span>
          <span className="logo-text">{config.name}</span>
          <p className="footer-tagline">{config.tagline}</p>
        </div>

        <nav className="footer-nav">
          {config.navigation.map(item => (
            <Link key={item.href} href={item.href} className="footer-link">
              {item.label}
            </Link>
          ))}
          <Link href="/sitemap.xml" className="footer-link">Sitemap</Link>
        </nav>

        <p className="footer-copy">
          © {year} {config.name}. Todos os direitos reservados.
          <br />
          <small>
            Os links de afiliado neste site podem gerar comissão sem custo adicional para você.
          </small>
        </p>
      </div>
    </footer>
  );
}
