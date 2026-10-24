"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Registra cada visualização de página (inclusive navegação interna do Next,
 * que não recarrega o documento). Sem cookies, sem localStorage.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef(null);
  const firstHit = useRef(true);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return;
    lastPath.current = pathname;

    // O referrer externo só vale para a primeira página do carregamento;
    // depois disso a origem é o próprio site.
    const referrer = firstHit.current ? document.referrer : "";
    firstHit.current = false;

    const payload = JSON.stringify({ path: pathname, referrer });
    try {
      if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
        if (ok) return;
      }
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* rastreio nunca deve quebrar a página */
    }
  }, [pathname]);

  return null;
}
