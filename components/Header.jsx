


"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import config from "../site.config";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Fecha o menu ao pressionar Esc
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Bloqueia scroll do body quando menu aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="header">
      <div className="container header-inner">

        <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">A</span>
          <span className="logo-text">{config.name}</span>
        </Link>

        <nav className={`nav ${menuOpen ? "nav--open" : ""}`} aria-label="Navegação principal">
          {config.navigation.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${i === 1 ? "nav-cta" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
