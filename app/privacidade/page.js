import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ScrollReveal from "../../components/ScrollReveal";
import { getSearchIndex } from "../../lib/search-index";
import config from "../../site.config";

export const metadata = {
  title: `Política de Privacidade - ${config.name}`,
  description: `Como o ${config.name} trata dados pessoais, cookies e publicidade personalizada, em conformidade com a LGPD.`,
};

export default function PrivacidadePage() {
  const searchIndex = getSearchIndex();
  const lastUpdated = "26 de julho de 2026";

  return (
    <>
      <ScrollReveal />
      <Header posts={searchIndex} />
      <main className="section section--light">
      <div className="container article-layout">

        <article className="prose">

          {/* HERO DA PÁGINA */}
          <header className="reveal">
            <h1>Política de Privacidade</h1>
            <p className="article-excerpt">
              Última atualização: {lastUpdated}. Este documento explica, de forma simples, quais
              dados o {config.name} coleta, para que servem e quais escolhas você tem.
            </p>
          </header>

          <hr className="article-divider" />

          {/* BLOCO 1 */}
          <div className="reveal">
            <h2>Quem é o responsável pelo tratamento dos dados</h2>
            <p>
              O <strong>{config.name}</strong> ({config.url}) é responsável pelo tratamento dos
              dados coletados neste site, em conformidade com a Lei Geral de Proteção de Dados
              (LGPD — Lei nº 13.709/2018). Dúvidas sobre esta política podem ser enviadas pela
              nossa <Link href="/contato">página de contato</Link>.
            </p>
          </div>

          {/* BLOCO 2 */}
          <div className="reveal">
            <h2>Quais dados coletamos</h2>
            <ul className="reveal-stagger">
              <li>
                <strong>Dados de navegação:</strong> páginas visitadas, tempo de permanência,
                dispositivo e localização aproximada, coletados de forma agregada via Vercel
                Analytics.
              </li>
              <li>
                <strong>Cookies e identificadores de anúncios:</strong> usados pelo Google
                AdSense para exibir anúncios, inclusive anúncios personalizados com base no seu
                histórico de navegação (ver seção abaixo).
              </li>
              <li>
                <strong>E-mail:</strong> apenas se você se inscrever voluntariamente na nossa
                newsletter ou solicitar o resultado de um simulado. Usamos esse e-mail somente
                para o fim que você solicitou.
              </li>
            </ul>
            <p>
              Não coletamos dados sensíveis (saúde, origem racial, opinião política, etc.) e não
              vendemos dados pessoais a terceiros.
            </p>
          </div>

          {/* BLOCO 3 — ADSENSE / GOOGLE */}
          <div className="reveal">
            <h2>Publicidade e cookies do Google</h2>
            <p>
              Este site exibe anúncios fornecidos pelo <strong>Google AdSense</strong>. O Google,
              como fornecedor terceiro, usa cookies para veicular anúncios com base em visitas
              anteriores suas a este e a outros sites na internet.
            </p>
            <p>
              O uso do cookie de publicidade do Google (cookie DoubleClick) permite que ele e
              seus parceiros veiculem anúncios para você com base na sua visita a este site e/ou
              a outros sites. Você pode desativar a publicidade personalizada acessando as{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                Configurações de anúncios do Google
              </a>
              . Alternativamente, você pode desativar o uso de cookies de terceiros para
              publicidade personalizada acessando{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                www.aboutads.info/choices
              </a>
              .
            </p>
          </div>

          {/* BLOCO 4 — LINKS DE AFILIADO */}
          <div className="reveal">
            <h2>Links de afiliado</h2>
            <p>
              Alguns artigos contêm links de afiliado para cursos e plataformas parceiras. Se
              você clicar e efetuar uma compra, podemos receber uma comissão, sem qualquer custo
              adicional para você. Isso não influencia nossa avaliação editorial dos produtos
              mencionados.
            </p>
          </div>

          {/* BLOCO 5 — BASE LEGAL E DIREITOS */}
          <div className="reveal">
            <h2>Seus direitos como titular dos dados</h2>
            <p>Nos termos da LGPD, você pode solicitar a qualquer momento:</p>
            <ul className="reveal-stagger">
              <li>Confirmação da existência de tratamento dos seus dados;</li>
              <li>Acesso, correção ou exclusão dos seus dados;</li>
              <li>Revogação do consentimento (por exemplo, cancelar a newsletter);</li>
              <li>Informações sobre com quem compartilhamos seus dados.</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato pela nossa{" "}
              <Link href="/contato">página de contato</Link>.
            </p>
          </div>

          {/* BLOCO 6 — CANCELAMENTO DE NEWSLETTER */}
          <div className="reveal">
            <h2>Cancelamento da newsletter</h2>
            <p>
              Todo e-mail da nossa newsletter inclui um link de cancelamento (unsubscribe) ao
              final da mensagem. Ao clicar nele, seu e-mail é removido imediatamente da nossa
              lista de envios.
            </p>
          </div>

          {/* BLOCO 7 — ALTERAÇÕES */}
          <div className="reveal">
            <h2>Alterações a esta política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir
              mudanças legais ou no funcionamento do site. A data no topo desta página sempre
              indica a versão mais recente.
            </p>
          </div>

          {/* CTA FINAL */}
          <div className="related-posts reveal">
            <h3>Ainda tem dúvidas?</h3>
            <Link href="/contato" className="hero-cta">
              Fale com a gente →
            </Link>
          </div>

        </article>

      </div>
      </main>
      <Footer />
    </>
  );
}
