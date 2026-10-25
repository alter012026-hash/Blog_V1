import Link from "next/link";
import config from "../../site.config";
import { CookiePrefsButton } from "../../components/ConsentBanner";

export const metadata = {
  title: `Política de Privacidade - ${config.name}`,
  description: `Como o ${config.name} trata dados pessoais, cookies e publicidade personalizada, em conformidade com a LGPD.`,
};

export default function PrivacidadePage() {
  const lastUpdated = "25 de outubro de 2026";

  return (
    <>
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
                Analytics. Eventos de uso do simulado, busca, newsletter, afiliados e links de
                fontes podem incluir identificadores não pessoais da página ou parceiro; não
                enviamos e-mail, nome ou consulta digitada nesses eventos.
              </li>
              <li>
                <strong>Estatísticas próprias de visitas (sem cookies):</strong> contamos
                visualizações, tempo de leitura, rolagem, tipo de aparelho, navegador, origem do
                acesso e país/estado/cidade aproximados. Para todos os visitantes isso é feito sem
                cookies e sem guardar o seu endereço IP: o visitante é representado por um código
                diário irreversível, que muda a cada dia e não permite identificar você.
              </li>
              <li>
                <strong>Estatísticas por visita (com cookies, só se você aceitar):</strong> se você
                aceitar os cookies de estatística, registramos também como a sua visita acontece
                e se você volta ao site. Os detalhes estão na seção{" "}
                <a href="#cookies">Cookies de estatística e a sua escolha</a>.
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
              <li>
                <strong>Consentimento da newsletter:</strong> a inscrição exige confirmação
                explícita. Registramos a origem da página e a data do evento de confirmação de
                forma agregada, sem incluir o e-mail nos eventos analíticos.
              </li>
            </ul>
            <p>
              Não coletamos dados sensíveis (saúde, origem racial, opinião política, etc.) e não
              vendemos dados pessoais a terceiros.
            </p>
          </div>

          {/* BLOCO 2B — COOKIES DE ESTATÍSTICA */}
          <div className="reveal" id="cookies">
            <h2>Cookies de estatística e a sua escolha</h2>
            <p>
              Na primeira visita mostramos um aviso para você <strong>aceitar ou recusar</strong>{" "}
              os cookies de estatística. Eles não são necessários para ler o site: se você
              recusar, tudo continua funcionando normalmente. A base legal é o seu consentimento
              (LGPD, art. 7º, inciso I).
            </p>
            <ul className="reveal-stagger">
              <li>
                <code>pj_consent</code> — guarda a sua escolha (aceitar ou recusar). Dura 6 meses.
                É criado quando você escolhe e é o único que existe se você recusar.
              </li>
              <li>
                <code>pj_vid</code> — código aleatório do visitante, para sabermos se a mesma
                pessoa voltou ao site. Dura 12 meses. <strong>Só é criado se você aceitar.</strong>
              </li>
              <li>
                <code>pj_sid</code> — código aleatório da visita, para juntar as páginas lidas na
                mesma visita. Expira após 30 minutos sem atividade.{" "}
                <strong>Só é criado se você aceitar.</strong>
              </li>
            </ul>
            <p>
              <strong>O que registramos de uma visita, se você aceitar:</strong> as páginas
              abertas e o horário, o tempo e quanto de cada página foi lido, o site de origem, o
              aparelho, o navegador, o sistema e o país/estado/cidade aproximados (deduzidos do
              seu IP no momento do acesso; o IP em si não é guardado) e as ações feitas no site:
              clicar em link de afiliado, em fonte oficial ou em artigo relacionado, iniciar ou
              concluir um simulado, começar ou concluir a inscrição na newsletter e usar a busca.
              Não gravamos o que você digita na busca, nem seu nome ou e-mail, e o código de
              visitante não é ligado ao e-mail da newsletter.
            </p>
            <p>
              <strong>Para que usamos:</strong> somente para entender o que funciona no site e
              melhorar os conteúdos. Os dados ficam em um painel restrito à nossa equipe,
              armazenados em um provedor de banco de dados (Upstash, via Vercel), que atua como
              operador.
            </p>
            <p>
              <strong>Por quanto tempo:</strong> o detalhe de cada visita é apagado
              automaticamente em até 90 dias; o código do visitante, em até 12 meses; as contagens
              somadas (números que não apontam para você), em até 13 meses.
            </p>
            <p>
              <strong>Mudar de ideia:</strong> a qualquer momento, pelo botão abaixo ou pelo link
              “Preferências de cookies” no rodapé de qualquer página. Se você recusar depois de ter
              aceitado, removemos os cookies do seu navegador e apagamos as visitas individuais
              ligadas ao seu código.
            </p>
            <p>
              <CookiePrefsButton className="linkbtn">Abrir preferências de cookies</CookiePrefsButton>
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
              <li>
                Revogação do consentimento (por exemplo, cancelar a newsletter ou recusar os
                cookies de estatística pelo link no rodapé);
              </li>
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
    </>
  );
}
