import Link from "next/link";
import config from "../../site.config";

export const metadata = {
  title: `Sobre - ${config.name}`,
  description: `Conheça o propósito e a missão do ${config.name}`,
};

export default function SobrePage() {
  return (
    <main className="section section--light">
      <div className="container article-layout">

        <article className="prose">

          {/* HERO DA PÁGINA */}
          <header>
            <h1>Sobre o projeto</h1>
            <p className="article-excerpt">
              Um portal focado em transformar estudos para concursos em algo mais estratégico, leve e eficiente.
            </p>
          </header>

          <hr className="article-divider" />

          {/* BLOCO 1 */}
          <h2>O que é este site?</h2>
          <p>
            O <strong>{config.name}</strong> é um blog especializado em concursos públicos,
            criado para ajudar candidatos a estudarem com mais clareza e direção.
          </p>

          <p>
            Aqui você encontra conteúdos práticos, diretos e aplicáveis — sem enrolação.
          </p>

          {/* BLOCO 2 */}
          <h2>Nosso foco</h2>
          <ul>
            <li>Estratégias reais de aprovação</li>
            <li>Organização de estudos</li>
            <li>Interpretação de editais</li>
            <li>Técnicas de memorização</li>
          </ul>

          {/* BLOCO 3 */}
          <h2>Como criamos o conteúdo</h2>
          <p>
            Os artigos são estruturados para leitura rápida e aplicação imediata.
            A ideia é reduzir o tempo desperdiçado com métodos pouco eficientes.
          </p>

          <blockquote>
            “Estudar melhor é mais importante do que estudar mais horas.”
          </blockquote>

          {/* BLOCO 4 */}
          <h2>Para quem é isso?</h2>
          <p>
            Para quem está começando ou já estuda há algum tempo, mas sente que não está evoluindo
            na velocidade que deveria.
          </p>

          {/* CTA FINAL */}
          <div className="related-posts">
            <h3>Comece por aqui</h3>

            <Link href="/" className="hero-cta">
              Voltar para página inicial →
            </Link>
          </div>

        </article>

      </div>
    </main>
  );
}