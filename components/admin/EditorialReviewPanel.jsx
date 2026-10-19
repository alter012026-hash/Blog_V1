"use client";

import { useCallback, useEffect, useState } from "react";

const colors = {
  background: "#080E1A",
  border: "#1F2D45",
  surface: "#111827",
  text: "#F1F5F9",
  muted: "#94A3B8",
  primary: "#3B82F6",
  green: "#10B981",
  red: "#EF4444",
};

export default function EditorialReviewPanel({ toast, onPendingCountChange }) {
  const [drafts, setDrafts] = useState([]);
  const [sources, setSources] = useState({});
  const [checks, setChecks] = useState({});
  const [reasons, setReasons] = useState({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/editorial-review");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao carregar a fila editorial.");
      const queue = Array.isArray(data.drafts) ? data.drafts : [];
      setDrafts(queue);
      onPendingCountChange?.(queue.length);
      setSources(Object.fromEntries(queue.map((draft) => [
        draft.id,
        (draft.sourceUrls || []).join("\n"),
      ])));
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [onPendingCountChange]);

  useEffect(() => { load(); }, [load]);

  function updateCheck(id, field, checked) {
    setChecks((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), [field]: checked },
    }));
  }

  async function submit(draft, action) {
    setBusyId(draft.id);
    setError("");
    try {
      const sourceList = (sources[draft.id] || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      const response = await fetch("/api/admin/editorial-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          draftId: draft.id,
          sources: sourceList,
          verifiedFacts: checks[draft.id]?.facts === true,
          verifiedOfficialSources: checks[draft.id]?.sources === true,
          reason: reasons[draft.id],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "A ação editorial falhou.");
      toast(action === "approve" ? "Artigo aprovado e enviado para publicação." : "Rascunho rejeitado.");
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20 }}>
      <div style={{ color: colors.text, fontWeight: 700, marginBottom: 6 }}>Revisão editorial ({drafts.length})</div>
      <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
        Conteúdo gerado por IA fica fora do sitemap até a aprovação. Leia o texto, confira cada fato em fontes oficiais e registre ao menos uma fonte HTTPS.
      </p>
      {error && <p role="alert" style={{ color: colors.red, fontSize: 13 }}>{error}</p>}
      {drafts.length === 0 ? (
        <p style={{ color: colors.muted, fontSize: 13 }}>Nenhum artigo aguardando revisão.</p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {drafts.map((draft) => {
            const checked = checks[draft.id] || {};
            const canApprove = checked.facts && checked.sources
              && !draft.validationIssues?.length
              && (sources[draft.id] || "").split(/\r?\n/).some((item) => item.trim().startsWith("https://"));
            return (
              <article key={draft.id} style={{ background: colors.background, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ color: colors.text, fontSize: 15, margin: 0 }}>{draft.title}</h3>
                    <p style={{ color: colors.muted, fontSize: 12, margin: "5px 0 10px" }}>
                      {draft.file} · {draft.category} · {draft.status} · {draft.generatedAt ? new Date(draft.generatedAt).toLocaleString("pt-BR") : ""}
                    </p>
                  </div>
                  <a href={`/blog/${draft.slug}`} target="_blank" rel="noreferrer" style={{ color: colors.primary, fontSize: 12 }}>
                    Conferir se a URL já existe
                  </a>
                </div>
                {draft.validationIssues?.length > 0 && (
                  <div style={{ color: colors.red, fontSize: 12, marginBottom: 10 }}>
                    Validação automática reprovada: {draft.validationIssues.join("; ")}
                  </div>
                )}
                <details style={{ marginBottom: 12 }}>
                  <summary style={{ color: colors.primary, cursor: "pointer", fontSize: 13 }}>Ler artigo completo</summary>
                  <pre style={{ color: colors.muted, whiteSpace: "pre-wrap", maxHeight: 420, overflow: "auto", fontSize: 12, lineHeight: 1.6 }}>
                    {draft.content}
                  </pre>
                </details>
                <label style={{ display: "block", color: colors.muted, fontSize: 12, marginBottom: 10 }}>
                  Fontes oficiais conferidas (uma URL HTTPS por linha)
                  <textarea
                    value={sources[draft.id] || ""}
                    onChange={(event) => setSources((current) => ({ ...current, [draft.id]: event.target.value }))}
                    rows={3}
                    style={{ display: "block", width: "100%", marginTop: 5, background: colors.background, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: 8 }}
                  />
                </label>
                <label style={{ display: "flex", gap: 8, color: colors.muted, fontSize: 12, marginBottom: 8 }}>
                  <input type="checkbox" checked={checked.facts === true} onChange={(event) => updateCheck(draft.id, "facts", event.target.checked)} />
                  Conferi afirmações factuais, datas, cargos e números no artigo.
                </label>
                <label style={{ display: "flex", gap: 8, color: colors.muted, fontSize: 12, marginBottom: 12 }}>
                  <input type="checkbox" checked={checked.sources === true} onChange={(event) => updateCheck(draft.id, "sources", event.target.checked)} />
                  Confirmei que as fontes acima são oficiais e sustentam as afirmações essenciais.
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={!canApprove || busyId === draft.id}
                    onClick={() => submit(draft, "approve")}
                    style={{ background: colors.green, border: 0, borderRadius: 7, color: "#fff", padding: "8px 12px", cursor: canApprove ? "pointer" : "not-allowed", opacity: canApprove ? 1 : 0.55 }}
                  >
                    {busyId === draft.id ? "Salvando…" : "Aprovar e publicar"}
                  </button>
                  <input
                    aria-label={`Motivo de rejeição de ${draft.title}`}
                    placeholder="Motivo obrigatório para rejeitar"
                    value={reasons[draft.id] || ""}
                    onChange={(event) => setReasons((current) => ({ ...current, [draft.id]: event.target.value }))}
                    style={{ flex: "1 1 220px", minWidth: 150, background: colors.background, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 7, padding: "8px 10px" }}
                  />
                  <button
                    type="button"
                    disabled={!reasons[draft.id]?.trim() || busyId === draft.id}
                    onClick={() => submit(draft, "reject")}
                    style={{ background: "transparent", border: `1px solid ${colors.red}`, borderRadius: 7, color: colors.red, padding: "8px 12px", cursor: "pointer" }}
                  >
                    Rejeitar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
