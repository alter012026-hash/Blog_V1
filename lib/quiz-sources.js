/**
 * lib/quiz-sources.js
 *
 * Fontes oficiais e acervos gratuitos de provas/gabaritos, usados no hub
 * "Provas oficiais" da página /simulado.
 *
 * Por que isto existe: o simulado traz questões ORIGINAIS escritas no estilo
 * de cada banca (não copiamos o texto de provas de terceiros). Para o aluno
 * treinar com a prova de verdade e conferir o gabarito oficial, apontamos
 * para quem publica: o portal da própria banca e acervos gratuitos.
 *
 * Os links de banca são as páginas iniciais dos portais (estáveis); os
 * acervos foram conferidos em pesquisa em out/2026.
 */

const PORTAIS = {
  CEBRASPE: { label: "Portal do Cebraspe (editais, provas e gabaritos)", url: "https://www.cebraspe.org.br/concursos/" },
  FGV: { label: "FGV Conhecimento — concursos", url: "https://conhecimento.fgv.br/concursos" },
  FCC: { label: "Portal da Fundação Carlos Chagas", url: "https://www.concursosfcc.com.br/" },
  VUNESP: { label: "Portal da Vunesp", url: "https://www.vunesp.com.br/" },
  IBFC: { label: "Portal do IBFC", url: "https://www.ibfc.org.br/" },
};

const ACERVOS = [
  { label: "Estude Grátis — provas anteriores com gabarito e edital", url: "https://www.estudegratis.com.br/provas", nota: "Download gratuito, filtro por banca e ano" },
  { label: "Gran Questões — questões por banca", url: "https://questoes.grancursosonline.com.br/concursos/bancas", nota: "Resolva online e veja o comentário" },
  { label: "Estratégia — cadernos de prova da FGV", url: "https://www.estrategiaconcursos.com.br/blog/ultimas-provas-da-banca-fgv/", nota: "Lista das últimas provas da banca" },
  { label: "PCI Concursos — provas e gabaritos", url: "https://www.pciconcursos.com.br/provas/", nota: "Acervo por banca e cargo" },
];

module.exports = { PORTAIS, ACERVOS };
