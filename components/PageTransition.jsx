"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Envolve {children} do layout raiz e anima a entrada do conteúdo a cada
 * troca de rota (estilo "site da Apple": fade + leve slide-up, curto e
 * suave, sem travar a interação).
 *
 * Estratégia: como o App Router não desmonta o RootLayout ao navegar,
 * detectamos a mudança via usePathname() e trocamos a `key` do wrapper —
 * isso remonta só a div de conteúdo, disparando a animação CSS via
 * @keyframes (não precisa de framer-motion nem de libs extras).
 *
 * A primeira renderização (carregamento inicial da página, já vinda do
 * servidor) NUNCA anima — evita flash/CLS e mantém o LCP intacto. Só as
 * navegações internas subsequentes recebem a transição.
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const [displayKey, setDisplayKey] = useState(pathname);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayKey(pathname);
      return;
    }
    setAnimate(true);
    setDisplayKey(pathname);
  }, [pathname]);

  return (
    <div key={displayKey} className={animate ? "page-transition" : undefined}>
      {children}
    </div>
  );
}
