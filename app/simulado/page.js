"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { BANCAS, getMaterias, getQuestions } from "../../lib/quiz-bank";

// ─── TELAS ────────────────────────────────────────────────────────────────────
// 0 = config, 1 = email gate, 2 = quiz, 3 = resultado

export default function SimuladoPage() {
  const [screen, setScreen] = useState(0);
  const [banca, setBanca] = useState(BANCAS[0]);
  const [materia, setMateria] = useState(getMaterias(BANCAS[0])[0]);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showExplain, setShowExplain] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [elapsedPerQ, setElapsedPerQ] = useState([]);
  const [qStart, setQStart] = useState(Date.now());
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [comboText, setComboText] = useState("");
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // ── IA: geração de questões e tutor (novo) ──────────────────────────────
  const [quantidade, setQuantidade] = useState(10);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [questionSource, setQuestionSource] = useState(null); // "ai" | "fallback"
  const [tutorFeedback, setTutorFeedback] = useState(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorFetched, setTutorFetched] = useState(false);

  const SEC_PER_Q = 90;

  // ── banca change
  useEffect(() => {
    const mats = getMaterias(banca);
    setMateria(mats[0] || "");
  }, [banca]);

  // ── timer
  useEffect(() => {
    if (screen !== 2) return;
    const total = questions.length * SEC_PER_Q;
    setTotalTime(total);
    setTimeLeft(total);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  async function startQuiz() {
    setLoadingQuiz(true);
    setQuizError("");
    setQuestionSource(null);
    setTutorFeedback(null);
    setTutorFetched(false);

    let qs = [];
    let source = "fallback";

    try {
      const res = await fetch("/api/simulado/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banca, materia, quantidade }),
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data.questions) || data.questions.length < 5) {
        throw new Error(data.error || "Não foi possível gerar as questões.");
      }
      qs = data.questions;
      source = data.source || "fallback";
    } catch (err) {
      // Última tentativa: usa o banco estático direto no cliente, caso a
      // própria requisição à API tenha falhado (ex.: sem conexão).
      qs = getQuestions(banca, materia, quantidade);
      source = "fallback";
      if (qs.length < 5) {
        setLoadingQuiz(false);
        setQuizError("Não foi possível carregar questões para esta combinação. Tente outra banca/matéria.");
        return;
      }
    }

    setQuestions(qs);
    setQuestionSource(source);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setShowExplain(false);
    setStreak(0);
    setMaxStreak(0);
    setXp(0);
    setCombo(0);
    setElapsedPerQ([]);
    setQStart(Date.now());
    setLoadingQuiz(false);
    setScreen(2);
  }

  function handleSelect(idx) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setShowExplain(true);

    const q = questions[current];
    const correct = idx === q.gabarito;
    const elapsed = Math.round((Date.now() - qStart) / 1000);
    setElapsedPerQ(p => [...p, elapsed]);

    // scoring
    const speedBonus = Math.max(0, 30 - elapsed) * 2;
    let gainedXp = correct ? 100 + speedBonus : 0;

    let newCombo = correct ? combo + 1 : 0;
    let newStreak = correct ? streak + 1 : 0;
    setCombo(newCombo);
    setStreak(newStreak);
    setMaxStreak(s => Math.max(s, newStreak));

    if (correct && newCombo >= 3) {
      const bonus = newCombo >= 5 ? 150 : 75;
      gainedXp += bonus;
      setComboText(newCombo >= 5 ? `🔥 COMBO x${newCombo}! +${bonus} XP` : `⚡ COMBO x${newCombo}! +${bonus} XP`);
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 2000);
    }

    setXp(x => x + gainedXp);
    setAnswers(a => [...a, { q: q.id, selected: idx, correct, elapsed, xpGained: gainedXp }]);
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) {
      clearInterval(timerRef.current);
      finishQuiz();
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
      setShowExplain(false);
      setQStart(Date.now());
    }
  }

  function finishQuiz() {
    setScreen(3);
  }

  // ── Tutor IA: feedback personalizado pós-simulado ───────────────────────
  async function fetchTutorFeedback() {
    if (tutorFetched || !questions.length) return;
    setTutorFetched(true);
    setTutorLoading(true);

    const finalScore = answers.filter(a => a.correct).length;
    const finalAvgTime = elapsedPerQ.length
      ? Math.round(elapsedPerQ.reduce((a, b) => a + b, 0) / elapsedPerQ.length)
      : 0;

    const erros = answers
      .map((a, i) => ({ a, q: questions[i] }))
      .filter(({ a }) => !a.correct)
      .map(({ a, q }) => ({
        enunciado: q.enunciado,
        respostaAluno: q.alternativas[a.selected],
        respostaCorreta: q.alternativas[q.gabarito],
      }));

    try {
      const res = await fetch("/api/simulado/tutor-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, banca, materia,
          score: finalScore, total: questions.length,
          avgTime: finalAvgTime, maxStreak, erros,
        }),
      });
      const data = await res.json();
      setTutorFeedback(res.ok ? (data.feedback || null) : null);
    } catch {
      setTutorFeedback(null);
    } finally {
      setTutorLoading(false);
    }
  }

  useEffect(() => {
    if (screen === 3) fetchTutorFeedback();
  }, [screen]);

  // ── envio real do e-mail de resultado, via /api/simulado/send-result (Resend) ──
  async function sendResult() {
    setEmailLoading(true);
    setEmailError("");

    const finalScore = answers.filter(a => a.correct).length;
    const finalPct = Math.round((finalScore / questions.length) * 100);
    const finalAvgTime = elapsedPerQ.length
      ? Math.round(elapsedPerQ.reduce((a, b) => a + b, 0) / elapsedPerQ.length)
      : 0;

    try {
      const res = await fetch("/api/simulado/send-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, nome, banca, materia,
          score: finalScore, total: questions.length, pct: finalPct,
          xp, maxStreak, avgTime: finalAvgTime,
          tutorFeedback,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar o e-mail.");
      setEmailSent(true);
    } catch (err) {
      setEmailError(err.message || "Não foi possível enviar o e-mail agora. Tente novamente.");
    } finally {
      setEmailLoading(false);
    }
  }

  const score = answers.filter(a => a.correct).length;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const avgTime = elapsedPerQ.length ? Math.round(elapsedPerQ.reduce((a, b) => a + b, 0) / elapsedPerQ.length) : 0;

  const timeUsed = totalTime - timeLeft;
  const timerPct = totalTime ? (timeLeft / totalTime) * 100 : 100;
  const timerColor = timerPct > 50 ? "var(--success)" : timerPct > 25 ? "var(--accent)" : "#ef4444";

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function getGrade(p) {
    if (p >= 90) return { label: "Excelente! 🏆", color: "#10B981", emoji: "🏆" };
    if (p >= 70) return { label: "Aprovado! ✅", color: "var(--success)", emoji: "✅" };
    if (p >= 50) return { label: "Quase lá! 💪", color: "var(--accent)", emoji: "💪" };
    return { label: "Estude mais! 📚", color: "#ef4444", emoji: "📚" };
  }

  const grade = getGrade(pct);

  return (
    <>
      <Header posts={[]} />
      <main style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "80px" }}>

        {/* ═══ TELA 0: CONFIGURAÇÃO ═══ */}
        {screen === 0 && (
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 16px" }}>
            {/* Hero */}
            <div style={{
              textAlign: "center", marginBottom: 40,
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
              borderRadius: "var(--radius-xl)", padding: "48px 32px", color: "#fff",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", top: -30, right: -30, width: 160, height: 160,
                background: "rgba(255,255,255,0.06)", borderRadius: "50%"
              }} />
              <div style={{
                position: "absolute", bottom: -20, left: -20, width: 100, height: 100,
                background: "rgba(255,255,255,0.04)", borderRadius: "50%"
              }} />
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem,4vw,2.2rem)",
                fontWeight: 800, marginBottom: 12, lineHeight: 1.2
              }}>Simulado Inteligente</h1>
              <p style={{ opacity: 0.88, fontSize: "1rem", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                Questões reais de concursos anteriores. Feedback instantâneo. Gamificação para manter você focado.
              </p>
              <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
                {[[String(quantidade), "questões"], ["90s", "por questão"], ["XP", "e conquistas"]].map(([v, l]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>{v}</div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-lg)",
              padding: 32, border: "1px solid var(--border)", boxShadow: "var(--shadow-md)"
            }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: 24, color: "var(--text)" }}>
                Configure seu simulado
              </h2>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Escolha a Banca</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {BANCAS.map(b => (
                    <button key={b} onClick={() => setBanca(b)} style={{
                      ...chipStyle,
                      background: banca === b ? "var(--primary)" : "var(--surface-3)",
                      color: banca === b ? "#fff" : "var(--text)",
                      border: banca === b ? "2px solid var(--primary)" : "2px solid var(--border)",
                      fontWeight: banca === b ? 700 : 500
                    }}>{b}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Escolha a Matéria</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  {getMaterias(banca).map(m => (
                    <button key={m} onClick={() => setMateria(m)} style={{
                      ...chipStyle,
                      background: materia === m ? "var(--primary)" : "var(--surface-3)",
                      color: materia === m ? "#fff" : "var(--text)",
                      border: materia === m ? "2px solid var(--primary)" : "2px solid var(--border)",
                      fontWeight: materia === m ? 700 : 500,
                      textAlign: "left", padding: "14px 18px"
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Quantas questões?</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[5, 10, 15].map(n => (
                    <button key={n} onClick={() => setQuantidade(n)} style={{
                      ...chipStyle,
                      textAlign: "center",
                      background: quantidade === n ? "var(--primary)" : "var(--surface-3)",
                      color: quantidade === n ? "#fff" : "var(--text)",
                      border: quantidade === n ? "2px solid var(--primary)" : "2px solid var(--border)",
                      fontWeight: quantidade === n ? 700 : 500
                    }}>{n} questões</button>
                  ))}
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 10, lineHeight: 1.5 }}>
                  ✨ Questões inéditas geradas por IA a cada simulado — nunca caem as mesmas duas vezes.
                </p>
              </div>

              <button onClick={() => setScreen(1)} style={btnPrimaryStyle}>
                Começar Simulado →
              </button>
            </div>
          </div>
        )}

        {/* ═══ TELA 1: CAPTURA DE EMAIL ═══ */}
        {screen === 1 && (
          <div style={{ maxWidth: 500, margin: "0 auto", padding: "48px 16px" }}>
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-xl)",
              padding: "40px 32px", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem",
                marginBottom: 12, color: "var(--text)"
              }}>Receba seu resultado por e-mail!</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6, fontSize: "0.95rem" }}>
                Informe seu nome e e-mail para receber uma análise personalizada do seu desempenho com dicas de estudo.
              </p>

              <div style={{ textAlign: "left", marginBottom: 16 }}>
                <label style={labelStyle}>Seu nome</label>
                <input
                  type="text"
                  placeholder="Como prefere ser chamado?"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ textAlign: "left", marginBottom: 24 }}>
                <label style={labelStyle}>Seu melhor e-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button onClick={startQuiz} disabled={loadingQuiz} style={{ ...btnPrimaryStyle, opacity: loadingQuiz ? 0.7 : 1, cursor: loadingQuiz ? "wait" : "pointer" }}>
                {loadingQuiz ? "🧠 Gerando questões com IA..." : "🚀 Iniciar Simulado"}
              </button>

              <button
                onClick={startQuiz}
                disabled={loadingQuiz}
                style={{ ...btnGhostStyle, marginTop: 12, opacity: loadingQuiz ? 0.7 : 1 }}
              >
                Pular e iniciar sem e-mail
              </button>

              {quizError && (
                <p style={{ fontSize: "0.82rem", color: "#ef4444", marginTop: 16, lineHeight: 1.5 }}>
                  ⚠️ {quizError}
                </p>
              )}

              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 20 }}>
                🔒 Seus dados são usados apenas para enviar o resultado. Sem spam.
              </p>
            </div>
          </div>
        )}

        {/* ═══ TELA 2: QUIZ ═══ */}
        {screen === 2 && questions.length > 0 && (
          <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>

            {/* Combo popup */}
            {showCombo && (
              <div style={{
                position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: "#fff", borderRadius: 50, padding: "12px 28px",
                fontWeight: 800, fontSize: "1.1rem", zIndex: 9999,
                animation: "popIn 0.3s var(--ease-spring)",
                boxShadow: "0 4px 24px rgba(245,158,11,0.5)",
                whiteSpace: "nowrap"
              }}>
                {comboText}
              </div>
            )}

            {/* HUD */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center", marginBottom: 20, gap: 12
            }}>
              {/* XP */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                  borderRadius: 50, padding: "6px 14px",
                  fontFamily: "var(--font-mono)", fontWeight: 700,
                  fontSize: "0.9rem", color: "#000"
                }}>⚡ {xp} XP</div>
                {streak >= 2 && (
                  <div style={{
                    background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                    borderRadius: 50, padding: "6px 12px",
                    fontWeight: 700, fontSize: "0.85rem", color: "#fff"
                  }}>🔥 {streak}</div>
                )}
              </div>

              {/* Timer */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 700,
                  color: timerColor, lineHeight: 1,
                  transition: "color 0.5s"
                }}>{formatTime(timeLeft)}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>restante</div>
              </div>

              {/* Progresso */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  {current + 1} / {questions.length}
                </div>
              </div>
            </div>

            {/* Timer bar */}
            <div style={{
              height: 6, background: "var(--border)", borderRadius: 99, marginBottom: 24, overflow: "hidden"
            }}>
              <div style={{
                height: "100%", background: timerColor,
                width: `${timerPct}%`, borderRadius: 99,
                transition: "width 1s linear, background 0.5s"
              }} />
            </div>

            {/* Indicadores de questão */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
              {questions.map((_, i) => {
                const ans = answers[i];
                let bg = "var(--border)";
                if (ans) bg = ans.correct ? "var(--success)" : "#ef4444";
                else if (i === current) bg = "var(--primary)";
                return (
                  <div key={i} style={{
                    width: 28, height: 8, borderRadius: 99, background: bg,
                    transition: "background 0.3s"
                  }} />
                );
              })}
            </div>

            {/* Card da questão */}
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
              overflow: "hidden"
            }}>
              {/* Header da questão */}
              <div style={{
                background: "var(--surface-2)", padding: "16px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"
              }}>
                <span style={{
                  background: "var(--primary)", color: "#fff",
                  borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700
                }}>{banca}</span>
                <span style={{
                  background: "var(--surface-3)", color: "var(--text-secondary)",
                  borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem"
                }}>{materia}</span>
                <span style={{
                  background: "var(--surface-3)", color: "var(--text-muted)",
                  borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem"
                }}>📅 {questions[current].ano}</span>
                {questionSource === "ai" && (
                  <span style={{
                    background: "rgba(124,58,237,0.12)", color: "#7C3AED",
                    borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 600
                  }}>✨ Gerada por IA</span>
                )}
                <span style={{
                  marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-muted)"
                }}>{questions[current].cargo}</span>
              </div>

              <div style={{ padding: "24px" }}>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "1.05rem",
                  lineHeight: 1.7, color: "var(--text)", marginBottom: 24, fontWeight: 500
                }}>
                  {questions[current].enunciado}
                </p>

                {/* Alternativas */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions[current].alternativas.map((alt, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === questions[current].gabarito;
                    let bg = "var(--surface-3)";
                    let border = "var(--border)";
                    let color = "var(--text)";
                    if (answered) {
                      if (isCorrect) { bg = "rgba(16,185,129,0.12)"; border = "var(--success)"; color = "var(--success)"; }
                      else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.1)"; border = "#ef4444"; color = "#ef4444"; }
                    } else if (isSelected) {
                      bg = "rgba(27,58,107,0.08)"; border = "var(--primary)"; color = "var(--primary)";
                    }

                    return (
                      <button key={i} onClick={() => handleSelect(i)} disabled={answered} style={{
                        display: "flex", alignItems: "flex-start", gap: 14,
                        background: bg, border: `2px solid ${border}`,
                        borderRadius: "var(--radius)", padding: "14px 18px",
                        cursor: answered ? "default" : "pointer",
                        transition: "all 0.25s var(--ease-out)", textAlign: "left",
                        color, fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.5,
                        fontWeight: isCorrect && answered ? 600 : 400
                      }}>
                        <span style={{
                          minWidth: 28, height: 28, borderRadius: "50%",
                          background: answered && isCorrect ? "var(--success)" : answered && isSelected ? "#ef4444" : "var(--border)",
                          color: (answered && (isCorrect || isSelected)) ? "#fff" : "var(--text-secondary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-mono)", flexShrink: 0
                        }}>
                          {answered && isCorrect ? "✓" : answered && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                        </span>
                        {alt}
                      </button>
                    );
                  })}
                </div>

                {/* Explicação */}
                {showExplain && (
                  <div style={{
                    marginTop: 20, padding: 18,
                    background: selected === questions[current].gabarito
                      ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)",
                    border: `1px solid ${selected === questions[current].gabarito ? "var(--success)" : "#ef4444"}`,
                    borderRadius: "var(--radius)", lineHeight: 1.65
                  }}>
                    <div style={{
                      fontWeight: 700, marginBottom: 8,
                      color: selected === questions[current].gabarito ? "var(--success)" : "#ef4444",
                      fontSize: "0.9rem"
                    }}>
                      {selected === questions[current].gabarito ? "✅ Resposta correta!" : "❌ Resposta incorreta"}
                      {selected === questions[current].gabarito && answers.length && (
                        <span style={{ color: "var(--accent)", marginLeft: 12 }}>+{answers[answers.length - 1]?.xpGained} XP</span>
                      )}
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: 0 }}>
                      {questions[current].explicacao}
                    </p>
                  </div>
                )}

                {answered && (
                  <button onClick={nextQuestion} style={{ ...btnPrimaryStyle, marginTop: 20 }}>
                    {current + 1 >= questions.length ? "📊 Ver Resultado" : "Próxima Questão →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TELA 3: RESULTADO ═══ */}
        {screen === 3 && (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>

            {/* Header resultado */}
            <div style={{
              background: `linear-gradient(135deg, ${grade.color}22 0%, ${grade.color}11 100%)`,
              border: `2px solid ${grade.color}44`,
              borderRadius: "var(--radius-xl)", padding: "40px 32px",
              textAlign: "center", marginBottom: 24
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{grade.emoji}</div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem,8vw,4rem)",
                fontWeight: 900, color: grade.color, lineHeight: 1,
                fontVariantNumeric: "tabular-nums"
              }}>{pct}%</div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700,
                color: "var(--text)", marginTop: 8
              }}>{grade.label}</div>
              <div style={{ color: "var(--text-secondary)", marginTop: 8 }}>
                {nome ? `Parabéns, ${nome}! ` : ""}
                {score} de {questions.length} questões corretas — {banca} / {materia}
              </div>
            </div>

            {/* Métricas */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 14, marginBottom: 24
            }}>
              {[
                { icon: "⚡", label: "XP Total", value: xp, mono: true },
                { icon: "🔥", label: "Maior Sequência", value: `${maxStreak} acertos`, mono: false },
                { icon: "⏱️", label: "Tempo médio/questão", value: `${avgTime}s`, mono: true },
                { icon: "🎯", label: "Taxa de acerto", value: `${pct}%`, mono: true },
              ].map(m => (
                <div key={m.label} style={{
                  background: "var(--surface)", borderRadius: "var(--radius)",
                  border: "1px solid var(--border)", padding: "20px 16px", textAlign: "center",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</div>
                  <div style={{
                    fontFamily: m.mono ? "var(--font-mono)" : "var(--font-display)",
                    fontSize: "1.35rem", fontWeight: 700, color: "var(--text)"
                  }}>{m.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Gráfico de questões */}
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)", padding: 24, marginBottom: 24,
              boxShadow: "var(--shadow-sm)"
            }}>
              <h3 style={{
                fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16,
                fontSize: "1rem", color: "var(--text)"
              }}>Desempenho por questão</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {answers.map((a, i) => (
                  <div key={i} style={{
                    width: 44, height: 44, borderRadius: "var(--radius-sm)",
                    background: a.correct ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
                    border: `2px solid ${a.correct ? "var(--success)" : "#ef4444"}`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: "1rem" }}>{a.correct ? "✓" : "✗"}</span>
                    <span style={{
                      fontSize: "0.6rem", color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)"
                    }}>{a.elapsed}s</span>
                  </div>
                ))}
              </div>

              {/* Barra de progresso visual */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                  <span>Acertos</span><span>{score}/{questions.length}</span>
                </div>
                <div style={{ height: 10, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    background: `linear-gradient(90deg, ${grade.color}, ${grade.color}99)`,
                    width: `${pct}%`, transition: "width 1s var(--ease-out)"
                  }} />
                </div>
              </div>
            </div>

            {/* Tutor IA */}
            <div style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(124,58,237,0.03))",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 24
            }}>
              <h3 style={{
                fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 14,
                fontSize: "1rem", color: "var(--text)", display: "flex", alignItems: "center", gap: 8
              }}>🤖 Feedback do Tutor IA</h3>

              {tutorLoading && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Analisando seu desempenho e montando um plano de estudos personalizado...
                </p>
              )}

              {!tutorLoading && tutorFeedback && (
                <p style={{ color: "var(--text)", fontSize: "0.92rem", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>
                  {tutorFeedback}
                </p>
              )}

              {!tutorLoading && !tutorFeedback && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
                  {pct >= 70
                    ? "Bom desempenho! Continue revisando os pontos que errou e mantenha a consistência nos estudos."
                    : "Revise com atenção as questões erradas abaixo e volte a treinar essa matéria em alguns dias."}
                </p>
              )}
            </div>

            {/* Revisão de erros */}
            {answers.some(a => !a.correct) && (
              <div style={{
                background: "var(--surface)", borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)", padding: 24, marginBottom: 24
              }}>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16,
                  fontSize: "1rem", color: "var(--text)"
                }}>📌 Revisão dos erros</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {answers.map((a, i) => {
                    if (a.correct) return null;
                    const q = questions[i];
                    return (
                      <div key={i} style={{
                        padding: 14, background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)"
                      }}>
                        <p style={{ fontSize: "0.88rem", color: "var(--text)", fontWeight: 500, marginBottom: 8 }}>
                          Q{i + 1}: {q.enunciado}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "#ef4444", marginBottom: 4 }}>
                          ✗ Sua resposta: {q.alternativas[a.selected]}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "var(--success)", marginBottom: 8 }}>
                          ✓ Correta: {q.alternativas[q.gabarito]}
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          💡 {q.explicacao}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA email */}
            {!emailSent && email && (
              <div style={{
                background: "linear-gradient(135deg, var(--primary)11, var(--primary-light)08)",
                border: "1px solid var(--primary)33",
                borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 24, textAlign: "center"
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
                  Receber resultado por e-mail
                </h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: "0.9rem" }}>
                  Enviar análise completa para <strong>{email}</strong>
                </p>
                <button onClick={sendResult} disabled={emailLoading} style={btnPrimaryStyle}>
                  {emailLoading ? "Enviando..." : "📬 Enviar Resultado"}
                </button>
                {emailError && (
                  <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: 12 }}>⚠️ {emailError}</p>
                )}
              </div>
            )}

            {!email && !emailSent && (
              <div style={{
                background: "var(--surface-2)", borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)", padding: 24, marginBottom: 24
              }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 12, color: "var(--text)", fontSize: "1rem" }}>
                  📬 Receber por e-mail
                </h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="email" placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                  />
                  <button onClick={sendResult} disabled={emailLoading} style={{ ...btnPrimaryStyle, flex: "0 0 auto", padding: "12px 20px" }}>
                    {emailLoading ? "Enviando..." : "Enviar"}
                  </button>
                </div>
                {emailError && (
                  <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: 12 }}>⚠️ {emailError}</p>
                )}
              </div>
            )}

            {emailSent && (
              <div style={{
                background: "rgba(16,185,129,0.1)", border: "1px solid var(--success)",
                borderRadius: "var(--radius)", padding: 16, textAlign: "center", marginBottom: 24
              }}>
                ✅ E-mail enviado para <strong>{email}</strong>! Confira sua caixa de entrada (e o spam, só por garantia).
              </div>
            )}

            {/* Ações */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => { setScreen(0); setAnswers([]); setTutorFeedback(null); setTutorFetched(false); }} style={{ ...btnPrimaryStyle, flex: 1 }}>
                🔄 Novo Simulado
              </button>
              <button onClick={() => {
                setAnswers([]); setCurrent(0); setSelected(null); setAnswered(false);
                setShowExplain(false); setStreak(0); setMaxStreak(0); setXp(0); setCombo(0);
                setElapsedPerQ([]); setQStart(Date.now()); setTutorFeedback(null); setTutorFetched(false);
                setScreen(2);
              }} style={{ ...btnGhostStyle, flex: 1 }}>
                ↩️ Refazer esta prova
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />

      <style>{`
        @keyframes popIn {
          from { transform: translateX(-50%) scale(0.7); opacity: 0; }
          to   { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        button:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
        button { transition: all 0.2s var(--ease-out); }
        input:focus { outline: none; border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(27,58,107,0.12); }
      `}</style>
    </>
  );
}

// ─── estilos base ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block", fontWeight: 600, fontSize: "0.85rem",
  color: "var(--text-secondary)", marginBottom: 10,
  fontFamily: "var(--font-body)"
};
const chipStyle = {
  borderRadius: "var(--radius-sm)", padding: "12px 16px",
  cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.9rem",
  transition: "all 0.2s", border: "2px solid transparent"
};
const btnPrimaryStyle = {
  width: "100%", padding: "14px 20px",
  background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
  color: "#fff", border: "none", borderRadius: "var(--radius)",
  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem",
  cursor: "pointer", boxShadow: "var(--shadow-md)"
};
const btnGhostStyle = {
  width: "100%", padding: "13px 20px",
  background: "transparent", color: "var(--text-secondary)",
  border: "1px solid var(--border)", borderRadius: "var(--radius)",
  fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.95rem",
  cursor: "pointer"
};
const inputStyle = {
  width: "100%", padding: "12px 14px",
  background: "var(--surface-3)", border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
  fontSize: "0.95rem", color: "var(--text)", transition: "border-color 0.2s"
};
