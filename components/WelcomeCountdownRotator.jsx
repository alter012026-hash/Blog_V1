"use client";

import { useEffect, useState } from "react";
import NextPostCountdown from "./NextPostCountdown";
import config from "../site.config";

const ROTATE_MS = 7000; // tempo que cada slide fica visível antes de trocar

const WELCOME_EMOJIS = ["🚀", "🎯", "📚", "🔥", "✨"];

export default function WelcomeCountdownRotator({ postCount = 0, categoryCount = 0 }) {
  const [active, setActive] = useState(0); // 0 = boas-vindas, 1 = cronômetro
  const [emojiIndex, setEmojiIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev === 0 ? 1 : 0));
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  // troca o emoji de destaque cada vez que a mensagem de boas-vindas reaparece,
  // pra dar uma sensação de "viva" mesmo em quem fica navegando um tempo na home
  useEffect(() => {
    if (active === 0) {
      setEmojiIndex((i) => (i + 1) % WELCOME_EMOJIS.length);
    }
  }, [active]);

  function goTo(index) {
    setActive(index);
  }

  return (
    <div className="wcr-wrap">
      <div className="wcr-stage">
        <div className={`wcr-slide ${active === 0 ? "wcr-slide--active" : "wcr-slide--hidden"}`}>
          <WelcomeMessage emoji={WELCOME_EMOJIS[emojiIndex]} postCount={postCount} categoryCount={categoryCount} />
        </div>
        <div className={`wcr-slide ${active === 1 ? "wcr-slide--active" : "wcr-slide--hidden"}`}>
          <NextPostCountdown />
        </div>
      </div>

      <div className="wcr-dots" role="tablist" aria-label="Alternar conteúdo de destaque">
        <button
          type="button"
          role="tab"
          aria-selected={active === 0}
          aria-label="Mostrar mensagem de boas-vindas"
          className={`wcr-dot${active === 0 ? " wcr-dot--active" : ""}`}
          onClick={() => goTo(0)}
        />
        <button
          type="button"
          role="tab"
          aria-selected={active === 1}
          aria-label="Mostrar cronômetro do próximo artigo"
          className={`wcr-dot${active === 1 ? " wcr-dot--active" : ""}`}
          onClick={() => goTo(1)}
        />
      </div>
    </div>
  );
}

function WelcomeMessage({ emoji, postCount, categoryCount }) {
  return (
    <div className="wm-wrap">
      <p className="wm-emoji">{emoji}</p>
      <h2 className="wm-title">
        Bem-vindo ao <span>{config.name}</span>!
      </h2>
      <p className="wm-text">
        Seu próximo passo até a aprovação começa aqui.
        {postCount > 0 && (
          <>
            {" "}Já são <strong>{postCount} artigos</strong>
            {categoryCount > 0 && <> em <strong>{categoryCount} categorias</strong></>}
            {" "}prontos pra te ajudar a estudar melhor e mais rápido.
          </>
        )}
      </p>
    </div>
  );
}
