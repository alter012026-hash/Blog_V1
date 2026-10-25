"use client";

import { useEffect } from "react";

/**
 * Remove "faixas brancas" de anúncio na home.
 *
 * Os Anúncios Automáticos do Google inserem contêineres `.google-auto-placed`
 * no meio da página. Quando não há anúncio para exibir, o contêiner pode ficar
 * como uma tira branca de poucos pixels (era o traço branco entre o destaque da
 * semana e "Explore concursos por estado"). Este guarda recolhe SOMENTE
 * contêineres vazios/finos; anúncios com conteúdo real nunca são tocados.
 *
 * A correção definitiva é desligar os "Anúncios in-page" no painel do AdSense
 * (o site já usa locais fixos) — veja LEIA-ME_ANUNCIOS.md.
 */
const MIN_REAL_AD_HEIGHT = 48; // px: abaixo disso não é um anúncio de verdade

export default function AdSliverGuard() {
  useEffect(() => {
    const mountedAt = Date.now();

    const sweep = () => {
      // Só considera "fino demais" depois de dar tempo ao anúncio de carregar.
      const settled = Date.now() - mountedAt > 3000;
      document.querySelectorAll(".google-auto-placed").forEach((el) => {
        if (el.style.display === "none") return;
        const ins = el.querySelector("ins.adsbygoogle");
        const status = ins ? ins.getAttribute("data-ad-status") : null;
        const unfilled = status === "unfilled";
        const thin = el.getBoundingClientRect().height < MIN_REAL_AD_HEIGHT;
        if (unfilled || (settled && thin && status !== "filled")) {
          el.style.display = "none";
        }
      });
    };

    sweep();
    const observer = new MutationObserver(sweep);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });
    // Os anúncios podem terminar de carregar bem depois do primeiro paint.
    const timers = [3200, 6000, 10000].map((ms) => setTimeout(sweep, ms));

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
