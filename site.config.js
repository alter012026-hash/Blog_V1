// ============================================================
// CONFIGURAÇÃO CENTRAL DO BLOG
// Nicho: Concursos Públicos
// ============================================================

const siteConfig = {
  // --- IDENTIDADE DO BLOG ---
  name: "Passeja Concursos",
  tagline: "Estratégias, editais e preparação para sua aprovação",
  description:
    "Conteúdo completo sobre concursos públicos, editais, técnicas de estudo, materiais gratuitos e dicas para conquistar sua vaga.",
  url: "https://passejaconcursos.com.br",
  locale: "pt_BR",
  language: "pt-BR",

  // --- NICHO ---
  niche: "concursos públicos",

  keywords: [
    "concursos públicos",
    "edital",
    "apostila para concurso",
    "como passar em concurso",
    "técnicas de estudo",
    "concurso prefeitura",
    "concurso federal",
    "concurso polícia",
    "concurso bancário",
    "cronograma de estudos",
    "questões comentadas",
    "aprovação em concurso",
  ],

  // --- AUTOR ---
  author: {
    name: "Equipe Aprovado Já",
    bio: "Especialistas em preparação para concursos públicos e técnicas de aprendizagem.",
    avatar: "/avatar.jpg",
  },

  // --- AFILIADOS ---
  affiliates: [
    {
      id: "gran",
      name: "Gran Cursos",
      url: "https://mais.app/Vt6W6u",
      keywords: ["concursos públicos", "curso online", "questões comentadas"],
      cta: "Estude com o Gran Cursos",
    },
    {
      id: "Elite Concursos",
      name: "Elite Concursos",
      url: "https://go.hotmart.com/E106521171F?dp=1",
      keywords: ["curso", "apostilas", "pdf"],
      cta: "",
    },
  ],

  // --- ADSENSE ---
  adsense: {
    enabled: true,
    publisherId: "ca-pub-5977321239837606",
    slots: {
      header: "1234567890",
      inArticle: "0987654321",
      sidebar: "1122334455",
    },
  },

  // --- GERAÇÃO DE ARTIGOS (🔥 OTIMIZADO PARA NÃO ESTOURAR API) ---
  generation: {
    // 🔴 PRINCIPAL AJUSTE (evita 429)
    articlesPerRun: 1,

    tone:
      "didático, direto e estratégico — como um mentor experiente em concursos públicos",

    audienceLevel: "iniciante a intermediário",

    // 🔥 reduz custo de tokens
    minWords: 1200,

    categories: [
      "Editais",
      "Técnicas de Estudo",
      "Concursos Abertos",
      "Materiais Gratuitos",
      "Cronograma de Estudos",
      "Carreiras Públicas",
      "Questões Comentadas",
      "Informática para Concursos",
      "Redação e Discursiva",
      "Direito Administrativo",
      "Concursos de Tribunais",
    ],
  },

  // --- SEO ---
  seo: {
    twitterHandle: "@aprovadoja",
    ogImage: "/og-default.jpg",
    googleSiteVerification: "EMQ4ibn6YHecVCgCRbTG-HMfXdtS7hnhXZj1clWB5HE",
    
  },

  // --- MENU ---
  navigation: [
    { label: "Início", href: "/" },
    { label: "Concursos Abertos", href: "/blog?categoria=Concursos+Abertos" },
    { label: "Editais", href: "/blog?categoria=Editais" },
    { label: "🎯 Simulado", href: "/simulado" },
    { label: "Técnicas de Estudo", href: "/blog?categoria=Técnicas+de+Estudo" },
    { label: "Materiais Gratuitos", href: "/blog?categoria=Materiais+Gratuitos" },
    { label: "Carreiras Públicas", href: "/blog?categoria=Carreiras+Públicas" },
    { label: "Sobre", href: "/sobre" },
  ],
};

export default siteConfig;