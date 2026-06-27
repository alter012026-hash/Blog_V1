/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Caso queira usar imagens próprias por URL futuramente
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
    ],
  },

  // Redirects 301 — posts removidos por sobreposição temática (mesmo
  // assunto de outro post já existente, ver scripts/detect-topic-overlap.js).
  // Mantém o SEO/links antigos apontando pro post que ficou no ar.
  async redirects() {
    return [
      {
        source: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-dicas-praticas',
        destination: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-guia-atualizado',
        permanent: true,
      },
      {
        source: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico',
        destination: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-guia-atualizado',
        permanent: true,
      },
      {
        source: '/blog/como-organizar-rotina-de-estudos-para-concurso',
        destination: '/blog/como-organizar-rotina-de-estudos-para-concurso-dicas-praticas',
        permanent: true,
      },
      {
        source: '/blog/cronograma-de-estudos-para-quem-trabalha-estrategias-praticas-e-mensuraveis',
        destination: '/blog/cronograma-de-estudos-para-quem-trabalha',
        permanent: true,
      },
      {
        source: '/blog/cronograma-de-estudos-para-quem-trabalha-estrategia-pratica-e-mensuravel',
        destination: '/blog/cronograma-de-estudos-para-quem-trabalha',
        permanent: true,
      },
      {
        source: '/blog/carreira-policial-federal-requisitos-e-preparacao',
        destination: '/blog/carreira-policial-federal-requisitos-e-preparacao-o-que-mudou-em-2026',
        permanent: true,
      },
      {
        source: '/blog/como-resolver-questoes-de-raciocinio-logico-em-concursos',
        destination: '/blog/como-resolver-questoes-de-raciocinio-logico-em-concursos-dicas-praticas',
        permanent: true,
      },
      {
        source: '/blog/estrategia-para-questoes-de-portugues-em-concursos-publicos',
        destination: '/blog/estrategia-para-questoes-de-portugues-em-concursos-publicos-guia-atualizado',
        permanent: true,
      },
      {
        source: '/blog/melhores-concursos-para-iniciantes-em-2026',
        destination: '/blog/melhores-concursos-para-iniciantes-em-2026-o-que-mudou-neste-ano',
        permanent: true,
      },
      {
        source: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico',
        destination: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico-dicas-pratica',
        permanent: true,
      },
      {
        source: '/blog/melhores-apostilas-gratuitas-para-concursos-publicos',
        destination: '/blog/melhores-apostilas-gratuitas-para-concursos-publicos-passo-a-passo',
        permanent: true,
      },
      {
        source: '/blog/carreira-no-inss-como-funciona',
        destination: '/blog/carreira-no-inss-como-funciona-guia-atualizado',
        permanent: true,
      },
      {
        source: '/blog/como-gabaritar-questoes-de-direito-constitucional',
        destination: '/blog/como-gabaritar-questoes-de-direito-constitucional-guia-atualizado',
        permanent: true,
      },
      {
        source: '/blog/concursos-da-area-de-saude-com-inscricoes-abertas-passo-a-passo',
        destination: '/blog/concursos-da-area-de-saude-com-inscricoes-abertas',
        permanent: true,
      },
      {
        source: '/blog/glossario-de-termos-comuns-em-editais-publicos',
        destination: '/blog/glossario-de-termos-comuns-em-editais-publicos-dicas-praticas',
        permanent: true,
      },
      {
        source: '/blog/sites-com-questoes-comentadas-gratuitas-para-concursos',
        destination: '/blog/sites-com-questoes-comentadas-gratuitas-para-concursos-passo-a-passo',
        permanent: true,
      },
      {
        source: '/blog/tecnicas-de-leitura-ativa-para-concurseiros',
        destination: '/blog/tecnicas-de-leitura-ativa-para-concurseiros-dicas-praticas',
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
