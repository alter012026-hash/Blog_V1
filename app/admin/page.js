"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Paleta e estilos inline (sem depender do globals.css do blog) ─── */
const C = {
  bg: "#0F172A",
  surface: "#1E293B",
  surfaceHover: "#263044",
  border: "#334155",
  borderSoft: "#1E293B",
  primary: "#3B82F6",
  primaryHover: "#2563EB",
  accent: "#F59E0B",
  green: "#10B981",
  red: "#EF4444",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
};

const s = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: "24px",
  },
  input: {
    width: "100%",
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDanger: {
    background: "transparent",
    color: C.red,
    border: `1px solid ${C.red}`,
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  btnGhost: {
    background: "transparent",
    color: C.textMuted,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    cursor: "pointer",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 6,
  },
  fieldGroup: { marginBottom: 16 },
  tag: (color) => ({
    display: "inline-block",
    background: color + "22",
    color,
    border: `1px solid ${color}44`,
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 11,
    fontWeight: 600,
  }),
};

/* ─── Componentes utilitários ─── */
function Toast({ msg, type }) {
  if (!msg) return null;
  const color = type === "error" ? C.red : C.green;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: C.surface, border: `1px solid ${color}`,
      borderRadius: 10, padding: "12px 20px", color,
      fontWeight: 600, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      {type === "error" ? "✗" : "✓"} {msg}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ ...s.card, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color: color || C.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textFaint, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data }) {
  if (!data || Object.keys(data).length === 0) return <div style={{ color: C.textFaint, fontSize: 13 }}>Sem dados suficientes.</div>;
  const max = Math.max(...Object.values(data), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {Object.entries(data).map(([month, count]) => (
        <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 11, color: C.textFaint }}>{count}</div>
          <div style={{
            width: "100%", borderRadius: "4px 4px 0 0",
            background: C.primary,
            height: `${Math.max(4, (count / max) * 56)}px`,
            transition: "height 0.4s",
          }} />
          <div style={{ fontSize: 10, color: C.textFaint, whiteSpace: "nowrap" }}>{month.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── LOGIN ─── */
function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) onLogin();
    else setError(data.error || "Senha incorreta");
  }

  return (
    <div style={s.center}>
      <div style={{ ...s.card, width: 340, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Painel Admin</h2>
        <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 24px" }}>Aprovado Já</p>
        <form onSubmit={handleLogin}>
          <div style={s.fieldGroup}>
            <input
              type="password"
              placeholder="Senha de administrador"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              style={s.input}
              autoFocus
            />
          </div>
          {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button type="submit" style={{ ...s.btn, width: "100%" }} disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p style={{ color: C.textFaint, fontSize: 11, marginTop: 20 }}>
          Defina ADMIN_PASSWORD no .env.local
        </p>
      </div>
    </div>
  );
}

/* ─── ABA: MÉTRICAS ─── */
function MetricsTab({ toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { toast("Erro ao carregar métricas", "error"); setLoading(false); });
  }, []);

  if (loading) return <p style={{ color: C.textMuted }}>Carregando métricas…</p>;
  if (!data) return null;

  const topCats = Object.entries(data.categories || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Total de Posts" value={data.totalPosts} sub="no blog" color={C.primary} />
        <StatCard label="Últimas 24h" value={data.postsLast24h} sub="posts publicados" color={C.green} />
        <StatCard label="Últimos 7 dias" value={data.postsLast7d} sub="posts publicados" color={C.accent} />
        <StatCard label="Últimos 30 dias" value={data.postsLast30d} sub="posts publicados" />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Gráfico por mês */}
        <div style={{ ...s.card, flex: 2, minWidth: 240 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Posts por mês</div>
          <BarChart data={data.byMonth} />
        </div>

        {/* Categorias */}
        <div style={{ ...s.card, flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Por categoria</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topCats.map(([cat, count]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.textMuted }}>{cat}</span>
                <span style={s.tag(C.primary)}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts recentes */}
      <div style={s.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Posts recentes</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Título", "Categoria", "Data", "Palavras", "Leitura"].map((h) => (
                <th key={h} style={{ textAlign: "left", color: C.textFaint, fontWeight: 600, padding: "0 8px 10px 0", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recent.map((p) => (
              <tr key={p.slug} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                <td style={{ padding: "10px 8px 10px 0", maxWidth: 240 }}>
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer"
                    style={{ color: C.text, textDecoration: "none", fontWeight: 500 }}>
                    {p.title.length > 50 ? p.title.slice(0, 50) + "…" : p.title}
                  </a>
                </td>
                <td style={{ padding: "10px 8px 10px 0" }}>
                  <span style={s.tag(C.accent)}>{p.category}</span>
                </td>
                <td style={{ padding: "10px 8px 10px 0", color: C.textMuted, whiteSpace: "nowrap" }}>{p.date}</td>
                <td style={{ padding: "10px 8px 10px 0", color: C.textMuted }}>{p.words.toLocaleString()}</td>
                <td style={{ padding: "10px 8px 10px 0", color: C.textMuted }}>{p.readingTime} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── ABA: AFILIADOS ─── */
function AffiliatesTab({ toast }) {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const empty = { id: "", name: "", url: "", keywords: "", cta: "" };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null); // index

  useEffect(() => {
    fetch("/api/admin/affiliates")
      .then((r) => r.json())
      .then((d) => { setAffiliates(d.affiliates || []); setLoading(false); })
      .catch(() => { toast("Erro ao carregar afiliados", "error"); setLoading(false); });
  }, []);

  async function save(list) {
    setSaving(true);
    const res = await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliates: list }),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) toast("Afiliados salvos!");
    else toast(d.error || "Erro ao salvar", "error");
  }

  function startEdit(i) {
    const a = affiliates[i];
    setForm({ ...a, keywords: (a.keywords || []).join(", ") });
    setEditing(i);
  }

  function cancelEdit() {
    setForm(empty);
    setEditing(null);
  }

  function applyEdit() {
    const aff = {
      ...form,
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    };
    const list = editing === "new"
      ? [...affiliates, aff]
      : affiliates.map((a, i) => (i === editing ? aff : a));
    setAffiliates(list);
    save(list);
    cancelEdit();
  }

  function remove(i) {
    const list = affiliates.filter((_, idx) => idx !== i);
    setAffiliates(list);
    save(list);
  }

  if (loading) return <p style={{ color: C.textMuted }}>Carregando afiliados…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Lista */}
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700 }}>Links de afiliados ({affiliates.length})</div>
          <button style={s.btn} onClick={() => { setForm(empty); setEditing("new"); }}>+ Novo afiliado</button>
        </div>

        {affiliates.length === 0 && (
          <p style={{ color: C.textFaint, fontSize: 13 }}>Nenhum afiliado cadastrado.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {affiliates.map((aff, i) => (
            <div key={aff.id || i} style={{
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 16,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{aff.name}</div>
                <div style={{ fontSize: 12, color: C.primary, marginBottom: 6 }}>
                  <a href={aff.url} target="_blank" rel="noreferrer" style={{ color: C.primary }}>{aff.url}</a>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>CTA: {aff.cta}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(aff.keywords || []).map((k) => (
                    <span key={k} style={s.tag(C.textFaint)}>{k}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button style={s.btnGhost} onClick={() => startEdit(i)}>Editar</button>
                <button style={s.btnDanger} onClick={() => remove(i)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário edição/criação */}
      {editing !== null && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, marginBottom: 20 }}>
            {editing === "new" ? "Novo afiliado" : "Editar afiliado"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { key: "id", label: "ID (único, sem espaços)", placeholder: "estrategia" },
              { key: "name", label: "Nome", placeholder: "Estratégia Concursos" },
              { key: "url", label: "URL do afiliado", placeholder: "https://..." },
              { key: "cta", label: "Texto CTA", placeholder: "Conheça os cursos..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={s.fieldGroup}>
                <label style={s.label}>{label}</label>
                <input
                  style={s.input}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div style={{ ...s.fieldGroup, gridColumn: "1 / -1" }}>
              <label style={s.label}>Palavras-chave (separadas por vírgula)</label>
              <input
                style={s.input}
                placeholder="curso, apostila, questões, simulado"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={s.btn} onClick={applyEdit} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button style={s.btnGhost} onClick={cancelEdit}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ABA: CONFIGURAÇÕES GERAIS ─── */
function ConfigTab({ toast }) {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d) => { setCfg(d); setLoading(false); })
      .catch(() => { toast("Erro ao carregar configurações", "error"); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    const d = await res.json();
    setSaving(false);
    if (d.ok) toast("Configurações salvas!");
    else toast(d.error || "Erro ao salvar", "error");
  }

  if (loading || !cfg) return <p style={{ color: C.textMuted }}>Carregando configurações…</p>;

  const Field = ({ label, field, placeholder, type = "text" }) => (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      {type === "textarea" ? (
        <textarea
          rows={3}
          style={{ ...s.input, resize: "vertical" }}
          placeholder={placeholder}
          value={cfg[field] || ""}
          onChange={(e) => setCfg({ ...cfg, [field]: e.target.value })}
        />
      ) : (
        <input
          type={type}
          style={s.input}
          placeholder={placeholder}
          value={cfg[field] || ""}
          onChange={(e) => setCfg({ ...cfg, [field]: e.target.value })}
        />
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Identidade */}
      <div style={s.card}>
        <div style={{ fontWeight: 700, marginBottom: 20 }}>Identidade do blog</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Nome do blog" field="name" placeholder="Aprovado Já" />
          <Field label="URL do site" field="url" placeholder="https://..." />
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Tagline" field="tagline" placeholder="Sua tagline aqui" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Descrição" field="description" placeholder="Descrição do site..." type="textarea" />
          </div>
          <Field label="Twitter Handle" field="twitterHandle" placeholder="@aprovadoja" />
          <Field label="Google Site Verification" field="googleSiteVerification" placeholder="código de verificação" />
        </div>
      </div>

      {/* AdSense */}
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 700 }}>Google AdSense</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div style={{
              width: 40, height: 22, borderRadius: 999,
              background: cfg.adsenseEnabled ? C.green : C.border,
              position: "relative", transition: "background 0.2s", cursor: "pointer",
            }} onClick={() => setCfg({ ...cfg, adsenseEnabled: !cfg.adsenseEnabled })}>
              <div style={{
                position: "absolute", top: 3, left: cfg.adsenseEnabled ? 21 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 13, color: cfg.adsenseEnabled ? C.green : C.textMuted }}>
              {cfg.adsenseEnabled ? "Ativado" : "Desativado"}
            </span>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Publisher ID (ca-pub-...)" field="adsensePublisherId" placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
          </div>
          <Field label="Slot: Header" field="adsenseSlotHeader" placeholder="1234567890" />
          <Field label="Slot: In-Article" field="adsenseSlotInArticle" placeholder="0987654321" />
          <Field label="Slot: Sidebar" field="adsenseSlotSidebar" placeholder="1122334455" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={s.btn} onClick={handleSave} disabled={saving}>
          {saving ? "Salvando…" : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}

/* ─── INDEXAÇÃO ─── */
function IndexingTab({ toast }) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState("");

  async function runPing(mode) {
    setRunning(true);
    setOutput("⏳ Executando ping de indexação…\n");
    try {
      const res = await fetch(`/api/admin/indexing?mode=${mode}`, { method: "POST" });
      const d = await res.json();
      setOutput(d.output || d.error || "Concluído.");
    } catch (e) {
      setOutput("Erro: " + e.message);
    }
    setRunning(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={s.card}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Indexação Google / Bing</div>
        <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          Notifica os buscadores sobre posts novos. Use "Últimas 24h" após publicar conteúdo novo.
          O Google Search Console é a forma mais confiável — acesse diretamente para resultados garantidos.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={s.btn} onClick={() => runPing("new")} disabled={running}>
            {running ? "Enviando…" : "⚡ Pingar últimas 24h"}
          </button>
          <button style={s.btnGhost} onClick={() => runPing("all")} disabled={running}>
            📡 Pingar todos os posts
          </button>
          <a
            href="https://search.google.com/search-console"
            target="_blank" rel="noreferrer"
            style={{ ...s.btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            🔍 Abrir Search Console ↗
          </a>
        </div>

        {output && (
          <pre style={{
            marginTop: 20, background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: 16, fontSize: 12, color: C.textMuted,
            whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 320, overflowY: "auto",
          }}>
            {output}
          </pre>
        )}
      </div>

      <div style={s.card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Links rápidos</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["Google Search Console", "https://search.google.com/search-console"],
            ["Google Analytics", "https://analytics.google.com"],
            ["IndexNow", "https://www.indexnow.org"],
            ["PageSpeed Insights", "https://pagespeed.web.dev"],
          ].map(([label, url]) => (
            <a key={url} href={url} target="_blank" rel="noreferrer"
              style={{ color: C.primary, fontSize: 13, textDecoration: "none" }}>
              {label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ─── */
const TABS = [
  { id: "metrics", label: "📊 Métricas" },
  { id: "affiliates", label: "🔗 Afiliados" },
  { id: "config", label: "⚙️ Configurações" },
  { id: "indexing", label: "🚀 Indexação" },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("metrics");
  const [toast, setToast] = useState({ msg: "", type: "ok" });

  function showToast(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "ok" }), 3500);
  }

  // Verifica se já está autenticado (cookie)
  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((r) => {
        if (r.ok) setAuthed(true);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
  }

  if (checking) {
    return (
      <div style={{ ...s.page, ...s.center }}>
        <div style={{ color: C.textMuted }}>Verificando autenticação…</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={s.page}>
        <LoginScreen onLogin={() => setAuthed(true)} />
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 16 }}>
            <span style={{ color: C.accent }}>A</span> Admin
          </span>
          <span style={{ color: C.border }}>|</span>
          <a href="/" target="_blank" rel="noreferrer"
            style={{ color: C.textMuted, fontSize: 12, textDecoration: "none" }}>
            Ver site ↗
          </a>
        </div>
        <button style={s.btnGhost} onClick={handleLogout}>Sair</button>
      </div>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>
        {/* Sidebar */}
        <div style={{ width: 180, flexShrink: 0, marginRight: 24 }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? C.primary + "22" : "transparent",
                  color: tab === t.id ? C.primary : C.textMuted,
                  border: `1px solid ${tab === t.id ? C.primary + "44" : "transparent"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: tab === t.id ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, marginTop: 0 }}>
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          {tab === "metrics" && <MetricsTab toast={showToast} />}
          {tab === "affiliates" && <AffiliatesTab toast={showToast} />}
          {tab === "config" && <ConfigTab toast={showToast} />}
          {tab === "indexing" && <IndexingTab toast={showToast} />}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
