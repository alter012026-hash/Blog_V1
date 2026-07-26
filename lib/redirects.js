/**
 * Fonte única da verdade para os redirects 301 de posts removidos.
 *
 * Por que este módulo existe:
 * Toda vez que um post é apagado por sobreposição temática (ver
 * scripts/detect-topic-overlap.js) ou por duplicação (ver DEDUP-*.md),
 * criamos um redirect 301 do slug antigo para o slug que ficou no ar.
 * O bug histórico foi: o redirect era criado, mas o arquivo .md antigo
 * às vezes não era apagado de posts/ — e como sitemap.js e lib/posts.js
 * não sabiam da existência desses redirects, o slug fantasma continuava
 * sendo servido, indexado e listado, brigando pela mesma palavra-chave
 * com a página que deveria ficar sozinha no ar.
 *
 * A partir de agora, next.config.js gera os redirects a partir daqui, e
 * lib/posts.js usa REDIRECTED_SLUGS para filtrar qualquer .md fantasma
 * automaticamente — mesmo que alguém esqueça de apagar o arquivo no
 * futuro, ele nunca mais aparece no sitemap, nas categorias, na busca
 * interna ou nos relacionados.
 */

const REDIRECTS = [
  {
    source: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-dicas-praticas',
    destination: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-guia-atualizado',
  },
  {
    source: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico',
    destination: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-guia-atualizado',
  },
  {
    source: '/blog/como-organizar-rotina-de-estudos-para-concurso',
    destination: '/blog/como-organizar-rotina-de-estudos-para-concurso-dicas-praticas',
  },
  {
    source: '/blog/cronograma-de-estudos-para-quem-trabalha-estrategias-praticas-e-mensuraveis',
    destination: '/blog/cronograma-de-estudos-para-quem-trabalha',
  },
  {
    source: '/blog/cronograma-de-estudos-para-quem-trabalha-estrategia-pratica-e-mensuravel',
    destination: '/blog/cronograma-de-estudos-para-quem-trabalha',
  },
  {
    source: '/blog/carreira-policial-federal-requisitos-e-preparacao',
    destination: '/blog/carreira-policial-federal-requisitos-e-preparacao-o-que-mudou-em-2026',
  },
  {
    source: '/blog/como-resolver-questoes-de-raciocinio-logico-em-concursos',
    destination: '/blog/como-resolver-questoes-de-raciocinio-logico-em-concursos-dicas-praticas',
  },
  {
    source: '/blog/estrategia-para-questoes-de-portugues-em-concursos-publicos',
    destination: '/blog/estrategia-para-questoes-de-portugues-em-concursos-publicos-guia-atualizado',
  },
  {
    source: '/blog/melhores-concursos-para-iniciantes-em-2026',
    destination: '/blog/melhores-concursos-para-iniciantes-em-2026-o-que-mudou-neste-ano',
  },
  {
    source: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico',
    destination: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico-dicas-pratica',
  },
  {
    source: '/blog/melhores-apostilas-gratuitas-para-concursos-publicos',
    destination: '/blog/melhores-apostilas-gratuitas-para-concursos-publicos-passo-a-passo',
  },
  {
    source: '/blog/carreira-no-inss-como-funciona',
    destination: '/blog/carreira-no-inss-como-funciona-guia-atualizado',
  },
  {
    source: '/blog/como-gabaritar-questoes-de-direito-constitucional',
    destination: '/blog/como-gabaritar-questoes-de-direito-constitucional-guia-atualizado',
  },
  {
    source: '/blog/concursos-da-area-de-saude-com-inscricoes-abertas-passo-a-passo',
    destination: '/blog/concursos-da-area-de-saude-com-inscricoes-abertas',
  },
  {
    source: '/blog/glossario-de-termos-comuns-em-editais-publicos',
    destination: '/blog/glossario-de-termos-comuns-em-editais-publicos-dicas-praticas',
  },
  {
    source: '/blog/sites-com-questoes-comentadas-gratuitas-para-concursos',
    destination: '/blog/sites-com-questoes-comentadas-gratuitas-para-concursos-passo-a-passo',
  },
  {
    source: '/blog/tecnicas-de-leitura-ativa-para-concurseiros',
    destination: '/blog/tecnicas-de-leitura-ativa-para-concurseiros-dicas-praticas',
  },

  // Redirects adicionados em 2026-07-11 — segunda rodada de limpeza de
  // duplicatas (ver DEDUP-2026-07-11.md).
  {
    source: '/blog/cronograma-de-estudos-para-concurso-em-6-meses',
    destination: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-guia-atualizado',
  },
  {
    source: '/blog/tecnicas-para-questoes-de-matematica-financeira-em-concursos',
    destination: '/blog/tecnicas-avancadas-para-questoes-de-matematica-financeira-em-concursos',
  },
  {
    source: '/blog/melhores-apostilas-gratas-para-concursos-publicos-o-que-mudou-em-2026',
    destination: '/blog/melhores-apostilas-gratuitas-para-concursos-publicos-passo-a-passo',
  },
  {
    source: '/blog/concursos-publicos-com-mais-vagas-para-nivel-medio',
    destination: '/blog/concursos-publicos-com-mais-vagas-para-nivel-medio-passo-a-passo-estrategico',
  },
  {
    source: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico-o-que-mudou-e',
    destination: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico-dicas-pratica',
  },
];

// Lista plana de slugs (sem "/blog/") que têm redirect — usada por
// lib/posts.js para filtrar qualquer .md fantasma automaticamente.
const REDIRECTED_SLUGS = new Set(
  REDIRECTS.map(r => r.source.replace(/^\/blog\//, ''))
);

module.exports = { REDIRECTS, REDIRECTED_SLUGS };
