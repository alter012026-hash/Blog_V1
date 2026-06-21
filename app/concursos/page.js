"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const estados = [
  { uf: "sp", nome: "São Paulo" },
  { uf: "mg", nome: "Minas Gerais" },
  { uf: "rj", nome: "Rio de Janeiro" },
  { uf: "ba", nome: "Bahia" },
  { uf: "pr", nome: "Paraná" },
  { uf: "rs", nome: "Rio Grande do Sul" },
  { uf: "df", nome: "Distrito Federal" },
];

export default function ConcursosPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = {};

      for (const estado of estados) {
        try {
          const res = await fetch(`https://concursos-api.deno.dev/${estado.uf}`);
          const json = await res.json();

          result[estado.uf] = {
            nome: estado.nome,
            abertos: json.concursos_abertos?.length || 0,
            previstos: json.concursos_previstos?.length || 0,
          };
        } catch (err) {
          result[estado.uf] = {
            nome: estado.nome,
            abertos: 0,
            previstos: 0,
          };
        }
      }

      setData(result);
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <>
      <Header posts={[]} />
      <main className="section section--light">
      <div className="container">

        <h1 className="section-title">
          Concursos por Estado no Brasil
        </h1>

        <p style={{ marginBottom: "32px", color: "var(--text-secondary)" }}>
          Dados atualizados com concursos abertos e previstos por estado.
        </p>

        {loading ? (
          <p>Carregando dados...</p>
        ) : (
          <div className="posts-grid">

            {Object.entries(data).map(([uf, info]) => (
              <div key={uf} className="post-card">

                <div className="post-card-meta">
                  <span className="post-card-category">{uf.toUpperCase()}</span>
                </div>

                <h2 className="post-card-title">
                  {info.nome}
                </h2>

                <p className="post-card-excerpt">
                  Concursos abertos: <strong>{info.abertos}</strong><br />
                  Concursos previstos: <strong>{info.previstos}</strong>
                </p>

              </div>
            ))}

          </div>
        )}

      </div>
      </main>
      <Footer />
    </>
  );
}