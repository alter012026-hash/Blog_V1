"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const colors = {
  border: "#D3D9F4",
  borderSoft: "#E3E7FA",
  surface: "#FFFFFF",
  surfaceAlt: "#E9EDFF",
  text: "#12163A",
  muted: "#454B73",
  faint: "#5F6590",
  primary: "#2430E6",
  primarySoft: "rgba(36,48,230,0.14)",
  green: "#0B7A47",
  red: "#C93525",
  hl: "#FFD43B",
};

const card = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
  padding: "18px 20px",
};

const RANGES = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 365, label: "12 meses" },
];

const GROUPS = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

// Agrupamentos que fazem sentido em cada período (poucas barras, legíveis).
const GROUPS_BY_RANGE = {
  7: ["day"],
  30: ["day", "week"],
  90: ["day", "week", "month"],
  365: ["week", "month"],
};
const DEFAULT_GROUP = { 7: "day", 30: "day", 90: "week", 365: "month" };

const nf = new Intl.NumberFormat("pt-BR");
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function shortDay(key) {
  const { m, d } = parseKey(key);
  return `${d} ${MONTHS[m - 1]}`;
}

function weekStart(key) {
  const date = new Date(`${key}T00:00:00Z`);
  const dow = (date.getUTCDay() + 6) % 7; // segunda = 0
  date.setUTCDate(date.getUTCDate() - dow);
  return date.toISOString().slice(0, 10);
}

/** Agrupa a série diária em dia / semana / mês. */
function groupSeries(series, group) {
  if (group === "day") {
    return series.map((p) => ({ key: p.date, label: shortDay(p.date), full: shortDay(p.date), views: p.views, visitors: p.visitors }));
  }
  const buckets = new Map();
  for (const p of series) {
    const key = group === "week" ? weekStart(p.date) : p.date.slice(0, 7);
    const bucket = buckets.get(key) || { key, views: 0, visitors: 0 };
    bucket.views += p.views;
    bucket.visitors += p.visitors;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].map((b) => {
    if (group === "week") {
      return { ...b, label: shortDay(b.key), full: `Semana de ${shortDay(b.key)}` };
    }
    const { y, m } = parseKey(`${b.key}-01`);
    return { ...b, label: MONTHS[m - 1], full: `${MONTHS[m - 1]} de ${y}` };
  });
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} style={{ display: "inline-flex", background: colors.surfaceAlt, borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            style={{
              border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 12px",
              fontSize: 13, fontWeight: active ? 700 : 600,
              background: active ? colors.surface : "transparent",
              color: active ? colors.primary : colors.muted,
              boxShadow: active ? "0 1px 2px rgba(18,22,58,0.12)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, sub, delta }) {
  return (
    <div style={{ ...card, padding: "16px 18px", minWidth: 0 }}>
      <div style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: colors.text, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: colors.faint, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {delta && (
          <span style={{ fontWeight: 700, color: delta.up ? colors.green : delta.down ? colors.red : colors.faint }}>
            {delta.text}
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

function BarChart({ points, hovered, setHovered }) {
  const max = Math.max(...points.map((p) => p.views), 1);
  const every = Math.max(1, Math.ceil(points.length / 8));
  return (
    <div>
      <div
        role="img"
        aria-label={`Gráfico de visualizações com ${points.length} barras. Total: ${nf.format(points.reduce((s, p) => s + p.views, 0))}.`}
        style={{ display: "flex", alignItems: "flex-end", gap: points.length > 60 ? 1 : 3, height: 190, borderBottom: `1px solid ${colors.border}`, padding: "0 2px" }}
        onMouseLeave={() => setHovered(null)}
      >
        {points.map((p, i) => {
          const h = p.views === 0 ? 2 : Math.max(4, (p.views / max) * 100);
          const active = hovered === i;
          return (
            <div
              key={p.key}
              onMouseEnter={() => setHovered(i)}
              onFocus={() => setHovered(i)}
              onClick={() => setHovered(i)}
              tabIndex={0}
              title={`${p.full}: ${nf.format(p.views)} visualizações · ${nf.format(p.visitors)} visitantes`}
              style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "flex-end", cursor: "pointer", outline: "none" }}
            >
              <div style={{
                width: "100%", height: `${h}%`, borderRadius: "4px 4px 0 0",
                background: p.views === 0 ? colors.border : active ? colors.hl : colors.primary,
                transition: "background .12s",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: points.length > 60 ? 1 : 3, padding: "6px 2px 0" }} aria-hidden="true">
        {points.map((p, i) => (
          <div key={p.key} style={{ flex: 1, minWidth: 0, fontSize: 11, color: colors.faint, textAlign: "center", whiteSpace: "nowrap", overflow: "visible" }}>
            {i % every === 0 ? p.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function RankList({ items, getKey, getTitle, getSub, total }) {
  const max = Math.max(...items.map((i) => i.views), 1);
  if (items.length === 0) {
    return <p style={{ margin: 0, fontSize: 14, color: colors.faint }}>Ainda sem dados neste período.</p>;
  }
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item) => (
        <li key={getKey(item)}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontSize: 14, color: colors.text, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={getTitle(item)}>
              {getTitle(item)}
            </span>
            <span style={{ fontSize: 13, color: colors.muted, flex: "none", fontVariantNumeric: "tabular-nums" }}>
              {nf.format(item.views)}
              <span style={{ color: colors.faint }}> · {total ? Math.round((item.views / total) * 100) : 0}%</span>
            </span>
          </div>
          {getSub && <div style={{ fontSize: 12, color: colors.faint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getSub(item)}</div>}
          <div style={{ height: 5, background: colors.surfaceAlt, borderRadius: 99, marginTop: 6 }}>
            <div style={{ height: "100%", width: `${(item.views / max) * 100}%`, background: colors.primary, borderRadius: 99, opacity: 0.85 }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function SetupNotice() {
  const code = { background: colors.surfaceAlt, borderRadius: 6, padding: "1px 6px", fontSize: 13 };
  return (
    <div style={card}>
      <h2 style={{ margin: "0 0 8px", fontSize: 17, fontFamily: "var(--font-display)" }}>Falta um passo para ativar o painel</h2>
      <p style={{ margin: "0 0 14px", fontSize: 14, color: colors.muted, lineHeight: 1.55 }}>
        O painel precisa de um lugar para guardar as visitas (o site na Vercel não tem banco de dados).
        Use o Upstash Redis, que tem plano gratuito e leva cerca de 2 minutos:
      </p>
      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: colors.text, lineHeight: 1.7 }}>
        <li>Na Vercel, abra o projeto → <b>Storage</b> → <b>Create Database</b> → <b>Upstash (Redis)</b> → plano Free.</li>
        <li>Conecte o banco ao projeto. A Vercel cria sozinha as variáveis <code style={code}>KV_REST_API_URL</code> e <code style={code}>KV_REST_API_TOKEN</code>.</li>
        <li>Faça um novo deploy. As visitas passam a ser contadas a partir daí.</li>
      </ol>
      <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.faint }}>
        Não é possível recuperar visitas anteriores: o contador começa no dia em que for ativado.
      </p>
    </div>
  );
}

export default function AnalyticsPanel() {
  const [range, setRange] = useState(30);
  const [group, setGroup] = useState(DEFAULT_GROUP[30]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hovered, setHovered] = useState(null);

  const load = useCallback(async (value) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/analytics?range=${value}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Falha ao carregar as estatísticas.");
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  function changeRange(value) {
    setRange(value);
    setGroup(DEFAULT_GROUP[value]);
    setHovered(null);
  }

  const points = useMemo(() => (data?.series ? groupSeries(data.series, group) : []), [data, group]);
  const focus = hovered !== null ? points[hovered] : null;

  if (data && data.configured === false) return <SetupNotice />;

  const totals = data?.totals;
  let delta = null;
  if (totals && totals.previousViews !== null && totals.previousViews !== undefined) {
    if (totals.previousViews === 0) {
      delta = totals.views > 0 ? { text: "novo", up: true } : null;
    } else {
      const pct = Math.round(((totals.views - totals.previousViews) / totals.previousViews) * 100);
      delta = { text: `${pct > 0 ? "▲ +" : pct < 0 ? "▼ " : ""}${pct}%`, up: pct > 0, down: pct < 0 };
    }
  }
  const rangeLabel = RANGES.find((r) => r.value === range)?.label.toLowerCase();
  const empty = totals && totals.views === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <Segmented label="Período" options={RANGES} value={range} onChange={changeRange} />
        <button
          type="button"
          onClick={() => load(range)}
          disabled={loading}
          style={{ border: `1px solid ${colors.border}`, background: colors.surface, color: colors.primary, borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {error && (
        <div role="alert" style={{ ...card, borderColor: colors.red, color: colors.red, fontSize: 14 }}>{error}</div>
      )}

      <div className="stat-grid" style={{ marginBottom: 0, opacity: loading && !data ? 0.5 : 1 }}>
        <Stat label="Visualizações" value={totals ? nf.format(totals.views) : "—"} sub={`nos últimos ${rangeLabel}`} delta={delta} />
        <Stat label="Visitantes" value={totals ? nf.format(totals.visitors) : "—"} sub="únicos por dia, somados" />
        <Stat label="Hoje" value={totals ? nf.format(totals.today.views) : "—"} sub={totals ? `ontem: ${nf.format(totals.yesterday.views)}` : ""} />
        <Stat label="Média por dia" value={totals ? nf.format(totals.avgPerDay) : "—"} sub="visualizações" />
      </div>

      <div style={card}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontFamily: "var(--font-display)" }}>Tráfego ao longo do tempo</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: colors.faint, minHeight: 18 }} aria-live="polite">
              {focus
                ? `${focus.full}: ${nf.format(focus.views)} visualizações · ${nf.format(focus.visitors)} visitantes`
                : "Passe o mouse (ou toque) em uma barra para ver os números."}
            </p>
          </div>
          {GROUPS_BY_RANGE[range].length > 1 && (
            <Segmented
              label="Agrupar por"
              options={GROUPS_BY_RANGE[range].map((g) => ({ value: g, label: GROUPS[g] }))}
              value={group}
              onChange={(g) => { setGroup(g); setHovered(null); }}
            />
          )}
        </div>
        {points.length > 0 ? <BarChart points={points} hovered={hovered} setHovered={setHovered} /> : (
          <div style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center", color: colors.faint, fontSize: 14 }}>
            {loading ? "Carregando…" : "Sem dados."}
          </div>
        )}
        {empty && !loading && (
          <p style={{ margin: "14px 0 0", fontSize: 13, color: colors.faint }}>
            Nenhuma visita registrada neste período ainda. As visitas aparecem aqui a partir do momento em que o rastreio foi ativado;
            suas próprias visitas (logado no admin) e as de robôs não são contadas.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div style={card}>
          <h2 style={{ margin: "0 0 14px", fontSize: 17, fontFamily: "var(--font-display)" }}>Páginas mais acessadas</h2>
          <RankList
            items={data?.pages || []}
            total={totals?.views}
            getKey={(i) => i.path}
            getTitle={(i) => i.title}
            getSub={(i) => i.path}
          />
        </div>
        <div style={card}>
          <h2 style={{ margin: "0 0 14px", fontSize: 17, fontFamily: "var(--font-display)" }}>De onde vêm os acessos</h2>
          <RankList
            items={data?.referrers || []}
            total={totals?.views}
            getKey={(i) => i.source}
            getTitle={(i) => i.source}
          />
          <p style={{ margin: "14px 0 0", fontSize: 12, color: colors.faint, lineHeight: 1.5 }}>
            “Direto” inclui quem digitou o endereço, abriu por favoritos ou veio de apps que não informam a origem.
          </p>
        </div>
      </div>
    </div>
  );
}
