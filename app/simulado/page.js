"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./simulado.css";

import {
  BANCAS, BANCA_INFO, ESCOPO_TODAS,
  getMaterias, countQuestions, getQuestions, getQuestionById, getDailyChallenge, allQuestions, shuffle,
} from "../../lib/quiz-bank";
import { PORTAIS, ACERVOS } from "../../lib/quiz-sources";
import { loadState, saveState, applyRun, levelInfo, hojeKey, pontosFracos, CONQUISTAS, emptyState } from "../../lib/simulado-store";
import { trackSiteEvent } from "../../lib/analytics-events";

// ─── constantes e utilitários ────────────────────────────────────────────────
const SEC_CE = 60;   // segundos por item Certo/Errado (modo prova)
const SEC_MC = 100;  // segundos por questão de múltipla escolha (modo prova)
const AI_EXTRA = 5;  // questões inéditas de IA adicionadas quando o aluno pede

const fmt = (s) => {
  const v = Math.max(0, Math.round(s));
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

const ontemKey = () => hojeKey(new Date(Date.now() - 864e5));
const escopoLabel = (e) => (e === ESCOPO_TODAS ? "Simulado completo" : e);
const secPorQuestao = (q) => (q.formato === "ce" ? SEC_CE : SEC_MC);

/** XP: 100 por acerto (+ bônus de velocidade no treino) e combos a partir de 3 acertos seguidos. */
function computeXp(list, mode) {
  let combo = 0, max = 0, xp = 0;
  const per = [];
  for (const a of list) {
    let g = 0;
    if (a && a.answered && a.correct) {
      combo += 1;
      max = Math.max(max, combo);
      g = 100 + (mode === "treino" ? Math.max(0, 30 - (a.elapsed || 0)) * 2 : 0);
      g += combo >= 5 ? 150 : combo >= 3 ? 75 : 0;
    } else {
      combo = 0;
    }
    xp += g;
    per.push(g);
  }
  return { xp, maxStreak: max, per };
}

function normalizeAI(q, i, banca, materia) {
  const formato = q.formato || (q.alternativas?.length === 2 ? "ce" : "mc");
  return { ...q, id: q.id || `ai-${Date.now()}-${i}`, banca, materia, formato, assunto: q.assunto || "Questão inédita", nivel: q.nivel || 2, fonte: "", ai: true };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function SimuladoPage() {
  // ── navegação ──
  const [screen, setScreen] = useState("home"); // home | loading | quiz | result
  const [today, setToday] = useState("");

  // ── perfil (localStorage) ──
  const [profile, setProfile] = useState(emptyState());
  useEffect(() => { setProfile(loadState()); setToday(hojeKey()); }, []);

  // ── montador ──
  const [banca, setBanca] = useState("CEBRASPE");
  const [escopo, setEscopo] = useState(ESCOPO_TODAS);
  const [modo, setModo] = useState("treino");
  const [useAI, setUseAI] = useState(false);
  const [quizError, setQuizError] = useState("");
  // Links vindos dos artigos: /simulado?banca=CEBRASPE&materia=Português#montar
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const b = (sp.get("banca") || "").toUpperCase();
      const m = sp.get("materia");
      if (!BANCAS.includes(b)) return;
      setBanca(b);
      if (m && getMaterias(b).includes(m)) setEscopo(m);
      setTimeout(() => document.getElementById("montar")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch { /* URL inválida: segue com o padrão */ }
  }, []);
  useEffect(() => { if (escopo === ESCOPO_TODAS) setUseAI(false); }, [escopo]);

  // ── rodada ──
  const [run, setRun] = useState(null);
  const runRef = useRef(null);
  runRef.current = run;
  // grava no ref na hora: atalhos de teclado em sequência rápida não podem ler estado velho
  const commit = useCallback((next) => { runRef.current = next; setRun(next); }, []);
  const [timeLeft, setTimeLeft] = useState(0);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState(null); // "finish" | "abandon" | null
  const spentRef = useRef([]);
  const qStartRef = useRef(Date.now());
  const finishedRef = useRef(false);

  // ── resultado ──
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("revisar");
  const [tutor, setTutor] = useState({ loading: false, text: null });
  const [mail, setMail] = useState({ nome: "", email: "", loading: false, sent: false, error: "" });
  const [ringOn, setRingOn] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);

  // ───────────────────────── iniciar rodadas ─────────────────────────
  const startRun = useCallback((questions, cfg) => {
    spentRef.current = [];
    qStartRef.current = Date.now();
    finishedRef.current = false;
    const mode = cfg.mode;
    const total = mode === "prova" ? questions.reduce((s, q) => s + secPorQuestao(q), 0) : 0;
    setRun({ id: Date.now(), questions, answers: [], current: 0, mode, banca: cfg.banca, escopo: cfg.escopo, kind: cfg.kind, repeat: !!cfg.repeat, total, useAI: !!cfg.useAI });
    setTimeLeft(total);
    setResult(null); setTutor({ loading: false, text: null }); setTab("revisar"); setRingOn(false);
    setMail((m) => ({ ...m, sent: false, error: "" }));
    setConfirm(null);
    setScreen("quiz");
    trackSiteEvent("quiz_start", { banca: cfg.banca, materia: escopoLabel(cfg.escopo), question_count: questions.length, mode, kind: cfg.kind });
  }, []);

  async function startCustom() {
    setQuizError("");
    let qs = getQuestions(banca, escopo, 99);
    if (useAI && escopo !== ESCOPO_TODAS) {
      setScreen("loading");
      try {
        const res = await fetch("/api/simulado/questions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ banca, materia: escopo, quantidade: AI_EXTRA }),
        });
        const data = await res.json();
        if (res.ok && data.source === "ai" && Array.isArray(data.questions)) {
          qs = [...qs, ...data.questions.map((q, i) => normalizeAI(q, i, banca, escopo))];
        } else {
          setQuizError("A IA não respondeu agora, então usamos só as questões revisadas do banco.");
        }
      } catch {
        setQuizError("A IA não respondeu agora, então usamos só as questões revisadas do banco.");
      }
    }
    if (qs.length < 3) { setScreen("home"); setQuizError("Não há questões suficientes nessa combinação."); return; }
    startRun(qs, { banca, escopo, mode: modo, kind: "custom", useAI });
  }

  function startDaily() {
    const qs = getDailyChallenge(today || hojeKey());
    startRun(qs, { banca: "Desafio do dia", escopo: "Misto", mode: "treino", kind: "daily", repeat: !!profile.daily[today] });
  }

  function startReview() {
    const qs = profile.wrong.slice(-15).reverse().map((id) => getQuestionById(id)).filter(Boolean);
    if (!qs.length) return;
    startRun(qs, { banca: "Revisão", escopo: "Meus erros", mode: "treino", kind: "review" });
  }

  function startMixed() {
    const qs = shuffle(allQuestions()).slice(0, 10).map((q) => getQuestionById(q.id));
    startRun(qs, { banca: "Misto", escopo: "Todas as bancas", mode: "treino", kind: "mixed" });
  }

  function replay() {
    const r = result;
    if (!r) return;
    if (r.kind === "daily") return startDaily();
    if (r.kind === "review") return startReview();
    if (r.kind === "mixed") return startMixed();
    setBanca(r.banca); setEscopo(r.escopo); setModo(r.mode);
    const qs = getQuestions(r.banca, r.escopo, 99);
    startRun(qs, { banca: r.banca, escopo: r.escopo, mode: r.mode, kind: "custom" });
  }

  // ───────────────────────── responder ─────────────────────────
  function bank(i) {
    const now = Date.now();
    spentRef.current[i] = (spentRef.current[i] || 0) + (now - qStartRef.current) / 1000;
    qStartRef.current = now;
  }

  function showToast(text) { setToast(text); setTimeout(() => setToast(""), 2200); }

  const handleSelect = useCallback((idx) => {
    const r = runRef.current;
    if (!r || confirm) return;
    const i = r.current;
    const q = r.questions[i];
    const cur = r.answers[i];
    const answers = [...r.answers];

    if (r.mode === "treino") {
      if (cur?.answered) return;
      bank(i);
      const correct = idx === q.gabarito;
      answers[i] = { sel: idx, correct, answered: true, elapsed: Math.round(spentRef.current[i] || 0), flagged: cur?.flagged };
      const { per } = computeXp(answers, "treino");
      let trail = 0;
      for (let k = i; k >= 0 && answers[k]?.correct; k--) trail++;
      if (correct && trail >= 3) showToast(trail >= 5 ? `🔥 COMBO x${trail}! +150 XP` : `⚡ COMBO x${trail}! +75 XP`);
      commit({ ...r, answers });
    } else {
      const same = cur?.sel === idx;
      answers[i] = { sel: same ? null : idx, correct: idx === q.gabarito, answered: !same, elapsed: 0, flagged: cur?.flagged };
      commit({ ...r, answers });
    }
  }, [confirm]);

  const toggleFlag = useCallback(() => {
    const r = runRef.current; if (!r) return;
    const answers = [...r.answers];
    const cur = answers[r.current] || { sel: null, answered: false, correct: false, elapsed: 0 };
    answers[r.current] = { ...cur, flagged: !cur.flagged };
    commit({ ...r, answers });
  }, []);

  const goTo = useCallback((i) => {
    const r = runRef.current; if (!r || i < 0 || i >= r.questions.length) return;
    bank(r.current);
    commit({ ...r, current: i });
  }, []);

  const next = useCallback(() => {
    const r = runRef.current; if (!r) return;
    if (r.mode === "treino" && !r.answers[r.current]?.answered) return;
    if (r.current + 1 >= r.questions.length) {
      if (r.mode === "prova") setConfirm("finish"); else finishRef.current();
    } else goTo(r.current + 1);
  }, [goTo]);

  // ───────────────────────── finalizar ─────────────────────────
  function finish() {
    const r = runRef.current;
    if (!r || finishedRef.current) return;
    finishedRef.current = true;
    bank(r.current);
    setConfirm(null);

    const n = r.questions.length;
    const list = r.questions.map((q, i) => {
      const a = r.answers[i] || { sel: null, answered: false, correct: false };
      return { ...a, elapsed: a.elapsed || Math.round(spentRef.current[i] || 0), q };
    });
    const { xp: xpBruto, maxStreak } = computeXp(list, r.mode);
    const score = list.filter((a) => a.answered && a.correct).length;
    const wrong = list.filter((a) => a.answered && !a.correct).length;
    const blank = n - score - wrong;
    const pct = Math.round((score / n) * 100);
    const xp = r.repeat ? 0 : xpBruto;
    const answeredTimes = list.filter((a) => a.answered).map((a) => a.elapsed);
    const avgTime = answeredTimes.length ? Math.round(answeredTimes.reduce((s, v) => s + v, 0) / answeredTimes.length) : 0;
    const usaNotaLiquida = list.some((a) => a.q.formato === "ce") && r.banca === "CEBRASPE";

    const out = applyRun(loadState(), {
      answers: list.filter((a) => !String(a.q.id).startsWith("ai-")).map((a) => ({ id: a.q.id, materia: a.q.materia, correct: a.correct, answered: a.answered })),
      xp, banca: r.banca, escopo: r.escopo, kind: r.kind, score, total: n, pct,
      completo: r.kind === "custom" && r.escopo === ESCOPO_TODAS && n >= 20,
    });
    saveState(out.state);
    setProfile(out.state);

    const porMateria = {};
    list.forEach((a) => {
      const m = (porMateria[a.q.materia] ||= { ok: 0, total: 0 });
      m.total += 1; if (a.answered && a.correct) m.ok += 1;
    });
    const assuntosErrados = {};
    list.filter((a) => !a.correct).forEach((a) => { assuntosErrados[a.q.assunto] = (assuntosErrados[a.q.assunto] || 0) + 1; });

    const res = {
      list, score, wrong, blank, total: n, pct, xp, repeat: r.repeat, maxStreak, avgTime,
      net: usaNotaLiquida ? score - wrong : null,
      banca: r.banca, escopo: r.escopo, mode: r.mode, kind: r.kind,
      timeUsed: r.mode === "prova" ? r.total - Math.max(0, timeLeft) : Math.round(list.reduce((s, a) => s + a.elapsed, 0)),
      porMateria: Object.entries(porMateria).map(([materia, v]) => ({ materia, ...v })),
      assuntosErrados: Object.entries(assuntosErrados).sort((a, b) => b[1] - a[1]),
      unlock: out,
      nivel: levelInfo(out.state.xp),
    };
    setResult(res);
    setTab(wrong + blank > 0 ? "revisar" : "todas");
    setScreen("result");
    setTimeout(() => setRingOn(true), 120);
    trackSiteEvent("quiz_complete", { banca: r.banca, materia: escopoLabel(r.escopo), question_count: n, correct_count: score, mode: r.mode, kind: r.kind });
    fetchTutor(res);
  }
  const finishRef = useRef(finish);
  finishRef.current = finish;

  async function fetchTutor(res) {
    if (res.total < 5) return;
    setTutor({ loading: true, text: null });
    const erros = res.list.filter((a) => a.answered && !a.correct).slice(0, 8).map((a) => ({
      enunciado: a.q.enunciado,
      respostaAluno: a.q.alternativas[a.sel],
      respostaCorreta: a.q.alternativas[a.q.gabarito],
    }));
    try {
      const r = await fetch("/api/simulado/tutor-feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: "", banca: res.banca, materia: escopoLabel(res.escopo), score: res.score, total: res.total, avgTime: res.avgTime, maxStreak: res.maxStreak, erros }),
      });
      const data = await r.json();
      setTutor({ loading: false, text: r.ok ? data.feedback || null : null });
    } catch {
      setTutor({ loading: false, text: null });
    }
  }

  // ───────────────────────── efeitos: tempo e teclado ─────────────────────────
  useEffect(() => {
    if (screen !== "quiz" || !run || run.mode !== "prova") return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [screen, run?.id, run?.mode]);

  useEffect(() => {
    if (screen === "quiz" && run?.mode === "prova" && run.total > 0 && timeLeft <= 0) finishRef.current();
  }, [timeLeft, screen]);

  const keyRef = useRef(null);
  keyRef.current = (e) => {
    const r = runRef.current;
    if (screen !== "quiz" || !r || confirm) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const q = r.questions[r.current];
    const k = e.key.toLowerCase();
    if (q.formato === "ce") {
      if (k === "c" || k === "1") return handleSelect(0);
      if (k === "e" || k === "2") return handleSelect(1);
    } else {
      const idx = "abcde".indexOf(k);
      const num = parseInt(k, 10) - 1;
      if (idx >= 0 && idx < q.alternativas.length) return handleSelect(idx);
      if (num >= 0 && num < q.alternativas.length) return handleSelect(num);
    }
    if (k === "enter" || k === "arrowright") { e.preventDefault(); return next(); }
    if (k === "arrowleft" && r.mode === "prova") return goTo(r.current - 1);
    if (k === "f" && r.mode === "prova") return toggleFlag();
  };
  useEffect(() => {
    const h = (e) => keyRef.current && keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    if (screen !== "quiz") return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [screen]);

  // ───────────────────────── e-mail / compartilhar ─────────────────────────
  async function sendResult() {
    setMail((m) => ({ ...m, loading: true, error: "" }));
    try {
      const res = await fetch("/api/simulado/send-result", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mail.email, nome: mail.nome, banca: result.banca, materia: escopoLabel(result.escopo),
          score: result.score, total: result.total, pct: result.pct, xp: result.xp,
          maxStreak: result.maxStreak, avgTime: result.avgTime, tutorFeedback: tutor.text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar.");
      setMail((m) => ({ ...m, loading: false, sent: true }));
    } catch (err) {
      setMail((m) => ({ ...m, loading: false, error: err.message || "Não foi possível enviar agora." }));
    }
  }

  async function share() {
    if (!result) return;
    const label = result.kind === "daily" ? "Desafio do Dia" : `simulado ${escopoLabel(result.escopo)} (${result.banca})`;
    const text = `Fiz o ${label} no Passeja Concursos: ${result.score}/${result.total} (${result.pct}%). Consegue me superar?`;
    const url = `${window.location.origin}/simulado`;
    try {
      if (navigator.share) await navigator.share({ title: "Simulado Passeja", text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); showToast("Copiado! Cole onde quiser."); }
    } catch { /* cancelado */ }
  }

  // ───────────────────────── derivados ─────────────────────────
  const info = BANCA_INFO[banca];
  const materias = useMemo(() => getMaterias(banca), [banca]);
  const nEscopo = countQuestions(banca, escopo) + (useAI && escopo !== ESCOPO_TODAS ? AI_EXTRA : 0);
  const minutos = Math.round((nEscopo * (info.formato === "ce" ? SEC_CE : SEC_MC)) / 60);
  const streakAtivo = profile.streak.last === today || profile.streak.last === ontemKey() ? profile.streak.count : 0;
  const lvl = levelInfo(profile.xp);
  const dailyDone = profile.daily[today];
  const fracos = pontosFracos(profile);

  // ═══════════════════════════ RENDER ═══════════════════════════
  return (
    <main className="sm simulado-root">
      {screen === "home" && (
        <Home {...{ profile, lvl, streakAtivo, streakEmRisco: profile.streak.last !== today && streakAtivo > 0, dailyDone, today, startDaily, startReview, startMixed,
          banca, setBanca, escopo, setEscopo, modo, setModo, useAI, setUseAI, info, materias, nEscopo, minutos, startCustom, quizError, fracos }} />
      )}

      {screen === "loading" && (
        <div className="sm-loading" role="status" aria-live="polite">
          <div className="dots"><i /><i /><i /><i /></div>
          <h2>Gerando questões inéditas…</h2>
          <p className="sm-muted">Se a IA demorar, usamos só as questões revisadas do banco.</p>
        </div>
      )}

      {screen === "quiz" && run && (
        <Quiz {...{ run, timeLeft, toast, confirm, setConfirm, handleSelect, toggleFlag, goTo, next, finish,
          abandon: () => { finishedRef.current = true; setConfirm(null); setScreen("home"); } }} />
      )}

      {screen === "result" && result && (
        <Result {...{ result, tab, setTab, tutor, mail, setMail, sendResult, share, ringOn, toast, profile, today,
          replay, startReview, goHome: () => setScreen("home"), streakCount: profile.streak.count }} />
      )}
    </main>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HOME
// ═════════════════════════════════════════════════════════════════════════════
function Home(p) {
  const { profile, lvl, streakAtivo, streakEmRisco, dailyDone, startDaily, startReview, startMixed, banca, setBanca, escopo, setEscopo, modo, setModo, useAI, setUseAI, info, materias, nEscopo, minutos, startCustom, quizError, fracos } = p;
  const taxa = profile.answered ? Math.round((profile.correct / profile.answered) * 100) : null;

  return (
    <>
      <header style={{ margin: "8px 0 18px" }}>
        <p className="sm-eyebrow">Simulados · gabarito comentado</p>
        <h1 style={{ fontSize: "clamp(1.7rem, 4.5vw, 2.4rem)", fontWeight: 800, marginTop: 4 }}>Treine como na prova. Evolua a cada dia.</h1>
        <p className="sm-muted" style={{ maxWidth: "62ch", marginTop: 8 }}>
          {BANCAS.length} bancas, formato real de cada uma (Certo/Errado no Cebraspe), cronômetro, gabarito comentado com o artigo ou a regra, e um plano para revisar só o que você errou.
        </p>
      </header>

      {/* jogador */}
      <section className="sm-player" aria-label="Seu progresso">
        <div>
          <div className="lvl">Nível {lvl.idx + 1} · {lvl.nome}</div>
          <div className="xpbar" role="progressbar" aria-valuenow={lvl.pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${lvl.pct}%` }} /></div>
          <div className="meta">{lvl.prox ? `Faltam ${lvl.faltam} XP para “${lvl.prox}”` : "Nível máximo atingido"} · {profile.xp} XP</div>
        </div>
        <div className="stats">
          <div className="sm-stat"><b>🔥 {streakAtivo}</b><span>dias seguidos</span></div>
          <div className="sm-stat"><b>{profile.answered}</b><span>questões</span></div>
          <div className="sm-stat"><b>{taxa === null ? "—" : `${taxa}%`}</b><span>acertos</span></div>
        </div>
      </section>

      {/* desafio do dia */}
      <section className="sm-daily" id="desafio" aria-label="Desafio do dia">
        <div>
          <p className="sm-eyebrow">Desafio do dia · 5 questões · ~3 min</p>
          <h2>{dailyDone ? `Hoje você fez ${dailyDone.score}/${dailyDone.total}.` : "Cinco questões, o mesmo desafio para todo mundo."}</h2>
          <p>
            {dailyDone
              ? "Volte amanhã para um desafio novo. Refazer hoje vale como treino livre, sem XP."
              : streakEmRisco
                ? `Sua sequência de ${streakAtivo} ${streakAtivo === 1 ? "dia" : "dias"} termina hoje. Faça o desafio para mantê-la.`
                : "Mistura de bancas e matérias. Concluir hoje mantém sua sequência de estudos."}
          </p>
        </div>
        <button className="sm-btn" onClick={startDaily}>{dailyDone ? "Refazer (sem XP)" : "Jogar agora →"}</button>
      </section>

      {/* atalhos */}
      <div className="sm-modes">
        <button className="sm-mode" onClick={startReview} disabled={!profile.wrong.length}>
          <span className="ic">🔁</span><b>Revisar meus erros {profile.wrong.length ? `(${profile.wrong.length})` : ""}</b>
          <span>{profile.wrong.length ? "Refaça as questões que você errou. Acertar tira da fila." : "Quando você errar uma questão, ela aparece aqui para revisão."}</span>
        </button>
        <button className="sm-mode" onClick={startMixed}>
          <span className="ic">🎲</span><b>Misto surpresa</b>
          <span>10 questões sorteadas de todas as bancas e matérias, direto ao ponto.</span>
        </button>
      </div>

      {/* montador */}
      <section className="sm-sec" id="montar" aria-label="Monte seu simulado">
        <h2>Monte o seu simulado</h2>
        <p className="sm-muted">Escolha a banca que vai cair na sua prova. Cada uma tem seu estilo e formato.</p>

        <div className="sm-step"><i>1</i> Banca</div>
        <div className="sm-bancas">
          {BANCAS.map((b) => (
            <button key={b} className="sm-banca" aria-pressed={banca === b} onClick={() => { setBanca(b); setEscopo(ESCOPO_TODAS); }}>
              <span className="dot" aria-hidden />
              <b>{BANCA_INFO[b].nome}</b>
              <span className="fmt" style={{ color: BANCA_INFO[b].cor }}>{BANCA_INFO[b].formato === "ce" ? "Certo / Errado" : "Múltipla escolha"}</span>
              <small>{countQuestions(b)} questões</small>
            </button>
          ))}
        </div>
        <div className="sm-tip"><b>{info.nome}:</b> {info.resumo} <br /><b>Dica:</b> {info.dica}</div>

        <div className="sm-step"><i>2</i> O que treinar</div>
        <div className="sm-chips" role="group" aria-label="Matéria">
          <button className="sm-chip" aria-pressed={escopo === ESCOPO_TODAS} onClick={() => setEscopo(ESCOPO_TODAS)}>
            Simulado completo<small>{countQuestions(banca)}q</small>
          </button>
          {materias.map((m) => (
            <button key={m} className="sm-chip" aria-pressed={escopo === m} onClick={() => setEscopo(m)}>
              {m}<small>{countQuestions(banca, m)}q</small>
            </button>
          ))}
        </div>

        <div className="sm-step"><i>3</i> Modo</div>
        <div className="sm-seg" role="group" aria-label="Modo">
          <button aria-pressed={modo === "treino"} onClick={() => setModo("treino")}>
            <b>Treino</b><span>Gabarito comentado logo após cada resposta, com bônus de XP por velocidade.</span>
          </button>
          <button aria-pressed={modo === "prova"} onClick={() => setModo("prova")}>
            <b>Modo prova</b><span>Cronômetro geral, navegação livre, marcar para revisar. Gabarito só no final.</span>
          </button>
        </div>

        {escopo !== ESCOPO_TODAS && (
          <label className="sm-check">
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
            <span>Adicionar {AI_EXTRA} questões inéditas geradas por IA (beta). Elas aparecem identificadas, não entram na fila de revisão e podem conter erros: confira sempre no gabarito oficial.</span>
          </label>
        )}
        {quizError && <p className="sm-err" role="alert">{quizError}</p>}

        <div className="sm-start">
          <div className="sum">
            <b>{escopoLabel(escopo)} · {info.nome}</b>
            {nEscopo} questões · {modo === "prova" ? `cronômetro de ~${minutos} min` : "sem limite de tempo"}
          </div>
          <button className="sm-btn hl" onClick={startCustom}>Começar simulado →</button>
        </div>
      </section>

      {/* progresso */}
      <section className="sm-sec sm-two" aria-label="Conquistas e pontos fracos">
        <div className="sm-card">
          <h3>Conquistas <small className="sm-muted">({profile.badges.length}/{CONQUISTAS.length})</small></h3>
          <div className="sm-badges">
            {CONQUISTAS.map((c) => (
              <div key={c.id} className={`sm-badge ${profile.badges.includes(c.id) ? "on" : ""}`} title={c.desc}>
                <span className="ic">{c.icon}</span>{c.nome}
              </div>
            ))}
          </div>
        </div>
        <div className="sm-card">
          <h3>Onde você mais erra</h3>
          {fracos.length === 0 ? (
            <p className="sm-muted" style={{ marginTop: 10 }}>Resolva pelo menos 3 questões de uma matéria e mostramos aqui onde reforçar.</p>
          ) : (
            fracos.slice(0, 5).map((f) => (
              <div key={f.materia} className={`sm-bar ${f.pct < 50 ? "bad" : f.pct >= 75 ? "good" : ""}`}>
                <div className="row"><span>{f.materia}</span><span>{f.pct}% <small className="sm-muted">({f.total})</small></span></div>
                <div className="track"><i style={{ width: `${f.pct}%` }} /></div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* provas oficiais */}
      <section className="sm-sec" id="provas-oficiais" aria-label="Provas e gabaritos oficiais">
        <h2>Prova de verdade, gabarito oficial</h2>
        <p className="sm-muted">
          As questões deste simulado são originais, escritas no estilo de cada banca e revisadas com o fundamento legal. Para treinar com provas reais e conferir o gabarito oficial, use as fontes abaixo (gratuitas).
        </p>
        <div className="sm-src" style={{ marginTop: 14 }}>
          <a href={PORTAIS[banca].url} target="_blank" rel="noopener noreferrer" onClick={() => trackSiteEvent("outbound_official_source_click", { source_domain: new URL(PORTAIS[banca].url).hostname })}>
            <b>{info.nome}: {PORTAIS[banca].label}</b><span>Fonte oficial da banca selecionada.</span><em>Abrir site oficial ↗</em>
          </a>
          {ACERVOS.map((a) => (
            <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer nofollow" onClick={() => trackSiteEvent("outbound_official_source_click", { source_domain: new URL(a.url).hostname })}>
              <b>{a.label}</b><span>{a.nota}</span><em>Abrir ↗</em>
            </a>
          ))}
        </div>
        <p className="sm-fonte-note">
          Sites externos, de terceiros. Conferimos os links em out/2026, mas os acervos mudam: se algum não abrir, busque pelo nome do concurso no portal da banca. Gabarito oficial é sempre o publicado pela banca.
        </p>
      </section>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// QUIZ
// ═════════════════════════════════════════════════════════════════════════════
function Quiz({ run, timeLeft, toast, confirm, setConfirm, handleSelect, toggleFlag, goTo, next, finish, abandon }) {
  const { questions, answers, current, mode } = run;
  const q = questions[current];
  const a = answers[current];
  const treino = mode === "treino";
  const revealed = treino && a?.answered;
  const { xp, per } = computeXp(answers, "treino");
  const respondidas = answers.filter((x) => x?.answered).length;
  const faltam = questions.length - respondidas;
  const marcadas = answers.filter((x) => x?.flagged).length;
  const timePct = run.total ? Math.max(0, (timeLeft / run.total) * 100) : 100;
  const low = run.total && timeLeft < run.total * 0.15;
  let trail = 0;
  for (let k = answers.length - 1; k >= 0 && answers[k]?.correct; k--) trail++;

  return (
    <div className="sm-quiz">
      {toast && <div className="sm-toast" role="status">{toast}</div>}

      <div className="sm-top">
        <div className="sm-hud">
          {treino ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="sm-xp">⚡ {run.repeat ? 0 : xp} XP</span>
              {trail >= 2 && <span className="sm-flame">🔥 {trail}</span>}
            </div>
          ) : (
            <span className={`sm-timer ${low ? "low" : ""}`} aria-live="off">⏱ {fmt(timeLeft)}</span>
          )}
          <span className="sm-muted" style={{ fontWeight: 700 }}>{current + 1} / {questions.length}</span>
          <button className="sm-link" onClick={() => setConfirm("abandon")}>Sair</button>
        </div>
        {!treino && <div className="sm-timebar"><i style={{ width: `${timePct}%`, background: low ? "var(--accent)" : undefined }} /></div>}
        <div className="sm-nav" role="group" aria-label="Navegação entre questões">
          {questions.map((_, i) => {
            const x = answers[i];
            let cls = "";
            if (treino && x?.answered) cls = x.correct ? "ok" : "no";
            else if (!treino && x?.answered) cls = "answered";
            return (
              <button key={i} className={`${cls} ${x?.flagged ? "flag" : ""} ${i === current ? "cur" : ""}`}
                onClick={() => !treino && goTo(i)} disabled={treino} aria-label={`Questão ${i + 1}${x?.answered ? ", respondida" : ""}`}
                aria-current={i === current}>{i + 1}</button>
            );
          })}
        </div>
      </div>

      <article className="sm-q">
        <div className="sm-q-head">
          <span className="sm-pill ink">{q.banca}</span>
          <span className="sm-pill">{q.materia}</span>
          <span className="sm-pill">{q.assunto}</span>
          {q.ai && <span className="sm-pill ai">✨ Gerada por IA</span>}
          <span className="right">{["", "Fácil", "Média", "Difícil"][q.nivel]}</span>
        </div>
        <div className="sm-q-body">
          <p className="sm-q-enun">{q.enunciado}</p>

          <div className={q.formato === "ce" ? "sm-ce" : "sm-opts"} role="radiogroup" aria-label="Alternativas">
            {q.alternativas.map((alt, i) => {
              let cls = "sm-opt";
              if (revealed) { if (i === q.gabarito) cls += " right"; else if (i === a.sel) cls += " wrong"; }
              else if (a?.sel === i) cls += " sel";
              return (
                <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={revealed} role="radio" aria-checked={a?.sel === i}>
                  {q.formato === "ce" ? alt : (<><span className="bub">{revealed && i === q.gabarito ? "✓" : revealed && i === a.sel ? "✗" : String.fromCharCode(65 + i)}</span><span>{alt}</span></>)}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className={`sm-expl ${a.correct ? "ok" : "no"}`} role="status">
              <b className="t">{a.correct ? `Correto! +${run.repeat ? 0 : per[current]} XP` : `Não foi dessa vez. Gabarito: ${q.formato === "ce" ? q.alternativas[q.gabarito] : String.fromCharCode(65 + q.gabarito)}`}</b>
              <p>{q.explicacao}</p>
              {q.fonte && <p className="src">📖 {q.fonte}</p>}
            </div>
          )}

          <div className="sm-q-foot">
            {!treino ? (
              <>
                <button className={`sm-link ${a?.flagged ? "flagged" : ""}`} onClick={toggleFlag}>{a?.flagged ? "★ Marcada para revisar" : "☆ Marcar para revisar"}</button>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="sm-btn ghost sm" onClick={() => goTo(current - 1)} disabled={current === 0}>← Anterior</button>
                  {current + 1 < questions.length
                    ? <button className="sm-btn sm" onClick={() => goTo(current + 1)}>Próxima →</button>
                    : <button className="sm-btn hl sm" onClick={() => setConfirm("finish")}>Finalizar prova</button>}
                </div>
              </>
            ) : (
              <>
                <a className="sm-link" href="/contato" target="_blank" rel="noopener">Encontrou erro nesta questão?</a>
                {revealed && <button className="sm-btn" onClick={next}>{current + 1 >= questions.length ? "Ver resultado" : "Próxima →"}</button>}
              </>
            )}
          </div>
        </div>
      </article>

      <p className="sm-keys">
        Teclado: {q.formato === "ce" ? <><kbd>C</kbd> Certo · <kbd>E</kbd> Errado</> : <><kbd>A</kbd>–<kbd>{String.fromCharCode(64 + q.alternativas.length)}</kbd> responde</>} · <kbd>Enter</kbd> avança{!treino && <> · <kbd>←</kbd> volta · <kbd>F</kbd> marca</>}
      </p>

      {confirm === "finish" && (
        <div className="sm-modal" role="dialog" aria-modal="true" aria-labelledby="mf">
          <div>
            <h3 id="mf">Finalizar a prova?</h3>
            <p className="sm-muted">
              {faltam > 0 ? `Você deixou ${faltam} ${faltam === 1 ? "questão" : "questões"} em branco. ` : "Todas as questões foram respondidas. "}
              {marcadas > 0 ? `${marcadas} marcada(s) para revisar. ` : ""}
              {run.banca === "CEBRASPE" ? "No Cebraspe, em muitos editais, errar desconta um acerto: em branco não perde ponto." : ""}
            </p>
            <div className="row">
              <button className="sm-btn ghost" onClick={() => setConfirm(null)}>Voltar à prova</button>
              <button className="sm-btn hl" onClick={finish}>Finalizar</button>
            </div>
          </div>
        </div>
      )}
      {confirm === "abandon" && (
        <div className="sm-modal" role="dialog" aria-modal="true" aria-labelledby="ma">
          <div>
            <h3 id="ma">Sair do simulado?</h3>
            <p className="sm-muted">Você perde o progresso desta rodada. O que você já acumulou antes continua salvo.</p>
            <div className="row">
              <button className="sm-btn ghost" onClick={() => setConfirm(null)}>Continuar</button>
              <button className="sm-btn" onClick={abandon}>Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RESULTADO
// ═════════════════════════════════════════════════════════════════════════════
function Result({ result: r, tab, setTab, tutor, mail, setMail, sendResult, share, ringOn, toast, replay, startReview, goHome, streakCount }) {
  const C = 2 * Math.PI * 72;
  const tier = r.pct >= 85 ? ["Resultado de aprovação", "var(--success)"] : r.pct >= 70 ? ["Muito bom, falta pouco", "var(--hl)"] : r.pct >= 50 ? ["Você está no caminho", "var(--hl)"] : ["Base em construção", "var(--accent-light)"];
  const lista = r.list.map((a, i) => ({ ...a, i }));
  const filtradas = tab === "revisar" ? lista.filter((a) => !a.answered || !a.correct) : tab === "marcadas" ? lista.filter((a) => a.flagged) : lista;
  const temMarcadas = lista.some((a) => a.flagged);
  const { novasConquistas, subiuNivel, streakAumentou } = r.unlock;
  const erroCount = r.wrong + r.blank;

  return (
    <div className="sm-res">
      {toast && <div className="sm-toast" role="status">{toast}</div>}

      <section className="sm-hero">
        <div className="sm-ring" aria-hidden>
          <svg width="168" height="168" viewBox="0 0 168 168">
            <circle cx="84" cy="84" r="72" fill="none" stroke="rgba(128,134,190,.3)" strokeWidth="12" />
            <circle cx="84" cy="84" r="72" fill="none" stroke={tier[1]} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={ringOn ? C * (1 - r.pct / 100) : C} style={{ transition: "stroke-dashoffset 1.1s var(--ease-out)" }} />
          </svg>
          <div className="n">{r.pct}%</div>
        </div>
        <h1>{tier[0]}</h1>
        <p>{r.score} de {r.total} corretas · {r.kind === "custom" ? `${r.banca} · ${escopoLabel(r.escopo)}` : r.banca}</p>
        {r.net !== null && <span className="net">Nota líquida (acertos − erros): {r.net} de {r.total}</span>}
      </section>

      {(subiuNivel || novasConquistas.length > 0 || streakAumentou) && (
        <section className="sm-unlock" aria-live="polite">
          {subiuNivel && <p><b>🎉 Subiu de nível!</b> Agora você é “{r.nivel.nome}”.</p>}
          {streakAumentou && <p><b>🔥 Sequência de {streakCount} {streakCount === 1 ? "dia" : "dias"}.</b> Volte amanhã para não perder.</p>}
          {novasConquistas.map((c) => <p key={c.id}><b>{c.icon} Conquista: {c.nome}.</b> {c.desc}</p>)}
        </section>
      )}

      <div className="sm-kpis">
        <div className="sm-kpi"><b>{r.repeat ? "0" : `+${r.xp}`}</b><span>XP {r.repeat ? "(treino livre)" : "ganho"}</span></div>
        <div className="sm-kpi"><b>{r.score}/{r.wrong}/{r.blank}</b><span>acertos / erros / branco</span></div>
        <div className="sm-kpi"><b>{r.avgTime}s</b><span>tempo médio</span></div>
        <div className="sm-kpi"><b>{r.maxStreak}</b><span>maior sequência</span></div>
      </div>

      {r.porMateria.length > 1 && (
        <section className="sm-card sm-block">
          <h2>Desempenho por matéria</h2>
          {r.porMateria.map((m) => {
            const pc = Math.round((m.ok / m.total) * 100);
            return (
              <div key={m.materia} className={`sm-bar ${pc < 50 ? "bad" : pc >= 75 ? "good" : ""}`}>
                <div className="row"><span>{m.materia}</span><span>{m.ok}/{m.total}</span></div>
                <div className="track"><i style={{ width: `${pc}%` }} /></div>
              </div>
            );
          })}
        </section>
      )}

      {r.assuntosErrados.length > 0 && (
        <section className="sm-card sm-block">
          <h2>O que revisar primeiro</h2>
          <p className="sm-muted" style={{ marginBottom: 10 }}>Assuntos das questões que você errou ou deixou em branco:</p>
          <div className="sm-chips">{r.assuntosErrados.map(([a, n]) => <span key={a} className="sm-pill ink">{a} · {n}</span>)}</div>
        </section>
      )}

      {r.total >= 5 && (
        <section className="sm-tutor sm-block" aria-live="polite">
          <h2 style={{ fontSize: "1.05rem", marginBottom: 10 }}>🤖 Análise do Tutor IA</h2>
          {tutor.loading && <p className="sm-muted">Analisando seu desempenho…</p>}
          {!tutor.loading && tutor.text && <p>{tutor.text}</p>}
          {!tutor.loading && !tutor.text && (
            <p className="sm-muted">
              {erroCount === 0 ? "Gabaritou! Aumente o desafio com um simulado completo no modo prova." : `Comece pelos assuntos acima e depois refaça as questões erradas em “Revisar meus erros”. Errar e corrigir é o que mais rende na reta final.`}
            </p>
          )}
        </section>
      )}

      <section className="sm-block">
        <h2>Gabarito comentado</h2>
        <div className="sm-tabs" role="group" aria-label="Filtrar questões">
          <button className="sm-chip" aria-pressed={tab === "revisar"} onClick={() => setTab("revisar")}>Para revisar ({erroCount})</button>
          <button className="sm-chip" aria-pressed={tab === "todas"} onClick={() => setTab("todas")}>Todas ({r.total})</button>
          {temMarcadas && <button className="sm-chip" aria-pressed={tab === "marcadas"} onClick={() => setTab("marcadas")}>Marcadas</button>}
        </div>
        {filtradas.length === 0 && <p className="sm-muted">Nada por aqui. 👏</p>}
        {filtradas.map((a) => {
          const q = a.q;
          const st = !a.answered ? "skip" : a.correct ? "ok" : "no";
          const L = (i) => (q.formato === "ce" ? q.alternativas[i] : `${String.fromCharCode(65 + i)}) ${q.alternativas[i]}`);
          return (
            <article key={a.i} className={`sm-rev ${st}`}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="sm-pill ink">Q{a.i + 1}</span><span className="sm-pill">{q.materia}</span><span className="sm-pill">{q.assunto}</span>
                {q.ai && <span className="sm-pill ai">✨ IA</span>}
              </div>
              <p className="q">{q.enunciado}</p>
              {!a.answered && <p className="a">Em branco</p>}
              {a.answered && !a.correct && <p className="a w">✗ Sua resposta: {L(a.sel)}</p>}
              <p className="a r">✓ Gabarito: {L(q.gabarito)}</p>
              <p className="e">{q.explicacao}{q.fonte ? <> <b>({q.fonte})</b></> : null}</p>
            </article>
          );
        })}
      </section>

      <section className="sm-card sm-block">
        <h2>Receber a análise por e-mail <small className="sm-muted">(opcional)</small></h2>
        {mail.sent ? (
          <p>✅ Enviado para <b>{mail.email}</b>. Confira a caixa de entrada e o spam.</p>
        ) : (
          <>
            <div className="sm-mail">
              <input type="text" placeholder="Seu nome" value={mail.nome} onChange={(e) => setMail({ ...mail, nome: e.target.value })} aria-label="Seu nome" />
              <input type="email" placeholder="seu@email.com" value={mail.email} onChange={(e) => setMail({ ...mail, email: e.target.value })} aria-label="Seu e-mail" />
              <button className="sm-btn sm" onClick={sendResult} disabled={mail.loading || !mail.email}>{mail.loading ? "Enviando…" : "Enviar"}</button>
            </div>
            {mail.error && <p className="sm-err" role="alert">{mail.error}</p>}
            <p className="sm-muted" style={{ fontSize: ".78rem", marginTop: 8 }}>Usamos o e-mail só para enviar este resultado.</p>
          </>
        )}
      </section>

      <div className="sm-actions">
        {erroCount > 0 && r.kind !== "review" && <button className="sm-btn hl" onClick={startReview}>🔁 Treinar meus erros agora</button>}
        <button className="sm-btn" onClick={replay}>↻ Refazer</button>
        <button className="sm-btn ghost" onClick={share}>📤 Compartilhar</button>
        <button className="sm-btn ghost" onClick={goHome}>Novo simulado</button>
      </div>
    </div>
  );
}
