const STATUS_LABELS = {
  "inscricoes-abertas": "Inscrições abertas",
  "edital-publicado": "Edital publicado",
  "aguardando-novidades": "Aguardando novidades",
};

function parseIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { date, timestamp };
}

function formatDate(parsed) {
  return parsed.date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getSafeSource(sourceUrl) {
  if (typeof sourceUrl !== "string") return null;

  try {
    const url = new URL(sourceUrl);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export default function ContestTracker({ tracker }) {
  if (!tracker || typeof tracker !== "object") return null;

  const status = STATUS_LABELS[tracker.status];
  const nextDate = parseIsoDate(tracker.nextDate);
  const updatedAt = parseIsoDate(tracker.updatedAt);
  const sourceUrl = getSafeSource(tracker.sourceUrl);

  if (!status && !nextDate && !updatedAt && !sourceUrl) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysRemaining = nextDate
    ? Math.ceil((nextDate.timestamp - todayUtc) / 86400000)
    : null;
  const isEstimate = tracker.nextDateIsEstimate === true;

  return (
    <aside className="contest-tracker" aria-label="Acompanhamento do concurso">
      <div className="contest-tracker-top">
        <div>
          <span className="contest-tracker-eyebrow">Acompanhamento oficial</span>
          <h2 className="contest-tracker-title">Radar do concurso</h2>
        </div>
        {status && (
          <span className={`contest-tracker-status contest-tracker-status--${tracker.status}`}>
            <span className="contest-tracker-status-dot" aria-hidden="true" />
            {status}
          </span>
        )}
      </div>

      <div className="contest-tracker-content">
        <div className="contest-tracker-date">
          <span className="contest-tracker-label">
            {isEstimate ? "Previsão" : "Próxima data importante"}
          </span>
          {nextDate ? (
            <>
              <strong>{formatDate(nextDate)}</strong>
              {tracker.nextDateLabel && (
                <span className="contest-tracker-date-detail">{tracker.nextDateLabel}</span>
              )}
            </>
          ) : (
            <strong className="contest-tracker-not-set">Data não cadastrada</strong>
          )}
        </div>

        {nextDate && !isEstimate && (
          <div className="contest-tracker-countdown" aria-live="polite">
            <span className="contest-tracker-countdown-number">
              {daysRemaining > 0 ? daysRemaining : daysRemaining === 0 ? "Hoje" : "—"}
            </span>
            {daysRemaining > 0 && <span className="contest-tracker-countdown-unit">dias</span>}
            {daysRemaining < 0 && (
              <span className="contest-tracker-countdown-unit">data passada</span>
            )}
            {daysRemaining === 0 && (
              <span className="contest-tracker-countdown-unit">é o dia</span>
            )}
          </div>
        )}
      </div>

      <div className="contest-tracker-footer">
        {updatedAt && (
          <span className="contest-tracker-updated">
            Atualizado em <time dateTime={tracker.updatedAt}>{formatDate(updatedAt)}</time>
          </span>
        )}
        {sourceUrl && (
          <a
            className="contest-tracker-source"
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {tracker.sourceLabel || "Consultar fonte oficial"}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </aside>
  );
}
