"use client";

import Link from "next/link";
import { useState } from "react";
import config from "../site.config";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">◆</span>
          <span className="logo-text">{config.name}</span>
        </Link>

        <nav className={`nav ${menuOpen ? "nav--open" : ""}`}>
          {config.navigation.map(item => (
            <Link key={item.href} href={item.href} className="nav-link" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
