
import Link from "next/link";
import config from "../../site.config";

export const metadata = {
  title: `Sobre - ${config.name}`,
  description: `Conheça o ${config.name}`,
};

export default function SobrePage() {
  return (
    <main className="section section--light">
      <div className="container article-layout">
        <article className="prose">

          <h1>Sobre</h1>

          <p>
            O <strong>{config.name}</strong> é um projeto focado em conteúdos sobre concursos públicos,
            com foco em estudo estratégico e aprovação.
          </p>

          <h2>Objetivo</h2>
          <p>
            Ajudar candidatos a estudarem de forma mais inteligente e organizada.
          </p>

          <Link href="/" className="hero-cta">
            Voltar para início
          </Link>

        </article>
      </div>
    </main>
  );
}