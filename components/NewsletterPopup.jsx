"use client";

import { useState, useEffect } from "react";

/**
 * NewsletterPopup — aparece após 30s OU quando o usuário leu 40% da página.
 * Fecha com ESC ou clicando fora. Não volta a aparecer na sessão (sessionStorage).
 * Pulsa suavemente para chamar atenção sem ser invasivo.
 */
export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Não mostra se já foi fechado nesta sessão
    if (sessionStorage.getItem("nl_popup_dismissed")) return;

    let triggered = false;

    function trigger() {
      if (triggered) return;
      triggered = true;
      setVisible(true);
    }

    // Gatilho 1: 30 segundos na página
    const timer = setTimeout(trigger, 30000);

    // Gatilho 2: leu 40% da página
    function onScroll() {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop || document.body.scrollTop;
      const total = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      if (total > 0 && scrolled / total >= 0.4) trigger();
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    // Fechar com ESC
    function onKey(e) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem("nl_popup_dismissed", "1");
    setDismissed(true);
    setTimeout(() => setVisible(false), 300);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Tente novamente.");
      setStatus("ok");
      setMessage("Perfeito! Você vai receber o próximo artigo em primeira mão. 🎉");
      setEmail("");
      setTimeout(dismiss, 3500);
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Algo deu errado. Tente novamente.");
    }
  }

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 9998, backdropFilter: "blur(2px)",
          animation: dismissed ? "nlFadeOut .3s forwards" : "nlFadeIn .3s forwards",
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: "fixed", bottom: 32, right: 32,
          width: "min(420px, calc(100vw - 32px))",
          background: "linear-gradient(145deg, #0D1E3A 0%, #0A1628 100%)",
          border: "1px solid rgba(59,130,246,0.35)",
          borderRadius: 16, padding: "28px 28px 24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1), 0 0 40px rgba(59,130,246,0.08)",
          zIndex: 9999,
          animation: dismissed ? "nlSlideOut .3s forwards" : "nlSlideIn .4s cubic-bezier(.22,1,.36,1) forwards",
        }}
      >
        {/* Botão fechar */}
        <button
          onClick={dismiss}
          aria-label="Fechar"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer",
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, lineHeight: 1, transition: "background .15s",
          }}
        >✕</button>

        {/* Ícone pulsante */}
        <div style={{ marginBottom: 14 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
            fontSize: 22, animation: "nlPulse 2s ease-in-out infinite",
          }}>📬</span>
        </div>

        {status !== "ok" ? (
          <>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, color: "#F1F5F9", marginBottom: 6, lineHeight: 1.3 }}>
              Ei! Quer receber os próximos artigos em primeira mão?
            </p>
            <p style={{ fontSize: "0.82rem", color: "#94A3B8", lineHeight: 1.55, marginBottom: 18 }}>
              Todo dia um novo artigo sobre concursos públicos direto no seu e-mail.
              Rápido, gratuito e sem spam — cancele quando quiser.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={status === "loading"}
                style={{
                  padding: "11px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: "0.88rem",
                  outline: "none", width: "100%",
                }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  padding: "12px", borderRadius: 9, border: "none",
                  background: status === "loading"
                    ? "rgba(59,130,246,0.5)"
                    : "linear-gradient(90deg,#3B82F6,#2563EB)",
                  color: "#fff", fontSize: "0.9rem", fontWeight: 700,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  transition: "opacity .15s",
                  boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
                }}
              >
                {status === "loading" ? "Enviando…" : "Quero receber! →"}
              </button>
            </form>

            {message && status === "error" && (
              <p style={{ fontSize: "0.78rem", color: "#FCA5A5", marginTop: 8 }}>{message}</p>
            )}

            <p style={{ fontSize: "0.72rem", color: "#4B607A", marginTop: 12, textAlign: "center" }}>
              🔒 Seus dados ficam só aqui. Nada de spam, prometido.
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <p style={{ color: "#6EE7B7", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>Você está dentro!</p>
            <p style={{ color: "#94A3B8", fontSize: "0.83rem" }}>{message}</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes nlFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes nlFadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes nlSlideIn { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes nlSlideOut{ from { opacity:1; transform:translateY(0) } to { opacity:0; transform:translateY(20px) } }
        @keyframes nlPulse   { 0%,100% { box-shadow:0 0 0 0 rgba(59,130,246,0.4) } 50% { box-shadow:0 0 0 10px rgba(59,130,246,0) } }
      `}</style>
    </>
  );
}
