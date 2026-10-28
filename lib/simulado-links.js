/**
 * lib/simulado-links.js — decide, para cada artigo, se existe um simulado
 * COERENTE com o assunto e qual (banca + matéria). Sem match = sem CTA:
 * empurrar simulado em notícia de edital seria ruído, não ajuda.
 *
 * Só olha slug, título e palavra-chave (nunca o corpo), para ser previsível.
 * As matérias/bancas precisam existir em lib/quiz-bank.js; o teste garante.
 */

// matéria -> banca padrão (todas têm a matéria no banco)
const BANCA_PADRAO = {
  "Português": "FCC",
  "Raciocínio Lógico": "VUNESP",
  "Direito Constitucional": "CEBRASPE",
  "Direito Administrativo": "CEBRASPE",
  "Informática": "CEBRASPE",
};

const REGRAS_MATERIA = [
  ["Direito Constitucional", /constitucional|constituicao|direitos-fundamentais/],
  ["Direito Administrativo", /administrativ|responsabilidade-civil-do-estado|licitac|lei-8112|lei-seca/],
  ["Informática", /informatica|word-para|excel|seguranca-da-informacao/],
  ["Raciocínio Lógico", /raciocinio-logico|matematica|logica/],
  ["Português", /portugues|crase|conectivos|coesao|gramatica|ortografia|pontuacao/],
];

const BANCAS = { CEBRASPE: /cebraspe|cespe/, FGV: /\bfgv\b/, FCC: /\bfcc\b/, VUNESP: /vunesp/, IBFC: /ibfc/ };

const REGRA_ESTUDO = /revisao-espacada|pomodoro|manter-o-foco|resumos|leitura-ativa|estrategias-de-estudo|ansiedade|reta-final|cronograma|como-estudar|quais-conteudos|grupos-de-estudo|como-iniciar-a-preparacao/;
const REGRA_QUESTOES = /questoes-comentadas|questoes-gratuitas/;
const REGRA_PROVAS = /provas-anteriores|editais-e-provas/;
const NOTICIA = /o-que-mudou|concursos-ja-|panorama|boom-dos|novidades-da-semana|mudancas-recentes/;

function norm(s = "") {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const q = (o) => "/simulado?" + new URLSearchParams(o).toString() + "#montar";

function getSimuladoCta({ slug = "", title = "", targetKeyword = "" } = {}) {
  const sl = norm(slug);
  const texto = `${sl} ${norm(title)} ${norm(targetKeyword)}`;

  // 1) provas anteriores/gabaritos -> hub de fontes oficiais
  if (REGRA_PROVAS.test(sl)) {
    return { tipo: "provas", href: "/simulado#provas-oficiais", titulo: "Provas e gabaritos oficiais, num só lugar",
      texto: "No simulado do Passeja você encontra os portais das bancas e acervos gratuitos de provas anteriores com gabarito, além de questões comentadas para treinar.",
      botao: "Ver provas e gabaritos" };
  }

  // 2) matéria específica (vence a notícia: "Cebraspe contratada" não entra aqui)
  if (!NOTICIA.test(sl)) {
    for (const [materia, re] of REGRAS_MATERIA) {
      if (re.test(sl)) {
        // artigo de banca específica + matéria: respeita a banca citada, se existir no banco
        const citadas = Object.entries(BANCAS).filter(([, r]) => r.test(texto)).map(([b]) => b);
        const banca = citadas.length === 1 && bancaTemMateria(citadas[0], materia) ? citadas[0] : BANCA_PADRAO[materia];
        return { tipo: "materia", banca, materia, href: q({ banca, materia }),
          titulo: `Pratique ${materia} agora`,
          texto: `Questões no estilo ${nomeBanca(banca)}, com gabarito comentado e o artigo ou a regra que fundamenta cada resposta. Grátis e sem cadastro.`,
          botao: `Fazer simulado de ${materia}` };
      }
    }
  }

  // 3) artigo que cita UMA banca no título/slug (inclusive notícia: "contrata a FGV")
  const citadas = Object.entries(BANCAS).filter(([, r]) => r.test(texto)).map(([b]) => b);
  if (citadas.length === 1) {
    const banca = citadas[0];
    return { tipo: "banca", banca, href: q({ banca }),
      titulo: `Treine no estilo ${nomeBanca(banca)}`,
      texto: banca === "CEBRASPE"
        ? "O Cebraspe cobra itens Certo/Errado, e em alguns editais um erro anula um acerto. Treine nesse formato, com nota líquida e gabarito comentado."
        : `Um simulado completo no estilo ${nomeBanca(banca)}, com cronômetro opcional e gabarito comentado.`,
      botao: `Simulado ${nomeBanca(banca)}` };
  }

  // 4) questões comentadas e métodos de estudo -> desafio do dia
  if (!NOTICIA.test(sl) && (REGRA_QUESTOES.test(sl) || REGRA_ESTUDO.test(sl))) {
    return { tipo: "geral", href: "/simulado#desafio", titulo: "Teste o que você estudou em 3 minutos",
      texto: "O Desafio do dia tem 5 questões com gabarito comentado. O que você errar vai para uma fila de revisão, e estudar um pouco todo dia mantém sua sequência.",
      botao: "Fazer o Desafio do dia" };
  }

  return null;
}

function nomeBanca(b) { return b === "CEBRASPE" ? "Cebraspe" : b === "VUNESP" ? "Vunesp" : b; }
function bancaTemMateria(banca, materia) {
  const mapa = {
    CEBRASPE: ["Português", "Raciocínio Lógico", "Direito Constitucional", "Direito Administrativo", "Informática"],
    FGV: ["Português", "Direito Constitucional", "Direito Administrativo", "Raciocínio Lógico"],
    FCC: ["Português", "Direito Constitucional", "Direito Administrativo", "Informática"],
    VUNESP: ["Português", "Raciocínio Lógico", "Direito Administrativo", "Informática"],
    IBFC: ["Português", "Raciocínio Lógico", "Direito Constitucional", "Informática"],
  };
  return (mapa[banca] || []).includes(materia);
}

module.exports = { getSimuladoCta, BANCA_PADRAO };
