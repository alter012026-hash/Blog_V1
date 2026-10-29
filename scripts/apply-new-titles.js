#!/usr/bin/env node
// Troca só a linha "title:" dos posts listados (títulos genéricos -> específicos).
// Uso (na raiz do projeto): node scripts/apply-new-titles.js
const fs = require("fs");
const path = require("path");
const dir = path.resolve(__dirname, "../posts");
const titles = {
  "2026-07-26-concurso-iss-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso ISS Manaus: o que já se sabe do edital e como se preparar",
  "2026-08-01-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "SES-TO com salário de R$ 17,7 mil e vagas em prefeituras: concursos da semana",
  "2026-08-02-concurso-prefeitura-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso de prefeitura na Bahia: vagas com salários de até R$ 3 mil e como estudar",
  "2026-08-03-concurso-portal-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos de São José de Ribamar, GCM de Pouso Alegre e Rio das Ostras: o que saber",
  "2026-08-06-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos em Tombos (MG) e Marialva (PR): salários de até R$ 17 mil",
  "2026-08-07-concurso-portal-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos da Prefeitura de Igaraçu do Tietê, Caer (RR) e Petrolina de Goiás",
  "2026-08-09-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "MP-ES: gabarito extraoficial e a avalanche de editais da primeira semana de agosto",
  "2026-08-10-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Edital da CELESC (SC) e contrato da FGV com a Seplag-RJ: o que muda para o candidato",
  "2026-08-11-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos no Tocantins e em Pernambuco: salários de até R$ 17 mil",
  "2026-08-12-concurso-prefeitura-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos de prefeitura em São Roque, Carrancas e na Bahia: como estudar para bancas locais",
  "2026-08-13-concurso-pc-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "PC-BA com 750 vagas, Transpetro e Abaetetuba: editais em destaque da semana",
  "2026-08-14-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso Transpetro: vaga de advogado com salário de R$ 14,9 mil e como estudar",
  "2026-08-15-concurso-estrategia-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos de Pirpirituba e Nova União: por que vale olhar para as prefeituras",
  "2026-08-16-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "TJ-PR com salário de R$ 23 mil, saúde do Rio e Transpetro: concursos da semana",
  "2026-08-18-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso de Juiz Federal do TRF 5 e as 4.472 vagas dos editais de agosto",
  "2026-08-20-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "11 editais em um dia: UFRRJ e a expectativa do edital da Manausprev (AM)",
  "2026-08-21-concurso-sp-o-que-mudou-nesta-semana-e-como-estruturar-sua-preparacao-de-reta-fi.md": "Reta final da PM-SP (2.000 vagas) e concursos em Santana de Parnaíba e Vinhedo",
  "2026-08-22-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "TCE-AP e 34 novos editais: os concursos da área de controle ganham força",
  "2026-08-23-concurso-ba-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital-de-saude-da-pm-e-.md": "PM-BA e CBM-BA: edital unificado com 40 vagas para Oficiais de Saúde",
  "2026-08-27-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Três editais em 72 horas: o que as publicações de 25 a 27 de agosto indicam",
  "2026-08-28-concurso-seplag-rj-e-giro-de-editais-o-que-mudou-nesta-semana-e-como-se-preparar.md": "Seplag-RJ confirma cronograma e TCE-GO publica edital para nível médio",
  "2026-08-30-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "CRA-RJ confirma concurso com 84 vagas: conselhos e autarquias em alta",
  "2026-08-31-concurso-acidade-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso para professores com 5.000 vagas é autorizado em SP; prazos finais de 31/08",
  "2026-09-01-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Manausprev (R$ 9,1 mil) e Prefeitura de Horizonte (CE): inscrições e edital",
  "2026-09-03-concurso-par-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "SEDUC-PA com cerca de 2 mil vagas e Itanhaém (SP): editais da semana",
  "2026-09-04-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "SEDUC-PA, Seplag-RJ e PMMG: três editais com salários de até R$ 14,3 mil",
  "2026-09-05-concurso-prefeitura-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos municipais: Conceição da Barra (até R$ 16 mil) e Dores do Indaiá (158 vagas)",
  "2026-09-06-concurso-eptc-porto-alegre-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso EPTC Porto Alegre: cargos gerenciais com salário de até R$ 9,7 mil",
  "2026-09-07-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso de Floresta (PE): 432 vagas e salários de até R$ 15 mil",
  "2026-09-08-concurso-sedes-df-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso SEDES-DF: gabaritos extraoficiais de cinco cargos e como recorrer",
  "2026-09-09-concurso-camara-dos-deputados-2026-o-que-mudou-esta-semana-e-o-que-esperar-do-ed.md": "Concurso Câmara dos Deputados 2026: mais de 150 vagas e edital previsto para setembro",
  "2026-09-10-concurso-camara-dos-deputados-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Câmara dos Deputados: Analista com salário de até R$ 30 mil e prova do Cebraspe",
  "2026-09-11-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos de Poço Dantas e Trindade: o risco de olhar só para o teto salarial",
  "2026-09-12-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos de Contagem, Rio Branco e Trindade: vagas, salários e prazos",
  "2026-09-13-concurso-publico-o-que-mudou-nesta-semana-e-o-que-esperar-dos-editais.md": "PC-PE com 1.315 vagas e Câmara de Rio Branco: editais de destaque da semana",
  "2026-09-14-concurso-policia-penal-2026-o-que-mudou-nesta-semana-e-o-que-esperar-do-proximo-.md": "Polícia Penal de PE terá Cebraspe como banca; gabaritos do RN em breve",
  "2026-09-15-concurso-jc-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos em Queimados, Rio Branco e Hospital Odilon Behrens: comparativo de vagas",
  "2026-09-16-concurso-gabarito-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Gabaritos liberados em até 24 horas: como usar a correção rápida nos estudos",
  "2026-09-17-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Metrô-DF autoriza concurso com 224 vagas e sete editais saem em um único dia",
  "2026-09-18-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Fundação Gaspar Vianna (215 vagas) e SME de São José (SC): editais da semana",
  "2026-09-19-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "GCM Salvador contrata a FGV: o que esperar do edital e da prova",
  "2026-09-20-concurso-r-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "DPE-PB (20 vagas + CR) e concurso do Rio com salário de R$ 18 mil",
  "2026-09-21-concurso-magistrar-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "DPE-PB publica edital e GCM Salvador abre 50 vagas: o que esperar",
  "2026-09-22-concurso-ceara-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Ceará abre 12 editais ao mesmo tempo: como organizar as inscrições",
  "2026-09-23-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "IFPA, PGM Curitiba e SP Águas: os editais que movimentaram a semana",
  "2026-09-24-concurso-estrategia-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "CREMERJ com vagas remotas de R$ 18 mil e PC-AP com 396 vagas",
  "2026-09-25-concurso-resultado-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Seduc-PI: resultado final do concurso com 4 mil vagas para professores",
  "2026-09-26-concurso-sp-aguas-2026-o-que-mudou-esta-semana-e-o-que-esperar-do-edital.md": "Concurso SP Águas: 190 vagas previstas e o que estudar para a prova",
  "2026-09-27-concurso-para-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos no Pará e na PC-AP: salários, cargos e prazos de inscrição",
  "2026-09-28-concurso-prefeitura-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Gabaritos de Embu das Artes, Matinhos e Paulínia: como recorrer e planejar o próximo edital",
  "2026-09-29-concurso-gabarito-o-que-mudou-esta-semana-e-o-que-esperar-do-proximo-edital.md": "Gabaritos do IBAM e da FAFIPA em cinco municípios: o que mudou na divulgação",
  "2026-09-30-concurso-educacao-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos de Educação em Aparecida de Goiânia, Porto Velho e Amparo somam mais de 3.300 vagas",
  "2026-10-06-concurso-direcao-novidades-da-semana-e-o-que-esperar-dos-novos-editais.md": "TRT-8, PC-PE, Câmara e CAU: cinco editais publicados quase ao mesmo tempo",
  "2026-10-08-concurso-ematermg-2026-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concurso Emater-MG: salários de até R$ 7,3 mil e cargos técnicos e superiores",
  "2026-10-13-concurso-blog-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "Concursos AGU e CGU 2026: banca em definição e 60 vagas abertas na CGU",
  "2026-10-14-concurso-inb-2026-mudancas-recentes-e-o-que-esperar-do-edital.md": "Concurso INB 2026: edital com vagas de nível médio e superior e salário de até R$ 8,3 mil",
  "2026-10-16-concurso-estrategia-o-que-mudou-nesta-semana-e-o-que-esperar-do-edital.md": "TCE-SP com salário inicial de R$ 20,9 mil e os concursos de alta remuneração da semana",
  "2026-10-19-concurso-fiibrasil-mudancas-recentes-e-o-que-esperar-do-edital.md": "Gabaritos de seis concursos em um dia: como usar a correção para planejar recursos",
  "2026-10-21-concurso-abdi-novidades-da-semana-e-o-que-esperar-do-edital.md": "Concurso ABDI: 180 vagas com salário de até R$ 16 mil"
};
let ok = 0, skip = 0;
for (const [file, title] of Object.entries(titles)) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) { console.warn("não encontrado:", file); skip++; continue; }
  const raw = fs.readFileSync(p, "utf8");
  const next = raw.replace(/^title:\s*".*"\s*$/m, () => `title: "${title}"`);
  if (next === raw) { skip++; continue; }
  fs.writeFileSync(p, next);
  ok++;
}
console.log(`Títulos atualizados: ${ok} | sem alteração/não encontrados: ${skip}`);
