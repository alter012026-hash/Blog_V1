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

      // Redirects adicionados em 2026-07-11 — segunda rodada de limpeza de
      // duplicatas (ver DEDUP-2026-07-11.md). Os arquivos-fonte abaixo já
      // não existem mais em posts/.
      {
        source: '/blog/cronograma-de-estudos-para-concurso-em-6-meses',
        destination: '/blog/como-montar-cronograma-de-estudos-para-concurso-publico-guia-atualizado',
        permanent: true,
      },
      {
        source: '/blog/tecnicas-para-questoes-de-matematica-financeira-em-concursos',
        destination: '/blog/tecnicas-avancadas-para-questoes-de-matematica-financeira-em-concursos',
        permanent: true,
      },
      {
        source: '/blog/melhores-apostilas-gratas-para-concursos-publicos-o-que-mudou-em-2026',
        destination: '/blog/melhores-apostilas-gratuitas-para-concursos-publicos-passo-a-passo',
        permanent: true,
      },
      {
        source: '/blog/concursos-publicos-com-mais-vagas-para-nivel-medio',
        destination: '/blog/concursos-publicos-com-mais-vagas-para-nivel-medio-passo-a-passo-estrategico',
        permanent: true,
      },
      {
        source: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico-o-que-mudou-e',
        destination: '/blog/diferencas-entre-cargos-de-nivel-medio-e-superior-no-setor-publico-dicas-pratica',
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    // CSP: permite apenas os domínios que o site realmente usa.
    // 'unsafe-inline' em script-src é necessário pelo script inline de tema
    // em app/layout.js (troca de dark/light antes do paint) — ele não usa
    // dados do usuário, só localStorage, então o risco é baixo. Se um nonce
    // for adicionado no futuro, dá pra remover o 'unsafe-inline'.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://vitals.vercel-insights.com",
      "frame-src 'self' https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
