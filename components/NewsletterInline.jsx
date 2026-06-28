"use client";

import { useState } from "react";

/**
 * NewsletterInline — bloco de alta conversão inserido no meio dos artigos
 * (entre o conteúdo dividido) e também na homepage após os artigos recentes.
 * Diferente do NewsletterBox do footer: copy persuasivo, visual destacado.
 */
export default function NewsletterInline({ variant = "article" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

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
      setMessage("Inscrito com sucesso! O próximo artigo chega direto no seu e-mail. 🎉");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Algo deu errado. Tente novamente.");
    }
  }

  const isArticle = variant === "article";

  if (status === "ok") {
    return (
      <div className="nl-inline nl-inline--ok">
        <span className="nl-inline-ok-icon">🎉</span>
        <div>
          <p className="nl-inline-ok-title">Você está na lista!</p>
          <p className="nl-inline-ok-sub">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`nl-inline ${isArticle ? "nl-inline--article" : "nl-inline--home"}`}>
      <div className="nl-inline-left">
        <span className="nl-inline-badge">📬 Newsletter diária</span>
        <p className="nl-inline-title">
          Não perca o próximo artigo!
        </p>
        <p className="nl-inline-sub">
          Concurseiros que acompanham o blog diariamente chegam melhor preparados.
          Entre para a lista e receba cada artigo novo antes de todo mundo.
        </p>
        <ul className="nl-inline-bullets">
          <li>✅ Um artigo novo todo dia</li>
          <li>✅ 100% gratuito, cancele quando quiser</li>
          <li>✅ Sem spam — só conteúdo que vale a pena</li>
        </ul>
      </div>

      <div className="nl-inline-right">
        <form className="nl-inline-form" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="nl-inline-input"
            aria-label="Seu e-mail"
          />
          <button
            type="submit"
            className="nl-inline-btn"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Enviando…" : "Quero receber →"}
          </button>
        </form>

        {message && status === "error" && (
          <p className="nl-inline-feedback nl-inline-feedback--error">{message}</p>
        )}

        <p className="nl-inline-disclaimer">
          🔒 Seus dados ficam só aqui. Zero spam.
        </p>
      </div>
    </div>
  );
}
