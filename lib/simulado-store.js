/**
 * lib/simulado-store.js — progresso do aluno no simulado (localStorage).
 *
 * É o que dá motivo para voltar: nível, sequência de dias, conquistas,
 * desempenho por matéria e a fila de questões erradas para revisar.
 * Tudo local no navegador (sem login). Sempre protegido por try/catch:
 * se o storage estiver bloqueado, o simulado funciona normalmente, só não
 * guarda o progresso.
 */

const KEY = "passeja.simulado.v1";
const MAX_WRONG = 60;
const MAX_HISTORY = 30;

export const NIVEIS = [
  { nome: "Iniciante", xp: 0 },
  { nome: "Candidato", xp: 1000 },
  { nome: "Concurseiro", xp: 3000 },
  { nome: "Focado", xp: 7000 },
  { nome: "Veterano", xp: 14000 },
  { nome: "Quase lá", xp: 25000 },
  { nome: "Aprovado", xp: 40000 },
];

export const CONQUISTAS = [
  { id: "primeiro", icon: "🎯", nome: "Primeiro passo", desc: "Conclua seu primeiro simulado." },
  { id: "gabarito", icon: "🏆", nome: "Gabaritou", desc: "Acerte 100% em um simulado de 5+ questões." },
  { id: "sequencia3", icon: "🔥", nome: "Constância", desc: "Estude 3 dias seguidos." },
  { id: "sequencia7", icon: "🗓️", nome: "Semana de fogo", desc: "Estude 7 dias seguidos." },
  { id: "q50", icon: "📚", nome: "50 questões", desc: "Responda 50 questões no total." },
  { id: "q200", icon: "🧠", nome: "200 questões", desc: "Responda 200 questões no total." },
  { id: "maratona", icon: "⏱️", nome: "Maratonista", desc: "Conclua um simulado completo de banca." },
  { id: "revisor", icon: "🔁", nome: "Corrigiu o erro", desc: "Acerte uma questão que já tinha errado." },
];

export function hojeKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function ontemKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return hojeKey(d);
}

export function emptyState() {
  return {
    xp: 0, answered: 0, correct: 0,
    streak: { count: 0, last: null, best: 0 },
    daily: {},          // { "2026-10-25": { score, total } }
    perMateria: {},     // { "Português": { ok, total } }
    wrong: [],          // ids de questões a revisar
    history: [],        // últimos simulados
    badges: [],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage bloqueado */ }
}

export function levelInfo(xp) {
  let idx = 0;
  for (let i = 0; i < NIVEIS.length; i++) if (xp >= NIVEIS[i].xp) idx = i;
  const atual = NIVEIS[idx];
  const prox = NIVEIS[idx + 1] || null;
  const pct = prox ? Math.round(((xp - atual.xp) / (prox.xp - atual.xp)) * 100) : 100;
  return { idx, nome: atual.nome, prox: prox?.nome || null, faltam: prox ? prox.xp - xp : 0, pct };
}

/**
 * Aplica o resultado de uma rodada ao progresso e devolve
 * { state, novasConquistas, subiuNivel, streakAumentou }.
 *
 * run = { answers:[{id, materia, correct, answered}], xp, banca, escopo, kind,
 *         score, total, pct, completo }
 */
export function applyRun(prev, run) {
  const state = JSON.parse(JSON.stringify(prev));
  const nivelAntes = levelInfo(state.xp).idx;
  const badgesAntes = new Set(state.badges);

  state.xp += run.xp;

  let acertouErroAntigo = false;
  const wrong = new Set(state.wrong);
  for (const a of run.answers) {
    if (!a.answered) continue;
    state.answered += 1;
    if (a.correct) state.correct += 1;
    const m = (state.perMateria[a.materia] ||= { ok: 0, total: 0 });
    m.total += 1;
    if (a.correct) m.ok += 1;
    if (a.correct && wrong.has(a.id)) { wrong.delete(a.id); acertouErroAntigo = true; }
    if (!a.correct) wrong.add(a.id);
  }
  state.wrong = [...wrong].slice(-MAX_WRONG);

  // sequência de dias
  const hoje = hojeKey();
  let streakAumentou = false;
  if (state.streak.last !== hoje) {
    state.streak.count = state.streak.last === ontemKey() ? state.streak.count + 1 : 1;
    state.streak.last = hoje;
    state.streak.best = Math.max(state.streak.best, state.streak.count);
    streakAumentou = true;
  }

  // vale o primeiro resultado do dia; refazer é treino livre
  if (run.kind === "daily" && !state.daily[hoje]) state.daily[hoje] = { score: run.score, total: run.total };

  state.history = [
    { date: hoje, banca: run.banca, escopo: run.escopo, kind: run.kind, score: run.score, total: run.total, pct: run.pct },
    ...state.history,
  ].slice(0, MAX_HISTORY);

  // conquistas
  const give = (id, cond) => { if (cond && !state.badges.includes(id)) state.badges.push(id); };
  give("primeiro", true);
  give("gabarito", run.total >= 5 && run.score === run.total);
  give("sequencia3", state.streak.count >= 3);
  give("sequencia7", state.streak.count >= 7);
  give("q50", state.answered >= 50);
  give("q200", state.answered >= 200);
  give("maratona", !!run.completo);
  give("revisor", acertouErroAntigo);

  return {
    state,
    novasConquistas: CONQUISTAS.filter((c) => state.badges.includes(c.id) && !badgesAntes.has(c.id)),
    subiuNivel: levelInfo(state.xp).idx > nivelAntes,
    streakAumentou,
  };
}

/** Desempenho por matéria, do pior para o melhor (só matérias com 3+ respostas). */
export function pontosFracos(state) {
  return Object.entries(state.perMateria)
    .filter(([, v]) => v.total >= 3)
    .map(([materia, v]) => ({ materia, pct: Math.round((v.ok / v.total) * 100), total: v.total }))
    .sort((a, b) => a.pct - b.pct);
}
