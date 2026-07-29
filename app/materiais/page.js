import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ScrollReveal from "../../components/ScrollReveal";
import { getSearchIndex } from "../../lib/search-index";
import config from "../../site.config";

const DRIVE_URL =
  "https://drive.google.com/drive/folders/0BwccoUMMXi76c01IUnAwRGlNM1U?resourcekey=0-264mjoVSmCeBWs50z9aZ8Q&usp=drive_link";

export const metadata = {
  title: `Materiais Gratuitos para Concursos - ${config.name}`,
  description:
    "Acesse gratuitamente videoaulas, apostilas em PDF e resumos para concursos públicos. Baixe e comece a estudar agora mesmo.",
};

const itens = [
  {
    icon: "🎥",
    titulo: "Videoaulas",
    texto:
      "Aulas gravadas cobrindo as principais matérias cobradas em concursos, do básico ao avançado.",
  },
  {
    icon: "📄",
    titulo: "Apostilas em PDF",
    texto:
      "Materiais em PDF prontos para baixar, imprimir ou estudar direto do celular, organizados por assunto.",
  },
  {
    icon: "📝",
    titulo: "Resumos e Esquemas",
    texto:
      "Resumos objetivos e mapas mentais para revisar rapidamente antes da prova.",
  },
  {
    icon: "📚",
    titulo: "Legislação e Editais",
    texto:
      "Textos de lei, súmulas e materiais de apoio úteis para interpretar editais com mais segurança.",
  },
];

const passos = [
  {
    numero: "1",
    titulo: "Clique no botão de acesso",
    texto: "Você será redirecionado para a pasta pública no Google Drive.",
  },
  {
    numero: "2",
    titulo: "Navegue pelas pastas",
    texto:
      "O material está organizado por tema — explore à vontade e escolha o que precisa agora.",
  },
  {
    numero: "3",
    titulo: "Baixe ou visualize online",
    texto:
      "Você pode baixar os arquivos ou abrir direto no navegador, sem precisar de login.",
  },
];

export default function MateriaisPage() {
  const searchIndex = getSearchIndex();

  return (
    <>
      <ScrollReveal />
      <Header posts={searchIndex} />

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="hero-seal" aria-hidden="true">
            <span className="hero-seal-text">Material<br />Gratuito</span>
          </div>
          <div className="container">
            <p className="hero-eyebrow">100% gratuito · sem cadastro</p>
            <h1>
              Videoaulas e apostilas<br />
              para <em>estudar sem gastar nada</em>
            </h1>
            <p className="hero-desc">
              Reunimos videoaulas, apostilas em PDF, resumos e materiais de apoio
              para concursos públicos em um só lugar. É só acessar a pasta e
              baixar o que você precisar — sem cadastro, sem custo.
            </p>
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta"
            >
              Acessar materiais no Google Drive →
            </a>
          </div>
        </section>

        {/* O QUE TEM DENTRO */}
        <section className="section section--light reveal">
          <div className="container">
            <div className="section-header">
              <p className="section-label">O que você vai encontrar</p>
              <h2 className="section-title">Conteúdo para todas as fases do estudo</h2>
            </div>

            <div className="posts-grid reveal-stagger">
              {itens.map((item) => (
                <div key={item.titulo} className="curiosity-card" style={{ alignItems: "flex-start" }}>
                  <div
                    className="curiosity-card-icon"
                    style={{ fontSize: "1.3rem", background: "rgba(169,50,38,0.10)" }}
                  >
                    {item.icon}
                  </div>
                  <div className="curiosity-card-body">
                    <p className="curiosity-card-title">{item.titulo}</p>
                    <p className="curiosity-card-text">{item.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA CENTRAL REFORÇADO */}
        <section className="section section--alt reveal">
          <div className="container">
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
                borderRadius: "var(--radius-xl)", padding: "36px 40px",
                textDecoration: "none", color: "#fff", gap: 24, flexWrap: "wrap",
                boxShadow: "var(--shadow-lg)", position: "relative", overflow: "hidden"
              }}
            >
              <div style={{
                position: "absolute", top: -40, right: -40, width: 200, height: 200,
                background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none"
              }} />
              <div>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.75, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  ✦ Acesso livre
                </p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.3rem,3vw,1.8rem)", fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
                  📁 Pasta completa de materiais
                </h2>
                <p style={{ opacity: 0.88, maxWidth: 480, lineHeight: 1.6, fontSize: "0.95rem" }}>
                  Vídeos, PDFs e resumos organizados por assunto. Abra no navegador ou no
                  app do Google Drive, no computador ou no celular.
                </p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.15)", borderRadius: "var(--radius)",
                padding: "14px 28px", fontWeight: 700, fontSize: "1rem",
                whiteSpace: "nowrap", backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.25)", flexShrink: 0
              }}>
                Abrir pasta →
              </div>
            </a>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="section section--light reveal">
          <div className="container">
            <div className="section-header">
              <p className="section-label">Como funciona</p>
              <h2 className="section-title">Três passos simples</h2>
            </div>

            <div className="posts-grid reveal-stagger">
              {passos.map((passo) => (
                <div key={passo.numero} className="post-card" style={{ cursor: "default" }}>
                  <div className="post-card-meta">
                    <span className="post-card-category">Passo {passo.numero}</span>
                  </div>
                  <h3 className="post-card-title">{passo.titulo}</h3>
                  <p className="post-card-excerpt">{passo.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AVISO / TRANSPARÊNCIA */}
        <section className="section section--alt reveal">
          <div className="container article-layout">
            <div className="prose" style={{ textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                Os materiais reunidos aqui têm caráter complementar e colaborativo.
                Sempre confira o edital oficial do seu concurso para confirmar o
                conteúdo programático antes de estudar por qualquer material.
                Encontrou um link quebrado ou quer sugerir um material?{" "}
                <Link href="/contato">Fale com a gente</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="section section--light reveal">
          <div className="container" style={{ textAlign: "center" }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>
              Pronto para começar a estudar?
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 28, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              O material está te esperando. Acesse agora e comece pelo tópico que
              você mais precisa reforçar.
            </p>
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta"
            >
              Acessar materiais gratuitos →
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
