import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ScrollReveal from "../../components/ScrollReveal";
import { getSearchIndex } from "../../lib/search-index";
import config from "../../site.config";

export const metadata = {
  title: `Metodologia - ${config.name}`,
  description: `Como o ${config.name} produz, revisa e mantém seu conteúdo sobre concursos públicos.`,
};

export default function MetodologiaPage() {
  const searchIndex = getSearchIndex();

  return (
    <>
      <ScrollReveal />
      <Header posts={searchIndex} />
      <main className="section section--light">
      <div className="container article-layout">

        <article className="prose">

          {/* HERO DA PÁGINA */}
          <header className="reveal">
            <h1>Como produzimos nosso conteúdo</h1>
            <p className="article-excerpt">
              {config.methodology.summary}
            </p>
          </header>

          <hr className="article-divider" />

          {/* BLOCO 1 — o que somos */}
          <div className="reveal">
            <h2>Quem assina o conteúdo</h2>
            <p>
              Os artigos do <strong>{config.name}</strong> são publicados sob a assinatura{" "}
              <strong>{config.author.name}</strong> — nossa identidade editorial. Não é o nome de
              uma pessoa específica: é o processo de curadoria, produção e revisão que fica por
              trás de cada artigo antes de ele ir para o ar.
            </p>
            <p>
              Preferimos essa transparência a inventar um "especialista" fictício só pra parecer
              mais confiável. Se um dia um autor humano assinar um artigo específico com nome e
              credencial, isso vai aparecer explicitamente naquele texto.
            </p>
          </div>

          {/* BLOCO 2 — o processo */}
          <div className="reveal">
            <h2>Como cada artigo é feito</h2>
            <ul className="reveal-stagger">
              <li><strong>Curadoria de fontes oficiais</strong> — editais, Diário Oficial, texto de lei e informações de bancas organizadoras são a base de partida.</li>
              <li><strong>Produção com apoio de inteligência artificial</strong> — o texto é redigido com ferramentas de IA a partir dessas fontes.</li>
              <li><strong>Checagem antes da publicação</strong> — o conteúdo passa por revisão de estrutura, coerência e aderência às fontes citadas antes de ficar disponível no site.</li>
            </ul>
          </div>

          {/* BLOCO 3 — limites e correções */}
          <div className="reveal">
            <h2>Limites e como corrigimos erros</h2>
            <p>
              Editais e regras de concursos mudam com frequência, e conteúdo gerado com apoio de
              IA pode conter imprecisões. Por isso, recomendamos sempre confirmar prazos, datas e
              exigências no edital oficial do concurso antes de tomar qualquer decisão baseada em
              um dos nossos artigos.
            </p>
            <p>
              Se você encontrar uma informação desatualizada ou incorreta, avise a gente — toda
              correção reportada é revisada e, quando procede, corrigida no artigo.
            </p>
          </div>

          {/* BLOCO 4 — por que fazemos assim */}
          <div className="reveal">
            <h2>Por que trabalhamos assim</h2>
            <p>
              Concursos públicos têm um volume enorme de editais, bancas e mudanças de regra
              acontecendo o tempo todo. Usar IA com curadoria de fontes oficiais nos permite
              cobrir mais desses temas, mais rápido, do que um processo 100% manual conseguiria —
              sem abrir mão de revisão antes de publicar.
            </p>
          </div>

          {/* CTA FINAL */}
          <div className="related-posts reveal">
            <h3>Quer saber mais sobre o projeto?</h3>

            <Link href="/sobre" className="hero-cta">
              Conheça o Passeja Concursos →
            </Link>
          </div>

        </article>

      </div>
      </main>
      <Footer />
    </>
  );
}
