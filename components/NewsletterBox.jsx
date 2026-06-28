"use client";

import { useState } from "react";

/**
 * NewsletterBox — versão compacta usada no Footer.
 * Copy atualizado para ser mais persuasivo.
 */
export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Não foi possível concluir sua inscrição.");
      setStatus("ok");
      setMessage("Inscrito! O próximo artigo chega no seu e-mail. 🎉");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Algo deu errado. Tente novamente.");
    }
  }

  return (
    <div className="newsletter-box">
      <p className="newsletter-title">📬 Artigo novo todo dia no seu e-mail</p>
      <p className="newsletter-subtitle">
        Gratuito · Sem spam · Cancele quando quiser
      </p>

      {status !== "ok" ? (
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="newsletter-input"
            aria-label="Seu e-mail"
          />
          <button
            type="submit"
            className="newsletter-submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "…" : "Inscrever"}
          </button>
        </form>
      ) : null}

      {message && (
        <p className={`newsletter-feedback ${status === "error" ? "is-error" : "is-ok"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
