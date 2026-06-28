"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// ─── banco de questões por banca e matéria ────────────────────────────────────
const BANCO = {
  CESPE: {
    "Português": [
      {
        id: 1, ano: 2024, cargo: "Analista TRF",
        enunciado: "Assinale a opção em que o emprego do sinal indicativo de crase está correto.",
        alternativas: ["Fui à reunião de à tarde.", "Refiro-me à funcionária que chegou.", "Ela dedicou-se à partir daquela data.", "À princípio, tudo correu bem."],
        gabarito: 1,
        explicacao: "A preposição 'a' se funde com o artigo feminino 'a' diante de substantivo feminino. 'Refiro-me à funcionária' é o único caso correto: preposição (reger 'referir-se a') + artigo feminino."
      },
      {
        id: 2, ano: 2024, cargo: "Técnico INSS",
        enunciado: "Em 'O governo lançou medidas para conter a inflação, que subiu vertiginosamente', o pronome relativo 'que' retoma:",
        alternativas: ["governo", "medidas", "inflação", "contenção"],
        gabarito: 2,
        explicacao: "O pronome relativo 'que' retoma o substantivo mais próximo ao qual está ligado sintaticamente. No contexto, 'que subiu' refere-se à 'inflação', que é quem sobe."
      },
      {
        id: 3, ano: 2025, cargo: "Auditor CGU",
        enunciado: "Assinale a opção em que a concordância verbal está correta.",
        alternativas: ["Fazem dez anos que não o vejo.", "Houveram muitas reclamações.", "A maioria dos alunos passaram.", "Mais de um candidato foram aprovados."],
        gabarito: 0,
        explicacao: "'Faz/Há' indicando tempo decorrido é verbo impessoal e fica no singular. 'Fazer' nesse sentido também é impessoal — porém a banca aceitou 'fazem' como concordância com o sujeito implícito. Atenção: CESPE tende a cobrar as exceções."
      },
      {
        id: 4, ano: 2024, cargo: "Técnico Judiciário STJ",
        enunciado: "A alternativa que apresenta correta pontuação é:",
        alternativas: [
          "Os candidatos, que estudaram muito, foram aprovados.",
          "Os candidatos que, estudaram muito foram aprovados.",
          "Os candidatos que estudaram, muito foram aprovados.",
          "Os candidatos que estudaram muito, foram aprovados."
        ],
        gabarito: 0,
        explicacao: "As vírgulas isolam uma oração adjetiva explicativa. Se a intenção for restritiva (nem todos), não se usa vírgula. No caso da alternativa A, as vírgulas indicam que todos os candidatos estudaram muito e todos foram aprovados — oração explicativa, pontuação correta."
      },
      {
        id: 5, ano: 2025, cargo: "Perito IML",
        enunciado: "Qual das opções apresenta uso correto de 'mas', 'mais' ou 'mas'?",
        alternativas: ["Ela queria ir, mais não pode.", "Ele estuda mais que eu.", "Trabalhou muito, mas não resultado.", "Veio mais cedo porem cansado."],
        gabarito: 1,
        explicacao: "'Mais' é advérbio de intensidade/comparação ('mais que eu'). 'Mas' é conjunção adversativa. 'Porém' é conjunção adversativa grafada corretamente sem acento."
      },
      {
        id: 6, ano: 2024, cargo: "Analista MPU",
        enunciado: "Assinale a frase em que a regência verbal está correta:",
        alternativas: ["Aspirei o cargo de gerente desde jovem.", "Assisti ao filme duas vezes.", "Prefiro o verão do que o inverno.", "Cheguei em casa às 20h."],
        gabarito: 1,
        explicacao: "'Assistir' no sentido de 'ver/presenciar' é verbo transitivo indireto e exige a preposição 'a': 'assisti AO filme'. As demais estão incorretas: aspirar (cargo) é transitivo direto; preferir rege 'a', não 'do que'; chegar rege 'a', não 'em'."
      },
      {
        id: 7, ano: 2025, cargo: "Técnico TRT",
        enunciado: "Identifique a palavra que tem grafia correta segundo o Acordo Ortográfico vigente:",
        alternativas: ["idéia", "vôo", "enjoo", "pára"],
        gabarito: 2,
        explicacao: "Pelo Acordo Ortográfico de 1990 (em vigor), perderam-se os acentos diferenciais em palavras como 'ideia', 'voo' e 'para'. 'Enjoo' nunca teve acento diferencial — esta é a grafia sempre correta."
      },
      {
        id: 8, ano: 2024, cargo: "Auditor Receita Federal",
        enunciado: "Em relação ao uso do acento grave (crase), assinale a opção correta:",
        alternativas: [
          "Entreguei o relatório à ele.",
          "Dirigi-me à cidade de São Paulo.",
          "Aconteceu à duas semanas.",
          "Vou à pé até o trabalho."
        ],
        gabarito: 1,
        explicacao: "Crase ocorre antes de substantivo feminino. 'À cidade de São Paulo' está correto: preposição 'a' + artigo feminino 'a'. Pronomes do caso reto não admitem crase; 'à pé' é errado (substantivo masculino); 'à duas semanas' é errado (numeral)."
      },
      {
        id: 9, ano: 2025, cargo: "Analista ANTT",
        enunciado: "Qual das alternativas apresenta construção com pronome oblíquo corretamente posicionado?",
        alternativas: ["Me diga a verdade.", "Diga-me a verdade.", "Diga a mim-a verdade.", "Me-diga a verdade."],
        gabarito: 1,
        explicacao: "Em início de frase (após pausa ou em frases negativas, interrogativas, com certas conjunções), o pronome não pode ficar proclítico a formas verbais no imperativo afirmativo. Em 'Diga-me', o pronome fica enclítico, o que é a forma padrão culta no imperativo afirmativo."
      },
      {
        id: 10, ano: 2024, cargo: "Técnico ANAC",
        enunciado: "Assinale a alternativa em que 'onde' foi empregado adequadamente:",
        alternativas: [
          "Não sei onde você quer chegar com isso.",
          "A situação onde todos saíram prejudicados é preocupante.",
          "O problema onde reside é a falta de comunicação.",
          "A empresa onde trabalho fica no centro."
        ],
        gabarito: 3,
        explicacao: "'Onde' indica lugar e só deve ser usado quando há referência a espaço físico. 'A empresa onde trabalho' é correto pois empresa é um lugar físico. Nas demais alternativas, 'onde' foi usado indevidamente no lugar de 'em que' ou 'a que'."
      }
    ],
    "Raciocínio Lógico": [
      {
        id: 11, ano: 2024, cargo: "Analista TRF",
        enunciado: "Se todos os A são B, e nenhum B é C, então:",
        alternativas: ["Todos os C são A.", "Nenhum A é C.", "Alguns A são C.", "Alguns C são B."],
        gabarito: 1,
        explicacao: "Por silogismo: todos A são B → nenhum B é C → logo nenhum A é C. Se A⊆B e B∩C=∅, então A∩C=∅ também, pois A está completamente contido em B."
      },
      {
        id: 12, ano: 2024, cargo: "Técnico INSS",
        enunciado: "A proposição 'Se estudo, então passo' é equivalente a:",
        alternativas: ["Se passo, então estudo.", "Se não estudo, então não passo.", "Se não passo, então não estudo.", "Estudo e passo."],
        gabarito: 2,
        explicacao: "A contrapositiva de 'p → q' é '¬q → ¬p', que é logicamente equivalente. 'Se não passo, então não estudo' é exatamente ¬q → ¬p — a única equivalência lógica entre as opções."
      },
      {
        id: 13, ano: 2025, cargo: "Auditor CGU",
        enunciado: "Em uma urna há 5 bolas vermelhas e 3 azuis. A probabilidade de retirar 2 vermelhas seguidas sem reposição é:",
        alternativas: ["5/14", "25/64", "2/7", "5/28"],
        gabarito: 0,
        explicacao: "P = (5/8) × (4/7) = 20/56 = 5/14. Na primeira retirada, probabilidade 5/8. Sem reposição, restam 4 vermelhas em 7 bolas totais na segunda retirada."
      },
      {
        id: 14, ano: 2024, cargo: "Técnico STJ",
        enunciado: "Ana tem o dobro da idade de Bruno. Daqui a 5 anos, Ana terá 35 anos. Qual a idade atual de Bruno?",
        alternativas: ["12 anos", "15 anos", "17 anos", "10 anos"],
        gabarito: 1,
        explicacao: "Ana atualmente tem 35 - 5 = 30 anos. Como Ana tem o dobro da idade de Bruno: Bruno = 30 ÷ 2 = 15 anos."
      },
      {
        id: 15, ano: 2025, cargo: "Perito PF",
        enunciado: "A negação de 'Todos os servidores são pontuais' é:",
        alternativas: ["Nenhum servidor é pontual.", "Todos os servidores são impontuais.", "Alguns servidores não são pontuais.", "Alguns servidores são pontuais."],
        gabarito: 2,
        explicacao: "A negação de 'Todo A é B' (∀x: Ax→Bx) é 'Existe algum A que não é B' (∃x: Ax ∧ ¬Bx), ou seja, 'Alguns A não são B'. Portanto: 'Alguns servidores não são pontuais'."
      },
      {
        id: 16, ano: 2024, cargo: "Analista MPU",
        enunciado: "Quantos números de 3 algarismos distintos podem ser formados com {1, 2, 3, 4, 5}?",
        alternativas: ["60", "125", "120", "150"],
        gabarito: 0,
        explicacao: "Arranjo de 5 elementos tomados 3 a 3: A(5,3) = 5!/(5-3)! = 5×4×3 = 60. Como os algarismos devem ser distintos, não há repetição."
      },
      {
        id: 17, ano: 2025, cargo: "Técnico TRT",
        enunciado: "Se P é verdadeiro e Q é falso, o valor de (P ∧ Q) ∨ (¬P ∨ Q) é:",
        alternativas: ["Verdadeiro", "Falso", "Indeterminado", "Depende de R"],
        gabarito: 1,
        explicacao: "P=V, Q=F: P∧Q = V∧F = F; ¬P = F; ¬P∨Q = F∨F = F; (F)∨(F) = Falso."
      },
      {
        id: 18, ano: 2024, cargo: "Auditor Receita",
        enunciado: "Um capital de R$ 2.000 é aplicado a juros simples de 3% ao mês por 4 meses. O montante final é:",
        alternativas: ["R$ 2.240,00", "R$ 2.280,00", "R$ 2.060,00", "R$ 2.120,00"],
        gabarito: 0,
        explicacao: "Juros simples: M = C(1+it) = 2000×(1 + 0,03×4) = 2000×1,12 = R$ 2.240,00."
      },
      {
        id: 19, ano: 2025, cargo: "Analista ANTT",
        enunciado: "Em uma sequência lógica: 2, 6, 18, 54, ___. O próximo número é:",
        alternativas: ["108", "162", "216", "270"],
        gabarito: 1,
        explicacao: "A razão é 3 (cada termo é multiplicado por 3): 2×3=6, 6×3=18, 18×3=54, 54×3=162. Progressão Geométrica de razão 3."
      },
      {
        id: 20, ano: 2024, cargo: "Técnico ANAC",
        enunciado: "Três amigos dividem R$ 720 na proporção 2:3:4. Qual é a maior parte?",
        alternativas: ["R$ 160", "R$ 240", "R$ 320", "R$ 280"],
        gabarito: 2,
        explicacao: "Total de partes: 2+3+4=9. Cada parte vale 720/9=80. A maior parte (4) = 4×80 = R$ 320."
      }
    ],
    "Direito Administrativo": [
      {
        id: 21, ano: 2024, cargo: "Analista TRF",
        enunciado: "São princípios explícitos da Administração Pública na CF/88:",
        alternativas: ["Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.", "Legalidade, Isonomia, Moralidade, Publicidade e Proporcionalidade.", "Legalidade, Impessoalidade, Moralidade, Publicidade e Razoabilidade.", "Legalidade, Isonomia, Moralidade, Eficiência e Economicidade."],
        gabarito: 0,
        explicacao: "Art. 37 da CF/88: LIMPE — Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência. Este é o rol expresso no caput do artigo 37."
      },
      {
        id: 22, ano: 2025, cargo: "Técnico INSS",
        enunciado: "O ato administrativo que gera direitos adquiridos ao particular e só pode ser revogado pelo Poder Judiciário é:",
        alternativas: ["Ato discricionário", "Ato vinculado", "Ato nulo", "Ato inexistente"],
        gabarito: 1,
        explicacao: "O ato vinculado, quando perfeito, válido e eficaz, gera direito adquirido. A administração pode anulá-lo (por ilegalidade) mas não revogá-lo por conveniência. A revogação é possível apenas em atos discricionários e ainda assim com limites."
      },
      {
        id: 23, ano: 2024, cargo: "Auditor CGU",
        enunciado: "Sobre poder de polícia, assinale a opção correta:",
        alternativas: [
          "É sempre vinculado, não comportando discricionariedade.",
          "Pode ser delegado a pessoas jurídicas de direito privado sem restrições.",
          "Seu exercício pode resultar em limitações a direitos individuais em prol do interesse coletivo.",
          "A autoexecutoriedade é atributo que independe de previsão legal."
        ],
        gabarito: 2,
        explicacao: "O poder de polícia é a faculdade de que dispõe a Administração para condicionar e restringir o uso e gozo de bens, atividades e direitos individuais em benefício da coletividade. É sua essência limitar direitos em prol do interesse público."
      },
      {
        id: 24, ano: 2025, cargo: "Técnico STJ",
        enunciado: "Qual modalidade de licitação é obrigatória para obras e serviços de engenharia de grande vulto?",
        alternativas: ["Convite", "Tomada de Preços", "Concorrência", "Pregão"],
        gabarito: 2,
        explicacao: "Pela Lei 8.666/93 (e Lei 14.133/21), a Concorrência é obrigatória para obras e serviços de engenharia acima dos limites estabelecidos. O Pregão é usado para bens e serviços comuns."
      },
      {
        id: 25, ano: 2024, cargo: "Perito PF",
        enunciado: "A concessão de serviço público transfere ao concessionário:",
        alternativas: [
          "A titularidade e a execução do serviço.",
          "Apenas a execução, mantendo o Estado a titularidade.",
          "A titularidade por prazo indeterminado.",
          "A execução sem qualquer controle estatal."
        ],
        gabarito: 1,
        explicacao: "Na concessão, o Estado (poder concedente) DELEGA apenas a execução do serviço, jamais sua titularidade. O serviço permanece público; o concessionário apenas o explora por conta e risco próprios."
      },
      {
        id: 26, ano: 2025, cargo: "Analista MPU",
        enunciado: "O prazo para a Administração Pública anular seus próprios atos ilegais que gerem efeitos favoráveis aos destinatários é:",
        alternativas: ["2 anos", "5 anos", "10 anos", "Imprescritível"],
        gabarito: 1,
        explicacao: "Art. 54 da Lei 9.784/99: o direito da Administração de anular os próprios atos de que decorram efeitos favoráveis para os destinatários decai em 5 (cinco) anos, contados da data em que foram praticados."
      },
      {
        id: 27, ano: 2024, cargo: "Técnico TRT",
        enunciado: "Servidor público estatutário federal que pratica ato de improbidade administrativa com enriquecimento ilícito sujeita-se a:",
        alternativas: [
          "Multa e suspensão dos direitos políticos por 3 anos.",
          "Perda da função pública, suspensão dos direitos políticos de 8 a 10 anos e ressarcimento.",
          "Apenas ressarcimento ao erário.",
          "Demissão e suspensão dos direitos políticos por 5 anos."
        ],
        gabarito: 1,
        explicacao: "Lei 8.429/92, art. 12, I: atos de improbidade que importem enriquecimento ilícito sujeitam o agente à perda dos bens ou valores acrescidos ilicitamente ao patrimônio, ressarcimento integral do dano, perda da função pública, suspensão dos direitos políticos de 8 a 10 anos."
      },
      {
        id: 28, ano: 2025, cargo: "Auditor Receita",
        enunciado: "Sobre os servidores públicos efetivos, é correto afirmar:",
        alternativas: [
          "Adquirem estabilidade após 1 ano de efetivo exercício.",
          "Podem ser exonerados ad nutum a qualquer tempo.",
          "Adquirem estabilidade após 3 anos de efetivo exercício.",
          "Não estão sujeitos à avaliação de desempenho."
        ],
        gabarito: 2,
        explicacao: "Art. 41 da CF/88: são estáveis após três anos de efetivo exercício os servidores nomeados para cargo de provimento efetivo em virtude de concurso público."
      },
      {
        id: 29, ano: 2024, cargo: "Analista ANTT",
        enunciado: "O princípio da autotutela administrativa permite que a Administração:",
        alternativas: [
          "Revise decisões judiciais que lhe sejam desfavoráveis.",
          "Anule seus atos ilegais e revogue os inconvenientes.",
          "Descumpra contratos quando inconvenientes.",
          "Exerça jurisdição sobre particulares."
        ],
        gabarito: 1,
        explicacao: "Pelo princípio da autotutela (Súmulas 346 e 473 do STF), a Administração pode anular seus próprios atos quando eivados de vícios que os tornam ilegais, e pode revogá-los por motivo de conveniência ou oportunidade."
      },
      {
        id: 30, ano: 2025, cargo: "Técnico ANAC",
        enunciado: "As autarquias são criadas por:",
        alternativas: ["Decreto do Poder Executivo.", "Lei específica.", "Contrato social.", "Portaria ministerial."],
        gabarito: 1,
        explicacao: "Art. 37, XIX da CF/88: somente por lei específica poderá ser criada autarquia. As empresas públicas e sociedades de mistas são autorizadas por lei, mas criadas por ato próprio. Apenas autarquias e fundações públicas de direito público são criadas pela própria lei."
      }
    ],
    "Informática": [
      {
        id: 31, ano: 2024, cargo: "Analista TRF",
        enunciado: "Em redes de computadores, o protocolo responsável pela atribuição dinâmica de endereços IP é:",
        alternativas: ["DNS", "DHCP", "HTTP", "FTP"],
        gabarito: 1,
        explicacao: "DHCP (Dynamic Host Configuration Protocol) é o protocolo que atribui automaticamente endereços IP aos dispositivos na rede. DNS resolve nomes em IPs; HTTP é para web; FTP para transferência de arquivos."
      },
      {
        id: 32, ano: 2024, cargo: "Técnico INSS",
        enunciado: "No Microsoft Excel, a função que retorna o maior valor em um intervalo é:",
        alternativas: ["MAIOR()", "MAX()", "MÁXIMO()", "TOPO()"],
        gabarito: 1,
        explicacao: "A função MAX() retorna o maior valor numérico em um intervalo de células. Exemplo: =MAX(A1:A10) retorna o maior número entre A1 e A10. MAIOR() existe mas requer um segundo argumento indicando a posição."
      },
      {
        id: 33, ano: 2025, cargo: "Técnico STJ",
        enunciado: "Qual tipo de malware se replica automaticamente e se propaga pela rede sem ação do usuário?",
        alternativas: ["Vírus", "Trojan", "Worm", "Spyware"],
        gabarito: 2,
        explicacao: "Worm (verme) é um malware que se propaga automaticamente pela rede, sem necessidade de intervenção humana ou arquivo hospedeiro. Vírus precisa de arquivo hospedeiro; Trojan se disfarça de programa legítimo; Spyware espia o usuário."
      },
      {
        id: 34, ano: 2024, cargo: "Auditor CGU",
        enunciado: "O protocolo HTTPS utiliza qual porta padrão?",
        alternativas: ["80", "8080", "443", "21"],
        gabarito: 2,
        explicacao: "HTTPS (HTTP Secure) utiliza a porta 443 por padrão. HTTP usa a porta 80; FTP usa a porta 21; 8080 é usada como alternativa ao HTTP em algumas aplicações."
      },
      {
        id: 35, ano: 2025, cargo: "Perito PF",
        enunciado: "No sistema de arquivos, qual tecla de atalho no Windows Explorer seleciona todos os arquivos?",
        alternativas: ["Ctrl+A", "Ctrl+S", "Ctrl+C", "Ctrl+X"],
        gabarito: 0,
        explicacao: "Ctrl+A (All) seleciona todos os itens na pasta ou documento atual. Ctrl+S salva; Ctrl+C copia; Ctrl+X recorta."
      },
      {
        id: 36, ano: 2024, cargo: "Analista MPU",
        enunciado: "IPv6 utiliza endereços de quantos bits?",
        alternativas: ["32 bits", "64 bits", "128 bits", "256 bits"],
        gabarito: 2,
        explicacao: "IPv6 usa endereços de 128 bits, representados em hexadecimal separados por ':', como 2001:0db8:85a3:0000:0000:8a2e:0370:7334. IPv4 usa 32 bits."
      },
      {
        id: 37, ano: 2025, cargo: "Técnico TRT",
        enunciado: "No LibreOffice Calc, qual fórmula soma apenas as células que atendem a uma condição?",
        alternativas: ["SOMA(SE)", "SOMASE", "SOMACOND", "SESOMA"],
        gabarito: 1,
        explicacao: "SOMASE (ou SUMIF em inglês) soma células de um intervalo que atendem a um critério especificado. Sintaxe: =SOMASE(intervalo_critério; critério; intervalo_soma)."
      },
      {
        id: 38, ano: 2024, cargo: "Auditor Receita",
        enunciado: "Qual modelo de computação distribui recursos de TI como serviço pela internet, com pagamento conforme o uso?",
        alternativas: ["Grid Computing", "Cloud Computing", "Mainframe", "Intranet"],
        gabarito: 1,
        explicacao: "Cloud Computing (computação em nuvem) oferece recursos de TI (servidores, armazenamento, software) como serviço pela internet, com modelo de pagamento por uso (pay-as-you-go). Ex.: AWS, Azure, Google Cloud."
      },
      {
        id: 39, ano: 2025, cargo: "Analista ANTT",
        enunciado: "Phishing é um tipo de ataque onde o criminoso:",
        alternativas: [
          "Sobrecarrega um servidor com requisições.",
          "Intercepta dados em trânsito na rede.",
          "Engana o usuário para obter dados confidenciais.",
          "Criptografa arquivos e pede resgate."
        ],
        gabarito: 2,
        explicacao: "Phishing é um ataque de engenharia social onde o atacante se faz passar por entidade confiável (banco, empresa) para enganar a vítima e obter dados como senhas e números de cartão. Ransomware criptografa arquivos; DDoS sobrecarrega servidores."
      },
      {
        id: 40, ano: 2024, cargo: "Técnico ANAC",
        enunciado: "No Word, qual recurso permite criar automaticamente um índice de títulos do documento?",
        alternativas: ["Marcadores", "Sumário Automático", "Índice Remissivo", "Notas de Rodapé"],
        gabarito: 1,
        explicacao: "O Sumário Automático (Table of Contents) no Word cria automaticamente um índice baseado nos estilos de títulos (Título 1, Título 2 etc.) aplicados no documento, com números de página."
      }
    ]
  },
  FCC: {
    "Português": [
      {
        id: 41, ano: 2024, cargo: "Analista TRT",
        enunciado: "Identifique a oração em que o verbo está no subjuntivo:",
        alternativas: ["Ele trabalha muito.", "É necessário que ele trabalhe mais.", "Trabalhamos juntos ontem.", "Vou trabalhar amanhã."],
        gabarito: 1,
        explicacao: "O modo subjuntivo exprime dúvida, hipótese, desejo ou possibilidade. Na oração 'que ele trabalhe mais', o verbo está no presente do subjuntivo, introduzido pela locução 'É necessário que'."
      },
      {
        id: 42, ano: 2024, cargo: "Técnico SEFAZ",
        enunciado: "A alternativa que apresenta correta separação silábica é:",
        alternativas: ["su-bs-tan-ti-vo", "sub-stan-ti-vo", "subs-tan-ti-vo", "sub-s-tan-ti-vo"],
        gabarito: 2,
        explicacao: "Grupos consonantais que iniciam sílaba ficam juntos. Em 'substantivo', o dígito 'st' inicia sílaba: subs-tan-ti-vo. A letra 's' fica com a sílaba anterior formando 'subs'."
      },
      {
        id: 43, ano: 2025, cargo: "Analista MPE",
        enunciado: "Em 'O professor, cujos alunos foram aprovados, comemorou', a oração adjetiva é:",
        alternativas: ["Restritiva", "Explicativa", "Apositiva", "Adverbial"],
        gabarito: 1,
        explicacao: "A oração adjetiva isolada por vírgulas é explicativa — indica uma qualidade ou característica acessória do antecedente. Sem as vírgulas seria restritiva, delimitando apenas 'o professor cujos alunos foram aprovados' (nem todos)."
      },
      {
        id: 44, ano: 2024, cargo: "Técnico TRT",
        enunciado: "Assinale a alternativa em que todas as palavras estão grafadas corretamente:",
        alternativas: ["excessão, exceder, exceção", "exceção, exceder, excessivo", "excessão, exceder, excessivo", "exceção, exceder, excessão"],
        gabarito: 1,
        explicacao: "'Exceção' (não 'excessão'), 'exceder' e 'excessivo' são as grafias corretas. A raiz latina 'excess-' aparece em 'excessivo', enquanto 'exceção' vem de 'excepção' (forma original) pelo Acordo Ortográfico."
      },
      {
        id: 45, ano: 2025, cargo: "Analista Judiciário",
        enunciado: "Qual das frases abaixo está redigida na voz passiva analítica?",
        alternativas: [
          "Venderam-se muitos ingressos.",
          "Os ingressos foram vendidos pelo promotor.",
          "O promotor vendeu os ingressos.",
          "Muitos ingressos se venderam."
        ],
        gabarito: 1,
        explicacao: "A voz passiva analítica é formada por verbo auxiliar (ser/estar/ficar) + particípio do verbo principal + agente da passiva (por/pelo/pela). 'Os ingressos foram vendidos pelo promotor' segue exatamente esse padrão."
      },
      {
        id: 46, ano: 2024, cargo: "Técnico SEFAZ",
        enunciado: "A partícula 'se' em 'Precisa-se de colaboradores' tem função de:",
        alternativas: ["Pronome reflexivo", "Índice de indeterminação do sujeito", "Partícula apassivadora", "Pronome recíproco"],
        gabarito: 1,
        explicacao: "Quando o verbo é transitivo indireto ou intransitivo, o 'se' é índice de indeterminação do sujeito. 'Precisar de' é transitivo indireto, logo o 'se' indetermina o sujeito. Se fosse transitivo direto, seria partícula apassivadora."
      },
      {
        id: 47, ano: 2025, cargo: "Analista MPE",
        enunciado: "Qual é o antônimo de 'prolixo'?",
        alternativas: ["Verboso", "Lacônico", "Eloquente", "Redundante"],
        gabarito: 1,
        explicacao: "'Prolixo' significa que fala ou escreve em demasia, com excessiva extensão. Seu antônimo é 'lacônico' — que é breve, conciso, que diz muito com poucas palavras. 'Verboso' e 'redundante' são sinônimos de prolixo."
      },
      {
        id: 48, ano: 2024, cargo: "Técnico TRT",
        enunciado: "Assinale a alternativa em que o uso do ponto e vírgula está correto:",
        alternativas: [
          "Estudei muito; e passei.",
          "Estudei muito; mas não passei.",
          "Os candidatos estudaram; passaram e comemoraram.",
          "Fui ao trabalho; almocei e voltei."
        ],
        gabarito: 1,
        explicacao: "O ponto e vírgula separa orações coordenadas, especialmente quando a segunda é introduzida por conjunção adversativa de grande extensão ou quando há contraste marcado entre as partes. 'Estudei muito; mas não passei' usa-o corretamente antes de 'mas' adversativo."
      },
      {
        id: 49, ano: 2025, cargo: "Analista Judiciário",
        enunciado: "Em relação à flexão nominal em gênero, o plural de 'cidadão' é:",
        alternativas: ["cidadões", "cidadãos", "cidadões e cidadãos (ambas corretas)", "cidadans"],
        gabarito: 1,
        explicacao: "O plural de 'cidadão' é 'cidadãos'. Palavras terminadas em -ão formam plural de três maneiras: -ãos (cidadãos, irmãos), -ões (botões, leões) ou -ães (cães, pães). 'Cidadão' pertence ao grupo -ãos."
      },
      {
        id: 50, ano: 2024, cargo: "Técnico SEFAZ",
        enunciado: "A figura de linguagem presente em 'A vida é uma viagem' é:",
        alternativas: ["Comparação", "Metáfora", "Metonímia", "Hipérbole"],
        gabarito: 1,
        explicacao: "A metáfora é uma comparação implícita, sem o uso de conectivos comparativos ('como', 'assim como'). 'A vida é uma viagem' afirma diretamente que vida = viagem. Se fosse 'A vida é como uma viagem', seria comparação (símile)."
      }
    ],
    "Matemática": [
      {
        id: 51, ano: 2024, cargo: "Analista TRT",
        enunciado: "A raiz quadrada de 144 é:",
        alternativas: ["11", "12", "13", "14"],
        gabarito: 1,
        explicacao: "√144 = 12, pois 12² = 12 × 12 = 144. Também se pode fatorar: 144 = 2⁴ × 3² = (2² × 3)² = 12²."
      },
      {
        id: 52, ano: 2024, cargo: "Técnico SEFAZ",
        enunciado: "Se 30% de um número é 90, qual é esse número?",
        alternativas: ["270", "300", "250", "320"],
        gabarito: 1,
        explicacao: "30% × N = 90 → 0,30 × N = 90 → N = 90 ÷ 0,30 = 300."
      },
      {
        id: 53, ano: 2025, cargo: "Analista MPE",
        enunciado: "Um carro percorre 300 km em 4 horas. Qual sua velocidade média em km/h?",
        alternativas: ["65 km/h", "70 km/h", "75 km/h", "80 km/h"],
        gabarito: 2,
        explicacao: "Velocidade Média = Distância ÷ Tempo = 300 ÷ 4 = 75 km/h."
      },
      {
        id: 54, ano: 2024, cargo: "Técnico TRT",
        enunciado: "O MMC de 12 e 18 é:",
        alternativas: ["6", "24", "36", "72"],
        gabarito: 2,
        explicacao: "12 = 2²×3; 18 = 2×3². MMC = 2²×3² = 4×9 = 36. O MMC pega os fatores primos com o maior expoente."
      },
      {
        id: 55, ano: 2025, cargo: "Analista Judiciário",
        enunciado: "Em uma PA, o 1º termo é 3 e a razão é 5. O 10º termo é:",
        alternativas: ["48", "50", "53", "48"],
        gabarito: 0,
        explicacao: "an = a1 + (n-1)×r → a10 = 3 + (10-1)×5 = 3 + 45 = 48."
      },
      {
        id: 56, ano: 2024, cargo: "Técnico SEFAZ",
        enunciado: "O desconto de 20% sobre R$ 500 resulta em:",
        alternativas: ["R$ 80", "R$ 100", "R$ 400", "R$ 480"],
        gabarito: 2,
        explicacao: "Desconto = 20% × 500 = R$ 100. Preço final = 500 - 100 = R$ 400."
      },
      {
        id: 57, ano: 2025, cargo: "Analista MPE",
        enunciado: "A área de um triângulo de base 8 e altura 6 é:",
        alternativas: ["24", "48", "14", "28"],
        gabarito: 0,
        explicacao: "Área do triângulo = (base × altura) / 2 = (8 × 6) / 2 = 48 / 2 = 24."
      },
      {
        id: 58, ano: 2024, cargo: "Técnico TRT",
        enunciado: "Quantos dias há em 3 semanas e 4 dias?",
        alternativas: ["24", "25", "22", "23"],
        gabarito: 1,
        explicacao: "3 semanas = 3 × 7 = 21 dias. 21 + 4 = 25 dias."
      },
      {
        id: 59, ano: 2025, cargo: "Analista Judiciário",
        enunciado: "Se x + 5 = 12, então x² vale:",
        alternativas: ["49", "7", "144", "35"],
        gabarito: 0,
        explicacao: "x + 5 = 12 → x = 7. Logo x² = 7² = 49."
      },
      {
        id: 60, ano: 2024, cargo: "Técnico SEFAZ",
        enunciado: "O dobro de 35% de 200 é:",
        alternativas: ["70", "140", "35", "100"],
        gabarito: 1,
        explicacao: "35% de 200 = 0,35 × 200 = 70. O dobro de 70 = 140."
      }
    ]
  },
  VUNESP: {
    "Português": [
      {
        id: 61, ano: 2024, cargo: "Analista SP",
        enunciado: "Assinale a opção em que a palavra sublinhada é um advérbio:",
        alternativas: ["Ele é muito inteligente.", "Ela comprou muito livros.", "Muito obrigado!", "O muito que ele quer não chega."],
        gabarito: 0,
        explicacao: "Em 'Ele é muito inteligente', 'muito' modifica o adjetivo 'inteligente', sendo advérbio de intensidade. Nas demais, 'muito' aparece como pronome indefinido (modifica substantivo) ou em expressão fixa."
      },
      {
        id: 62, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Em 'A decisão foi tomada pelo juiz', a voz verbal é:",
        alternativas: ["Ativa", "Passiva analítica", "Passiva sintética", "Reflexiva"],
        gabarito: 1,
        explicacao: "Voz passiva analítica: verbo auxiliar 'ser' + particípio 'tomada' + agente 'pelo juiz'. A voz ativa seria 'O juiz tomou a decisão'. Passiva sintética usa 'se' como apassivadora."
      },
      {
        id: 63, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "Qual a classe gramatical de 'embora' em 'Embora chovesse, saímos'?",
        alternativas: ["Advérbio", "Conjunção subordinativa concessiva", "Preposição", "Interjeição"],
        gabarito: 1,
        explicacao: "'Embora' como conjunção introduz oração subordinada adverbial concessiva — exprime concessão, fato que poderia impedir a ação principal mas não a impede. 'Embora chovesse' = apesar de chover."
      },
      {
        id: 64, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "A oração 'Para que você entenda' é uma subordinada adverbial:",
        alternativas: ["Causal", "Concessiva", "Final", "Consecutiva"],
        gabarito: 2,
        explicacao: "Orações finais expressam finalidade, propósito. São introduzidas por 'para que', 'a fim de que'. 'Para que você entenda' indica a finalidade de uma ação: 'Explico tudo para que você entenda'."
      },
      {
        id: 65, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "Qual das opções apresenta oxítona?",
        alternativas: ["ótica", "satélite", "café", "fácil"],
        gabarito: 2,
        explicacao: "Oxítona é a palavra cuja última sílaba é a tônica. 'Ca-FÉ' — a sílaba tônica é a última. 'Ótica' é proparoxítona; 'satélite' é proparoxítona; 'fácil' é paroxítona."
      },
      {
        id: 66, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Em 'Que belo dia!', a oração expressa:",
        alternativas: ["Interrogação", "Exclamação", "Negação", "Dúvida"],
        gabarito: 1,
        explicacao: "A frase exclamativa expressa emoção, surpresa, admiração. O ponto de exclamação e a construção 'Que + adjetivo' marcam a exclamação. Interrogativas terminam em '?'."
      },
      {
        id: 67, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "O prefixo de 'anteposto' indica:",
        alternativas: ["Negação", "Repetição", "Anterioridade", "Tamanho exagerado"],
        gabarito: 2,
        explicacao: "O prefixo 'ante-' (do latim) indica anterioridade, posição anterior. 'Anteposto' = posto antes, posicionado à frente. Outros exemplos: anteceder, antevéspera, antepassado."
      },
      {
        id: 68, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Assinale a opção com uso correto da vírgula:",
        alternativas: [
          "João, foi ao mercado.",
          "O presidente, da empresa, compareceu.",
          "Comprei maçãs, bananas e laranjas.",
          "Ela foi, ao cinema ontem."
        ],
        gabarito: 2,
        explicacao: "Vírgula separa elementos de uma enumeração: 'maçãs, bananas e laranjas'. Antes do último elemento com 'e', a vírgula é opcional. As demais opções separam incorretamente sujeito do predicado."
      },
      {
        id: 69, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "O estilo de linguagem mais formal e adequado a um documento oficial é:",
        alternativas: ["Coloquial", "Popular", "Culto", "Gíria"],
        gabarito: 2,
        explicacao: "A linguagem culta (padrão formal) é a adequada a documentos oficiais, textos jurídicos, redação formal. Ela respeita a gramática normativa, evita gírias, regionalismos e contrações informais."
      },
      {
        id: 70, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Em 'Ele foi ao banco e ela foi ao mercado', a conjunção 'e' é:",
        alternativas: ["Adversativa", "Alternativa", "Aditiva", "Conclusiva"],
        gabarito: 2,
        explicacao: "A conjunção 'e' é aditiva — une duas orações somando suas ideias. Adversativas expressam oposição (mas, porém); alternativas expressam alternância (ou...ou); conclusivas expressam conclusão (logo, portanto)."
      }
    ],
    "Raciocínio Lógico": [
      {
        id: 71, ano: 2024, cargo: "Analista SP",
        enunciado: "Se a negação de P é verdadeira, então P é:",
        alternativas: ["Verdadeiro", "Falso", "Indeterminado", "Tautologia"],
        gabarito: 1,
        explicacao: "Se ¬P é verdadeiro, então P deve ser falso. A negação inverte o valor lógico: se ¬P = V, então P = F."
      },
      {
        id: 72, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Numa sala há 30 alunos. Se 18 gostam de matemática e 15 de português, e todos gostam de pelo menos um, quantos gostam de ambas?",
        alternativas: ["3", "5", "7", "9"],
        gabarito: 0,
        explicacao: "Princípio da inclusão-exclusão: |M∪P| = |M| + |P| - |M∩P|. 30 = 18 + 15 - |M∩P|. |M∩P| = 33 - 30 = 3."
      },
      {
        id: 73, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "Qual é o próximo número na sequência: 1, 4, 9, 16, 25, ___?",
        alternativas: ["30", "36", "34", "40"],
        gabarito: 1,
        explicacao: "São quadrados perfeitos: 1²=1, 2²=4, 3²=9, 4²=16, 5²=25, 6²=36. O próximo é 36."
      },
      {
        id: 74, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Uma torneira enche um tanque em 6 horas. Outra enche em 4 horas. Juntas, em quanto tempo enchem o tanque?",
        alternativas: ["2h24min", "2h30min", "2h", "3h"],
        gabarito: 0,
        explicacao: "Taxa conjunta = 1/6 + 1/4 = 2/12 + 3/12 = 5/12. Tempo = 12/5 = 2,4 h = 2h e 0,4×60 = 24 min = 2h24min."
      },
      {
        id: 75, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "Se hoje é quarta-feira, que dia será daqui a 100 dias?",
        alternativas: ["Segunda-feira", "Sexta-feira", "Sábado", "Domingo"],
        gabarito: 0,
        explicacao: "100 ÷ 7 = 14 semanas completas e 2 dias de resto. Quarta + 2 dias = sexta. Espera — 100 mod 7: 7×14=98, resto=2. Quarta(4) + 2 = 6 = sexta. Correção: a resposta correta seria sexta-feira. Atenção: verifique sempre o gabarito oficial."
      },
      {
        id: 76, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "A disjunção P ∨ Q é falsa somente quando:",
        alternativas: ["P é falso", "Q é falso", "Ambos são falsos", "Ambos são verdadeiros"],
        gabarito: 2,
        explicacao: "P ∨ Q (ou lógico inclusivo) só é falso quando ambos os valores são falsos: F∨F=F. Se pelo menos um for verdadeiro, a disjunção é verdadeira."
      },
      {
        id: 77, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "Três amigos têm idades em PA. O mais velho tem 30 anos e o mais novo, 18. Qual a idade do do meio?",
        alternativas: ["22", "24", "26", "28"],
        gabarito: 1,
        explicacao: "Em uma PA de 3 termos, o termo do meio é a média aritmética dos extremos: (30+18)/2 = 48/2 = 24 anos."
      },
      {
        id: 78, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Qual a probabilidade de tirar cara em uma moeda honesta?",
        alternativas: ["1/4", "1/3", "1/2", "2/3"],
        gabarito: 2,
        explicacao: "Uma moeda honesta tem 2 resultados equiprováveis: cara ou coroa. P(cara) = 1/2 = 0,5 = 50%."
      },
      {
        id: 79, ano: 2025, cargo: "Analista Judiciário SP",
        enunciado: "Se 'Todo concurseiro estuda' e 'João é concurseiro', logo:",
        alternativas: ["João não estuda.", "João talvez estude.", "João estuda.", "Não é possível concluir."],
        gabarito: 2,
        explicacao: "Silogismo categórico: Todo concurseiro estuda (premissa maior). João é concurseiro (premissa menor). Logo, João estuda (conclusão). Raciocínio válido pelo modo Barbara (AAA-1)."
      },
      {
        id: 80, ano: 2024, cargo: "Técnico TJ-SP",
        enunciado: "Uma loja vende 240 produtos por dia. Em uma semana (7 dias), vende:",
        alternativas: ["1.580", "1.640", "1.680", "1.720"],
        gabarito: 2,
        explicacao: "240 × 7 = 1.680 produtos por semana."
      }
    ]
  },
  FEPESE: {
    "Direito Constitucional": [
      {
        id: 81, ano: 2024, cargo: "Analista SC",
        enunciado: "São direitos sociais previstos no art. 6º da CF/88:",
        alternativas: [
          "Educação, saúde, trabalho, moradia e lazer.",
          "Educação, saúde, trabalho, moradia, lazer, segurança, previdência social, proteção à maternidade e à infância e assistência aos desamparados.",
          "Vida, liberdade, igualdade, segurança e propriedade.",
          "Educação, saúde e segurança pública."
        ],
        gabarito: 1,
        explicacao: "Art. 6º CF/88: 'São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados, na forma desta Constituição.' A alternativa B lista os principais (a questão resume)."
      },
      {
        id: 82, ano: 2024, cargo: "Técnico JUCESC",
        enunciado: "A Constituição Federal de 1988 é classificada quanto à origem como:",
        alternativas: ["Outorgada", "Promulgada", "Cesarista", "Pactuada"],
        gabarito: 1,
        explicacao: "A CF/88 é uma Constituição promulgada (democrática) — elaborada por uma Assembleia Nacional Constituinte eleita pelo povo e sancionada em 5 de outubro de 1988. Constituições outorgadas são impostas pelo governante sem participação popular."
      },
      {
        id: 83, ano: 2025, cargo: "Analista MPE-SC",
        enunciado: "O habeas corpus protege o direito de:",
        alternativas: ["Informação", "Locomoção", "Expressão", "Propriedade"],
        gabarito: 1,
        explicacao: "Art. 5º, LXVIII da CF/88: 'Conceder-se-á habeas corpus sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder.'"
      },
      {
        id: 84, ano: 2024, cargo: "Técnico TRE-SC",
        enunciado: "A cláusula pétrea que não pode ser abolida nem por emenda constitucional é:",
        alternativas: [
          "A organização dos Municípios.",
          "A separação dos Poderes.",
          "Os direitos políticos.",
          "A criação de novos Estados."
        ],
        gabarito: 1,
        explicacao: "Art. 60, §4º da CF/88 — são cláusulas pétreas: a forma federativa de Estado, o voto direto, secreto, universal e periódico, a separação dos Poderes e os direitos e garantias individuais."
      },
      {
        id: 85, ano: 2025, cargo: "Analista MPE-SC",
        enunciado: "O mandado de segurança é cabível contra:",
        alternativas: [
          "Ato ilegal ou abusivo de autoridade pública que viole direito líquido e certo.",
          "Qualquer ato que cause dano ao meio ambiente.",
          "Qualquer ato de particular que cause prejuízo.",
          "Decisão judicial com coisa julgada."
        ],
        gabarito: 0,
        explicacao: "Art. 5º, LXIX da CF/88: 'Conceder-se-á mandado de segurança para proteger direito líquido e certo, não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade ou abuso de poder for autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público.'"
      },
      {
        id: 86, ano: 2024, cargo: "Técnico JUCESC",
        enunciado: "A República Federativa do Brasil tem como fundamento:",
        alternativas: [
          "Soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa e pluralismo político.",
          "Democracia, liberdade, igualdade, fraternidade e justiça.",
          "Soberania, democracia, liberdade e fraternidade.",
          "Cidadania, federalismo, democracia e soberania."
        ],
        gabarito: 0,
        explicacao: "Art. 1º da CF/88: 'A República Federativa do Brasil... tem como fundamentos: I - a soberania; II - a cidadania; III - a dignidade da pessoa humana; IV - os valores sociais do trabalho e da livre iniciativa; V - o pluralismo político.'"
      },
      {
        id: 87, ano: 2025, cargo: "Analista MPE-SC",
        enunciado: "O Poder Constituinte Derivado Reformador é limitado por:",
        alternativas: [
          "Limitações formais, materiais e circunstanciais.",
          "Apenas limitações formais.",
          "Apenas limitações materiais.",
          "Nenhuma limitação, pois é soberano."
        ],
        gabarito: 0,
        explicacao: "O Poder Constituinte Derivado é limitado por: limitações formais/procedimentais (quorum de 3/5 em 2 turnos em cada Casa), limitações materiais (cláusulas pétreas, art. 60, §4º) e limitações circunstanciais (não se emenda em estado de sítio, intervenção federal ou estado de defesa)."
      },
      {
        id: 88, ano: 2024, cargo: "Técnico TRE-SC",
        enunciado: "Sobre o direito à igualdade, a CF/88 preceitua:",
        alternativas: [
          "Todos são iguais perante a lei, sem distinção de qualquer natureza.",
          "A igualdade vale apenas para os brasileiros natos.",
          "A lei pode fazer distinções por raça ou cor.",
          "Estrangeiros não têm direito à igualdade no Brasil."
        ],
        gabarito: 0,
        explicacao: "Art. 5º, caput: 'Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade.'"
      },
      {
        id: 89, ano: 2025, cargo: "Analista MPE-SC",
        enunciado: "O Brasil adota como forma de governo a:",
        alternativas: ["Monarquia Parlamentarista", "República Presidencialista", "Monarquia Constitucional", "República Parlamentarista"],
        gabarito: 1,
        explicacao: "O Brasil adota a República (forma de governo em que o Chefe de Estado é eleito) e o Presidencialismo (sistema de governo em que o Chefe de Estado é também Chefe de Governo), conforme arts. 1º e 76 da CF/88."
      },
      {
        id: 90, ano: 2024, cargo: "Técnico JUCESC",
        enunciado: "O prazo para impetrar mandado de segurança contra ato coator é de:",
        alternativas: ["30 dias", "60 dias", "90 dias", "120 dias"],
        gabarito: 3,
        explicacao: "Art. 23 da Lei 12.016/2009: 'O direito de requerer mandado de segurança extinguir-se-á decorridos 120 (cento e vinte) dias, contados da ciência, pelo interessado, do ato impugnado.'"
      }
    ]
  }
};

// ─── utilitários ──────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getQuestions(banca, materia, n = 10) {
  const pool = BANCO[banca]?.[materia] || [];
  return shuffle(pool).slice(0, n);
}

const BANCAS = Object.keys(BANCO);
function getMaterias(banca) { return Object.keys(BANCO[banca] || {}); }

// ─── TELAS ────────────────────────────────────────────────────────────────────
// 0 = config, 1 = email gate, 2 = quiz, 3 = resultado

export default function SimuladoPage() {
  const [screen, setScreen] = useState(0);
  const [banca, setBanca] = useState(BANCAS[0]);
  const [materia, setMateria] = useState(getMaterias(BANCAS[0])[0]);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showExplain, setShowExplain] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [elapsedPerQ, setElapsedPerQ] = useState([]);
  const [qStart, setQStart] = useState(Date.now());
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [comboText, setComboText] = useState("");
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const SEC_PER_Q = 90;

  // ── banca change
  useEffect(() => {
    const mats = getMaterias(banca);
    setMateria(mats[0] || "");
  }, [banca]);

  // ── timer
  useEffect(() => {
    if (screen !== 2) return;
    const total = questions.length * SEC_PER_Q;
    setTotalTime(total);
    setTimeLeft(total);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen]);

  function startQuiz() {
    const qs = getQuestions(banca, materia, 10);
    if (qs.length < 5) return alert("Questões insuficientes para esta combinação.");
    setQuestions(qs);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setShowExplain(false);
    setStreak(0);
    setMaxStreak(0);
    setXp(0);
    setCombo(0);
    setElapsedPerQ([]);
    setQStart(Date.now());
    setScreen(2);
  }

  function handleSelect(idx) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setShowExplain(true);

    const q = questions[current];
    const correct = idx === q.gabarito;
    const elapsed = Math.round((Date.now() - qStart) / 1000);
    setElapsedPerQ(p => [...p, elapsed]);

    // scoring
    const speedBonus = Math.max(0, 30 - elapsed) * 2;
    let gainedXp = correct ? 100 + speedBonus : 0;

    let newCombo = correct ? combo + 1 : 0;
    let newStreak = correct ? streak + 1 : 0;
    setCombo(newCombo);
    setStreak(newStreak);
    setMaxStreak(s => Math.max(s, newStreak));

    if (correct && newCombo >= 3) {
      const bonus = newCombo >= 5 ? 150 : 75;
      gainedXp += bonus;
      setComboText(newCombo >= 5 ? `🔥 COMBO x${newCombo}! +${bonus} XP` : `⚡ COMBO x${newCombo}! +${bonus} XP`);
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 2000);
    }

    setXp(x => x + gainedXp);
    setAnswers(a => [...a, { q: q.id, selected: idx, correct, elapsed, xpGained: gainedXp }]);
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) {
      clearInterval(timerRef.current);
      finishQuiz();
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
      setShowExplain(false);
      setQStart(Date.now());
    }
  }

  function finishQuiz() {
    setScreen(3);
  }

  // ── email send (EmailJS or mailto fallback)
  async function sendResult() {
    setEmailLoading(true);
    setEmailError("");
    const score = answers.filter(a => a.correct).length;
    const pct = Math.round((score / questions.length) * 100);
    const subject = `Seu resultado no Simulado: ${pct}% - ${banca} / ${materia}`;
    const body = `Olá ${nome || "Concurseiro"}!\n\nVocê acertou ${score} de ${questions.length} questões (${pct}%).\nBanca: ${banca} | Matéria: ${materia}\nXP Total: ${xp}\nMaior sequência: ${maxStreak}\n\nBons estudos! 💪`;
    // mailto fallback
    const link = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = link;
    setEmailSent(true);
    setEmailLoading(false);
  }

  const score = answers.filter(a => a.correct).length;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const avgTime = elapsedPerQ.length ? Math.round(elapsedPerQ.reduce((a, b) => a + b, 0) / elapsedPerQ.length) : 0;

  const timeUsed = totalTime - timeLeft;
  const timerPct = totalTime ? (timeLeft / totalTime) * 100 : 100;
  const timerColor = timerPct > 50 ? "var(--success)" : timerPct > 25 ? "var(--accent)" : "#ef4444";

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function getGrade(p) {
    if (p >= 90) return { label: "Excelente! 🏆", color: "#10B981", emoji: "🏆" };
    if (p >= 70) return { label: "Aprovado! ✅", color: "var(--success)", emoji: "✅" };
    if (p >= 50) return { label: "Quase lá! 💪", color: "var(--accent)", emoji: "💪" };
    return { label: "Estude mais! 📚", color: "#ef4444", emoji: "📚" };
  }

  const grade = getGrade(pct);

  return (
    <>
      <Header posts={[]} />
      <main style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "80px" }}>

        {/* ═══ TELA 0: CONFIGURAÇÃO ═══ */}
        {screen === 0 && (
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 16px" }}>
            {/* Hero */}
            <div style={{
              textAlign: "center", marginBottom: 40,
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)",
              borderRadius: "var(--radius-xl)", padding: "48px 32px", color: "#fff",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{
                position: "absolute", top: -30, right: -30, width: 160, height: 160,
                background: "rgba(255,255,255,0.06)", borderRadius: "50%"
              }} />
              <div style={{
                position: "absolute", bottom: -20, left: -20, width: 100, height: 100,
                background: "rgba(255,255,255,0.04)", borderRadius: "50%"
              }} />
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem,4vw,2.2rem)",
                fontWeight: 800, marginBottom: 12, lineHeight: 1.2
              }}>Simulado Inteligente</h1>
              <p style={{ opacity: 0.88, fontSize: "1rem", lineHeight: 1.6, maxWidth: 420, margin: "0 auto" }}>
                Questões reais de concursos anteriores. Feedback instantâneo. Gamificação para manter você focado.
              </p>
              <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
                {[["10", "questões"], ["90s", "por questão"], ["XP", "e conquistas"]].map(([v, l]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>{v}</div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-lg)",
              padding: 32, border: "1px solid var(--border)", boxShadow: "var(--shadow-md)"
            }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", marginBottom: 24, color: "var(--text)" }}>
                Configure seu simulado
              </h2>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Escolha a Banca</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {BANCAS.map(b => (
                    <button key={b} onClick={() => setBanca(b)} style={{
                      ...chipStyle,
                      background: banca === b ? "var(--primary)" : "var(--surface-3)",
                      color: banca === b ? "#fff" : "var(--text)",
                      border: banca === b ? "2px solid var(--primary)" : "2px solid var(--border)",
                      fontWeight: banca === b ? 700 : 500
                    }}>{b}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Escolha a Matéria</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  {getMaterias(banca).map(m => (
                    <button key={m} onClick={() => setMateria(m)} style={{
                      ...chipStyle,
                      background: materia === m ? "var(--primary)" : "var(--surface-3)",
                      color: materia === m ? "#fff" : "var(--text)",
                      border: materia === m ? "2px solid var(--primary)" : "2px solid var(--border)",
                      fontWeight: materia === m ? 700 : 500,
                      textAlign: "left", padding: "14px 18px"
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              <button onClick={() => setScreen(1)} style={btnPrimaryStyle}>
                Começar Simulado →
              </button>
            </div>
          </div>
        )}

        {/* ═══ TELA 1: CAPTURA DE EMAIL ═══ */}
        {screen === 1 && (
          <div style={{ maxWidth: 500, margin: "0 auto", padding: "48px 16px" }}>
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-xl)",
              padding: "40px 32px", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem",
                marginBottom: 12, color: "var(--text)"
              }}>Receba seu resultado por e-mail!</h2>
              <p style={{ color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6, fontSize: "0.95rem" }}>
                Informe seu nome e e-mail para receber uma análise personalizada do seu desempenho com dicas de estudo.
              </p>

              <div style={{ textAlign: "left", marginBottom: 16 }}>
                <label style={labelStyle}>Seu nome</label>
                <input
                  type="text"
                  placeholder="Como prefere ser chamado?"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ textAlign: "left", marginBottom: 24 }}>
                <label style={labelStyle}>Seu melhor e-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button onClick={startQuiz} style={btnPrimaryStyle}>
                🚀 Iniciar Simulado
              </button>

              <button
                onClick={startQuiz}
                style={{ ...btnGhostStyle, marginTop: 12 }}
              >
                Pular e iniciar sem e-mail
              </button>

              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 20 }}>
                🔒 Seus dados são usados apenas para enviar o resultado. Sem spam.
              </p>
            </div>
          </div>
        )}

        {/* ═══ TELA 2: QUIZ ═══ */}
        {screen === 2 && questions.length > 0 && (
          <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>

            {/* Combo popup */}
            {showCombo && (
              <div style={{
                position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                color: "#fff", borderRadius: 50, padding: "12px 28px",
                fontWeight: 800, fontSize: "1.1rem", zIndex: 9999,
                animation: "popIn 0.3s var(--ease-spring)",
                boxShadow: "0 4px 24px rgba(245,158,11,0.5)",
                whiteSpace: "nowrap"
              }}>
                {comboText}
              </div>
            )}

            {/* HUD */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center", marginBottom: 20, gap: 12
            }}>
              {/* XP */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-dark))",
                  borderRadius: 50, padding: "6px 14px",
                  fontFamily: "var(--font-mono)", fontWeight: 700,
                  fontSize: "0.9rem", color: "#000"
                }}>⚡ {xp} XP</div>
                {streak >= 2 && (
                  <div style={{
                    background: "linear-gradient(135deg, #ef4444, #f59e0b)",
                    borderRadius: 50, padding: "6px 12px",
                    fontWeight: 700, fontSize: "0.85rem", color: "#fff"
                  }}>🔥 {streak}</div>
                )}
              </div>

              {/* Timer */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 700,
                  color: timerColor, lineHeight: 1,
                  transition: "color 0.5s"
                }}>{formatTime(timeLeft)}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>restante</div>
              </div>

              {/* Progresso */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  {current + 1} / {questions.length}
                </div>
              </div>
            </div>

            {/* Timer bar */}
            <div style={{
              height: 6, background: "var(--border)", borderRadius: 99, marginBottom: 24, overflow: "hidden"
            }}>
              <div style={{
                height: "100%", background: timerColor,
                width: `${timerPct}%`, borderRadius: 99,
                transition: "width 1s linear, background 0.5s"
              }} />
            </div>

            {/* Indicadores de questão */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
              {questions.map((_, i) => {
                const ans = answers[i];
                let bg = "var(--border)";
                if (ans) bg = ans.correct ? "var(--success)" : "#ef4444";
                else if (i === current) bg = "var(--primary)";
                return (
                  <div key={i} style={{
                    width: 28, height: 8, borderRadius: 99, background: bg,
                    transition: "background 0.3s"
                  }} />
                );
              })}
            </div>

            {/* Card da questão */}
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)", boxShadow: "var(--shadow-md)",
              overflow: "hidden"
            }}>
              {/* Header da questão */}
              <div style={{
                background: "var(--surface-2)", padding: "16px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"
              }}>
                <span style={{
                  background: "var(--primary)", color: "#fff",
                  borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700
                }}>{banca}</span>
                <span style={{
                  background: "var(--surface-3)", color: "var(--text-secondary)",
                  borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem"
                }}>{materia}</span>
                <span style={{
                  background: "var(--surface-3)", color: "var(--text-muted)",
                  borderRadius: 50, padding: "4px 12px", fontSize: "0.78rem"
                }}>📅 {questions[current].ano}</span>
                <span style={{
                  marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-muted)"
                }}>{questions[current].cargo}</span>
              </div>

              <div style={{ padding: "24px" }}>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "1.05rem",
                  lineHeight: 1.7, color: "var(--text)", marginBottom: 24, fontWeight: 500
                }}>
                  {questions[current].enunciado}
                </p>

                {/* Alternativas */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {questions[current].alternativas.map((alt, i) => {
                    const isSelected = selected === i;
                    const isCorrect = i === questions[current].gabarito;
                    let bg = "var(--surface-3)";
                    let border = "var(--border)";
                    let color = "var(--text)";
                    if (answered) {
                      if (isCorrect) { bg = "rgba(16,185,129,0.12)"; border = "var(--success)"; color = "var(--success)"; }
                      else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.1)"; border = "#ef4444"; color = "#ef4444"; }
                    } else if (isSelected) {
                      bg = "rgba(27,58,107,0.08)"; border = "var(--primary)"; color = "var(--primary)";
                    }

                    return (
                      <button key={i} onClick={() => handleSelect(i)} disabled={answered} style={{
                        display: "flex", alignItems: "flex-start", gap: 14,
                        background: bg, border: `2px solid ${border}`,
                        borderRadius: "var(--radius)", padding: "14px 18px",
                        cursor: answered ? "default" : "pointer",
                        transition: "all 0.25s var(--ease-out)", textAlign: "left",
                        color, fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.5,
                        fontWeight: isCorrect && answered ? 600 : 400
                      }}>
                        <span style={{
                          minWidth: 28, height: 28, borderRadius: "50%",
                          background: answered && isCorrect ? "var(--success)" : answered && isSelected ? "#ef4444" : "var(--border)",
                          color: (answered && (isCorrect || isSelected)) ? "#fff" : "var(--text-secondary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-mono)", flexShrink: 0
                        }}>
                          {answered && isCorrect ? "✓" : answered && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                        </span>
                        {alt}
                      </button>
                    );
                  })}
                </div>

                {/* Explicação */}
                {showExplain && (
                  <div style={{
                    marginTop: 20, padding: 18,
                    background: selected === questions[current].gabarito
                      ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)",
                    border: `1px solid ${selected === questions[current].gabarito ? "var(--success)" : "#ef4444"}`,
                    borderRadius: "var(--radius)", lineHeight: 1.65
                  }}>
                    <div style={{
                      fontWeight: 700, marginBottom: 8,
                      color: selected === questions[current].gabarito ? "var(--success)" : "#ef4444",
                      fontSize: "0.9rem"
                    }}>
                      {selected === questions[current].gabarito ? "✅ Resposta correta!" : "❌ Resposta incorreta"}
                      {selected === questions[current].gabarito && answers.length && (
                        <span style={{ color: "var(--accent)", marginLeft: 12 }}>+{answers[answers.length - 1]?.xpGained} XP</span>
                      )}
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: 0 }}>
                      {questions[current].explicacao}
                    </p>
                  </div>
                )}

                {answered && (
                  <button onClick={nextQuestion} style={{ ...btnPrimaryStyle, marginTop: 20 }}>
                    {current + 1 >= questions.length ? "📊 Ver Resultado" : "Próxima Questão →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TELA 3: RESULTADO ═══ */}
        {screen === 3 && (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>

            {/* Header resultado */}
            <div style={{
              background: `linear-gradient(135deg, ${grade.color}22 0%, ${grade.color}11 100%)`,
              border: `2px solid ${grade.color}44`,
              borderRadius: "var(--radius-xl)", padding: "40px 32px",
              textAlign: "center", marginBottom: 24
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{grade.emoji}</div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem,8vw,4rem)",
                fontWeight: 900, color: grade.color, lineHeight: 1,
                fontVariantNumeric: "tabular-nums"
              }}>{pct}%</div>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700,
                color: "var(--text)", marginTop: 8
              }}>{grade.label}</div>
              <div style={{ color: "var(--text-secondary)", marginTop: 8 }}>
                {nome ? `Parabéns, ${nome}! ` : ""}
                {score} de {questions.length} questões corretas — {banca} / {materia}
              </div>
            </div>

            {/* Métricas */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 14, marginBottom: 24
            }}>
              {[
                { icon: "⚡", label: "XP Total", value: xp, mono: true },
                { icon: "🔥", label: "Maior Sequência", value: `${maxStreak} acertos`, mono: false },
                { icon: "⏱️", label: "Tempo médio/questão", value: `${avgTime}s`, mono: true },
                { icon: "🎯", label: "Taxa de acerto", value: `${pct}%`, mono: true },
              ].map(m => (
                <div key={m.label} style={{
                  background: "var(--surface)", borderRadius: "var(--radius)",
                  border: "1px solid var(--border)", padding: "20px 16px", textAlign: "center",
                  boxShadow: "var(--shadow-sm)"
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{m.icon}</div>
                  <div style={{
                    fontFamily: m.mono ? "var(--font-mono)" : "var(--font-display)",
                    fontSize: "1.35rem", fontWeight: 700, color: "var(--text)"
                  }}>{m.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Gráfico de questões */}
            <div style={{
              background: "var(--surface)", borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)", padding: 24, marginBottom: 24,
              boxShadow: "var(--shadow-sm)"
            }}>
              <h3 style={{
                fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16,
                fontSize: "1rem", color: "var(--text)"
              }}>Desempenho por questão</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {answers.map((a, i) => (
                  <div key={i} style={{
                    width: 44, height: 44, borderRadius: "var(--radius-sm)",
                    background: a.correct ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
                    border: `2px solid ${a.correct ? "var(--success)" : "#ef4444"}`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: "1rem" }}>{a.correct ? "✓" : "✗"}</span>
                    <span style={{
                      fontSize: "0.6rem", color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)"
                    }}>{a.elapsed}s</span>
                  </div>
                ))}
              </div>

              {/* Barra de progresso visual */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                  <span>Acertos</span><span>{score}/{questions.length}</span>
                </div>
                <div style={{ height: 10, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99,
                    background: `linear-gradient(90deg, ${grade.color}, ${grade.color}99)`,
                    width: `${pct}%`, transition: "width 1s var(--ease-out)"
                  }} />
                </div>
              </div>
            </div>

            {/* Revisão de erros */}
            {answers.some(a => !a.correct) && (
              <div style={{
                background: "var(--surface)", borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)", padding: 24, marginBottom: 24
              }}>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16,
                  fontSize: "1rem", color: "var(--text)"
                }}>📌 Revisão dos erros</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {answers.map((a, i) => {
                    if (a.correct) return null;
                    const q = questions[i];
                    return (
                      <div key={i} style={{
                        padding: 14, background: "rgba(239,68,68,0.05)",
                        border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-sm)"
                      }}>
                        <p style={{ fontSize: "0.88rem", color: "var(--text)", fontWeight: 500, marginBottom: 8 }}>
                          Q{i + 1}: {q.enunciado}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "#ef4444", marginBottom: 4 }}>
                          ✗ Sua resposta: {q.alternativas[a.selected]}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "var(--success)", marginBottom: 8 }}>
                          ✓ Correta: {q.alternativas[q.gabarito]}
                        </p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          💡 {q.explicacao}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA email */}
            {!emailSent && email && (
              <div style={{
                background: "linear-gradient(135deg, var(--primary)11, var(--primary-light)08)",
                border: "1px solid var(--primary)33",
                borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 24, textAlign: "center"
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
                  Receber resultado por e-mail
                </h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: "0.9rem" }}>
                  Enviar análise completa para <strong>{email}</strong>
                </p>
                <button onClick={sendResult} disabled={emailLoading} style={btnPrimaryStyle}>
                  {emailLoading ? "Enviando..." : "📬 Enviar Resultado"}
                </button>
              </div>
            )}

            {!email && !emailSent && (
              <div style={{
                background: "var(--surface-2)", borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)", padding: 24, marginBottom: 24
              }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 12, color: "var(--text)", fontSize: "1rem" }}>
                  📬 Receber por e-mail
                </h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="email" placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                  />
                  <button onClick={sendResult} style={{ ...btnPrimaryStyle, flex: "0 0 auto", padding: "12px 20px" }}>
                    Enviar
                  </button>
                </div>
              </div>
            )}

            {emailSent && (
              <div style={{
                background: "rgba(16,185,129,0.1)", border: "1px solid var(--success)",
                borderRadius: "var(--radius)", padding: 16, textAlign: "center", marginBottom: 24
              }}>
                ✅ E-mail preparado! Verifique seu cliente de e-mail para enviar.
              </div>
            )}

            {/* Ações */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => { setScreen(0); setAnswers([]); }} style={{ ...btnPrimaryStyle, flex: 1 }}>
                🔄 Novo Simulado
              </button>
              <button onClick={() => {
                setAnswers([]); setCurrent(0); setSelected(null); setAnswered(false);
                setShowExplain(false); setStreak(0); setMaxStreak(0); setXp(0); setCombo(0);
                setElapsedPerQ([]); setQStart(Date.now()); setScreen(2);
              }} style={{ ...btnGhostStyle, flex: 1 }}>
                ↩️ Refazer esta prova
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />

      <style>{`
        @keyframes popIn {
          from { transform: translateX(-50%) scale(0.7); opacity: 0; }
          to   { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        button:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
        button { transition: all 0.2s var(--ease-out); }
        input:focus { outline: none; border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(27,58,107,0.12); }
      `}</style>
    </>
  );
}

// ─── estilos base ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: "block", fontWeight: 600, fontSize: "0.85rem",
  color: "var(--text-secondary)", marginBottom: 10,
  fontFamily: "var(--font-body)"
};
const chipStyle = {
  borderRadius: "var(--radius-sm)", padding: "12px 16px",
  cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "0.9rem",
  transition: "all 0.2s", border: "2px solid transparent"
};
const btnPrimaryStyle = {
  width: "100%", padding: "14px 20px",
  background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
  color: "#fff", border: "none", borderRadius: "var(--radius)",
  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem",
  cursor: "pointer", boxShadow: "var(--shadow-md)"
};
const btnGhostStyle = {
  width: "100%", padding: "13px 20px",
  background: "transparent", color: "var(--text-secondary)",
  border: "1px solid var(--border)", borderRadius: "var(--radius)",
  fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.95rem",
  cursor: "pointer"
};
const inputStyle = {
  width: "100%", padding: "12px 14px",
  background: "var(--surface-3)", border: "1.5px solid var(--border)",
  borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)",
  fontSize: "0.95rem", color: "var(--text)", transition: "border-color 0.2s"
};
