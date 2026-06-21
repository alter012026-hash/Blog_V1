"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import config from "../site.config";
import ThemeToggle from "./ThemeToggle";
import SearchPalette from "./SearchPalette";

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export default function Header({ posts = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Fecha o menu ao pressionar Esc; abre a busca com Ctrl/Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Bloqueia scroll do body quando menu mobile aberto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Header encolhe/ganha sombra ao rolar — navegação com mais "presença" no topo
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <header className={`header ${scrolled ? "header--scrolled" : ""}`}>
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

        <div className="header-actions">
          <button
            type="button"
            className="search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar artigos"
          >
            <SearchIcon />
            <span>Buscar</span>
            <kbd>Ctrl K</kbd>
          </button>

          <ThemeToggle />

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
      </div>

      <SearchPalette posts={posts} open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
