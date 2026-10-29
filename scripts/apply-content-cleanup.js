#!/usr/bin/env node
/**
 * scripts/apply-content-cleanup.js — limpeza de conteúdo pedida após o relatório do Search Console.
 * Idempotente: pode rodar mais de uma vez. Uso (na raiz do projeto): node scripts/apply-content-cleanup.js
 *
 *  1. Série "o que mudou nesta semana": categoria vira "Editais" (era sorteada entre 11 categorias).
 *  2. Remove "curiosidades" duvidosas (história dos concursos com datas que se contradizem entre posts).
 *  3. noindex em 2 artigos sem salvação (698 e 995 palavras, título solto).
 *  4. Funde o artigo de "rotina de estudos" no guia de cronograma (redirects já em next.config.js).
 *  5. Amplia 2 guias curtos (revisão espaçada e ansiedade) com conteúdo novo.
 */
const fs = require("fs");
const path = require("path");
const dir = path.join(process.cwd(), "posts");
if (!fs.existsSync(dir)) { console.error("Rode na raiz do projeto (pasta com posts/)."); process.exit(1); }

const DOUBT = /1832|1934|1935|1938|1995|DASP|Getúlio|favoritismo|apadrinhamento|indica(ç|c)ões pol/;
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
const rd = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const wr = (f, t) => fs.writeFileSync(path.join(dir, f), t, "utf8");
let cat = 0, cur = 0, noidx = 0;

for (const f of files) {
  const t = rd(f);
  const m = t.match(/^(---\n[\s\S]*?\n)(---)/);
  if (!m) continue;
  let fm = m[1];
  if (f.includes("o-que-mudou")) {
    const n = fm.replace(/^category:.*$/m, 'category: "Editais"');
    if (n !== fm) { cat++; fm = n; }
  }
  const mc = fm.match(/^curiosity:.*$\n?/m);
  if (mc && DOUBT.test(mc[0])) { fm = fm.replace(mc[0], ""); cur++; }
  if (/2026-08-18-concurso-blog-o-que-mudou|de-resto-e-estudar-muito/.test(f) && !/^noindex:/m.test(fm)) {
    fm = fm.replace(/^(date:.*)$/m, "$1\nnoindex: true"); noidx++;
  }
  if (fm !== m[1]) wr(f, fm + t.slice(m[1].length));
}

function insertBefore(pattern, marker, block, label) {
  const f = files.find((x) => pattern.test(x) && fs.existsSync(path.join(dir, x)));
  if (!f) return console.log("aviso: não achei", label);
  const t = rd(f);
  if (t.includes(block.split("\n")[0])) return console.log("já aplicado:", label);
  if (!t.includes(marker)) return console.log("aviso: marcador não encontrado em", label);
  wr(f, t.replace(marker, block + marker));
  console.log("ampliado:", label);
}

insertBefore(/como-montar-cronograma-de-estudos-para-concurso-publico-guia-atualizado\.md$/, "## 6. Monitoramento e Ajustes", "### 5.3. Revisão semanal, revisão mensal e saúde\n\nUm cronograma que só distribui matéria nova esquece o que mais pesa na prova: reter o que já foi estudado. Reserve dois momentos fixos de revisão:\n\n- **Revisão semanal (ciclo de 7 dias):** um bloco de 1h30 no fim da semana para refazer as questões que você errou e reler os resumos curtos (cinco linhas por tópico bastam). Quem estuda só o conteúdo novo costuma perceber, duas semanas depois, que já não lembra do começo.\n- **Revisão mensal (ciclo de 30 dias):** um bloco maior para revisar a legislação e os pontos-chave de cada disciplina e, de preferência, fazer um simulado completo sob cronômetro, para medir se o plano está funcionando.\n\nVocê pode usar o [Desafio do dia do simulado](/simulado#desafio) como revisão rápida de 3 minutos e a fila \"Revisar meus erros\" no bloco semanal: ela reúne apenas as questões que você errou.\n\nSono e atividade física também entram no cronograma, não ficam de fora dele. Adultos em geral precisam de cerca de 7 a 9 horas de sono por noite, e a Organização Mundial da Saúde recomenda pelo menos 150 minutos de atividade física moderada por semana. Estudar até de madrugada e cortar o sono costuma custar mais em memória e atenção do que rende em horas. Se o cansaço ou a ansiedade estiverem atrapalhando de forma persistente, vale conversar com um profissional de saúde.\n\n", "guia de cronograma (+rotina)");
insertBefore(/revisao-espacada-para-memorizar-legislacao\.md$/, "## Desafios e Soluções", "## Um calendário de revisão pronto para usar\n\nNão existe um intervalo único e correto, mas um esquema simples e muito usado é revisar o conteúdo **no mesmo dia ou no dia seguinte, depois de 7 dias, depois de 15 e, por fim, depois de 30 dias**. A cada revisão bem-sucedida, o intervalo até a próxima aumenta. Se você errou, o tópico volta para o começo do ciclo.\n\nVeja como isso funciona com prazos da Lei 8.112/1990, que costumam aparecer em provas. Em vez de reler o artigo, transforme cada prazo em uma pergunta:\n\n| Pergunta (frente da ficha) | Resposta (verso) |\n|---|---|\n| Qual o prazo para tomar posse, contado da publicação do ato de provimento? | 30 dias |\n| Depois da posse, em quantos dias o servidor deve entrar em exercício? | 15 dias |\n| Quantos anos de efetivo exercício dão estabilidade (art. 41 da CF)? | 3 anos |\n\nEsse formato de pergunta e resposta é o que torna a revisão eficaz: tentar lembrar da resposta antes de olhar costuma fixar mais do que reler o texto.\n\n## Use questões como revisão\n\nResolver questões é a forma mais direta de praticar a recuperação ativa. No [simulado do Passeja](/simulado#montar), o que você erra vai para a fila **Revisar meus erros**: a questão volta até você acertá-la, o que na prática funciona como um ciclo de revisão para o seu ponto fraco. Reserve um bloco curto uma vez por semana para zerar essa fila.\n\n", "revisão espaçada");
insertBefore(/10-dicas-para-superar-a-ansiedade/, "## Recursos para Aprender e Praticar", "## Treine o dia da prova antes do dia da prova\n\nBoa parte da ansiedade vem do desconhecido: a pressão do tempo, o silêncio da sala, a dúvida sobre o ritmo. Dá para reduzir isso ensaiando.\n\n- **Faça simulados sob condições reais.** Escolha a banca do seu concurso, ligue o cronômetro e responda sem consultar nada. No [simulado do Passeja](/simulado#montar), o **modo prova** tem cronômetro geral, permite marcar questões para revisar e só mostra o gabarito no final, como numa prova de verdade.\n- **Descubra o seu ritmo.** Anote quanto tempo você gasta por questão e em quais matérias trava. Saber que você costuma fechar a prova com 10 minutos de sobra é um calmante concreto.\n- **Tenha uma regra para as difíceis.** Marque, pule e volte depois. Em provas em que o erro desconta ponto (como alguns editais do Cebraspe), saber quando deixar em branco também faz parte da estratégia.\n\n## Uma rotina simples para a última semana\n\n- **Dias anteriores:** revise apenas o que você já estudou, sem matéria nova, e faça um último simulado completo mais cedo na semana, para ter tempo de corrigir os erros.\n- **Véspera:** confira documento, local da prova, trajeto e horário do portão de entrada. Separe tudo antes de dormir e priorize uma boa noite de sono.\n- **No dia:** chegue com folga. Se sentir o coração acelerar, uma respiração lenta, inspirando pelo nariz por cerca de 4 segundos e soltando o ar devagar por cerca de 6, costuma ajudar a baixar a tensão por alguns minutos.\n\nSentir nervosismo antes da prova é normal. Se a ansiedade for intensa, atrapalhar o sono ou o estudo por semanas, ou vier com sintomas físicos fortes, procure um profissional de saúde: isso é cuidado, não fraqueza.\n\n", "ansiedade");

const rotina = files.find((x) => /como-organizar-rotina-de-estudos-para-concurso-dicas-praticas\.md$/.test(x));
if (rotina) { fs.unlinkSync(path.join(dir, rotina)); console.log("removido (fundido no guia de cronograma):", rotina); }

console.log(`categorias da série: ${cat} | curiosidades removidas: ${cur} | noindex: ${noidx}`);
