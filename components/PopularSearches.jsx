"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PopularSearches() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/popular-searches", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Search Console indisponível");
        return response.json();
      })
      .then(setData)
      .catch((error) => {
        if (error.name !== "AbortError") setFailed(true);
      });

    return () => controller.abort();
  }, []);

  if (failed) {
    return <p className="popular-searches-message">Os dados reais de buscas estão temporariamente indisponíveis.</p>;
  }

  if (!data) {
    return (
      <>
        <p className="popular-searches-message" role="status">Carregando dados do Google Search Console…</p>
        <ol className="popular-searches popular-searches--loading" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <li key={index}><div className="popular-search-skeleton" /></li>)}
        </ol>
      </>
    );
  }

  if (data.topics.length === 0) {
    return <p className="popular-searches-message">Ainda não há consultas de pesquisa associadas a artigos neste período.</p>;
  }

  return (
    <>
      <p className="popular-searches-period">
        Google Search Console · {data.period.startDate} a {data.period.endDate}
      </p>
      <ol className="popular-searches">
        {data.topics.map((topic, index) => (
          <li key={topic.query}>
            <Link
              className="popular-search-card"
              href={topic.path}
              aria-label={`${topic.query}: ${topic.title}`}
              style={{ "--topic-hue": topic.hue, "--topic-bar": `${Math.max(7, topic.relativeImpressions)}%` }}
            >
              <div className="popular-search-heading">
                <span className="popular-search-rank" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="popular-search-count">Busca no Google</span>
              </div>
              <h3 className="popular-search-query">{topic.query}</h3>
              <div
                className="popular-search-bar"
                role="meter"
                aria-label="Interesse relativo nesta consulta"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={topic.relativeImpressions}
              >
                <span />
              </div>
              <p className="popular-search-destination">{topic.title}</p>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
