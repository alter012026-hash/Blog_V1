
import Link from "next/link";
import config from "../site.config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">

          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <span className="logo-icon">A</span>
              <span className="logo-text">{config.name}</span>
            </Link>
            <p className="footer-tagline">{config.tagline}</p>
          </div>

          <nav className="footer-nav" aria-label="Links do rodapé">
            {config.navigation.map(item => (
              <Link key={item.href} href={item.href} className="footer-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {year} {config.name}. Todos os direitos reservados.
            <small>Links de afiliado podem gerar comissão sem custo para você.</small>
          </p>
        </div>
      </div>
    </footer>
  );
}
