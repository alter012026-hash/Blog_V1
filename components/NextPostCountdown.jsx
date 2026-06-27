"use client";

import { useEffect, useState, useRef } from "react";

// Horários de publicação em UTC (Brasília = UTC-3)
// 08h, 11h, 14h, 17h, 20h BRT → 11h, 14h, 17h, 20h, 23h UTC
const PUBLISH_HOURS_UTC = [11, 14, 17, 20, 23];

function getNextPublishDate() {
  const now = new Date();
  const today = new Date(now);

  for (const hour of PUBLISH_HOURS_UTC) {
    const candidate = new Date(today);
    candidate.setUTCHours(hour, 0, 0, 0);
    if (candidate > now) return candidate;
  }

  // Nenhum horário restante hoje → pegar o primeiro de amanhã
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(PUBLISH_HOURS_UTC[0], 0, 0, 0);
  return tomorrow;
}

// Converte UTC para horário de Brasília para exibição
function toBRT(date) {
  return new Date(date.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function Unit({ value, label, pulse }) {
  return (
    <div className="cd-unit">
      <span className={`cd-num${pulse ? " cd-pulse" : ""}`}>{pad(value)}</span>
      <span className="cd-label">{label}</span>
    </div>
  );
}

export default function NextPostCountdown() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [nextTime, setNextTime] = useState("");
  const prevSec = useRef(-1);

  useEffect(() => {
    function tick() {
      const target = getNextPublishDate();
      const now = new Date();
      const diff = Math.max(0, target - now);

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (prevSec.current !== s) {
        if (prevSec.current !== -1) {
          setPulse(true);
          setTimeout(() => setPulse(false), 300);
        }
        prevSec.current = s;
      }

      setTimeLeft({ h, m, s });

      // Horário legível (BRT)
      const brt = toBRT(target);
      const hBRT = brt.getHours();
      setNextTime(`${pad(hBRT)}h de hoje`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="cd-wrap">
      <p className="cd-eyebrow">📅 próximo artigo</p>
      <div className="cd-clock">
        <Unit value={timeLeft.h} label="horas" pulse={false} />
        <span className="cd-colon">:</span>
        <Unit value={timeLeft.m} label="min" pulse={false} />
        <span className="cd-colon">:</span>
        <Unit value={timeLeft.s} label="seg" pulse={pulse} />
      </div>
      <p className="cd-hint">Publicamos 5× ao dia · próximo às {nextTime}</p>
    </div>
  );
}
