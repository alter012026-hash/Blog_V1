"use client";

import { useState } from "react";

export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
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

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível concluir sua inscrição.");
      }

      setStatus("ok");
      setMessage("Inscrito! Você vai receber um aviso quando sair post novo. 🎉");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Algo deu errado. Tente novamente.");
    }
  }

  return (
    <div className="newsletter-box">
      <p className="newsletter-title">📬 Receba os novos posts por e-mail</p>
      <p className="newsletter-subtitle">
        Um aviso só quando sair conteúdo novo. Sem spam, cancele quando quiser.
      </p>

      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="newsletter-input"
          aria-label="Seu e-mail"
        />
        <button
          type="submit"
          className="newsletter-submit"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Enviando…" : "Inscrever"}
        </button>
      </form>

      {message && (
        <p className={`newsletter-feedback ${status === "error" ? "is-error" : "is-ok"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
