/**
 * lib/quiz-bank.js — banco ESTÁTICO do simulado (v2)
 *
 * Mudanças em relação à v1:
 *  - Questões ORIGINAIS no estilo de cada banca. Nada de "ano/cargo" inventado:
 *    a v1 atribuía as questões a provas reais que nunca existiram.
 *  - CEBRASPE usa o formato real da banca: itens Certo/Errado.
 *  - 5 bancas × 4–5 matérias (120 questões), cada uma com assunto, nível e
 *    fundamento (lei/artigo/regra) para o aluno conferir.
 *  - Alternativas de múltipla escolha são embaralhadas a cada sorteio.
 *  - Mesmo módulo no servidor (fallback da IA) e no cliente.
 *
 * Schema: { id, banca, materia, assunto, nivel(1-3), formato("ce"|"mc"),
 *           enunciado, alternativas[], gabarito, explicacao, fonte }
 */

const mc = (assunto, nivel, enunciado, alternativas, gabarito, explicacao, fonte = "") =>
  ({ assunto, nivel, formato: "mc", enunciado, alternativas, gabarito, explicacao, fonte });
const ce = (assunto, nivel, enunciado, certo, explicacao, fonte = "") =>
  ({ assunto, nivel, formato: "ce", enunciado, alternativas: ["Certo", "Errado"], gabarito: certo ? 0 : 1, explicacao, fonte });

const RAW = {
  CEBRASPE: {
    "Português": [
      ce("Crase", 1, "No trecho \"Refiro-me à funcionária que chegou\", o emprego do sinal indicativo de crase está correto.", true,
        "O verbo \"referir-se\" exige a preposição \"a\", e \"funcionária\" admite o artigo \"a\". Preposição + artigo = \"à\".", "Regência + crase"),
      ce("Crase", 1, "Em \"Fui à pé até a escola\", o sinal de crase foi empregado corretamente.", false,
        "Não há crase diante de palavra masculina: o correto é \"a pé\". A crase com masculino só ocorre quando há palavra feminina subentendida, como em \"à moda de\".", "Crase"),
      ce("Concordância", 2, "A frase \"Fazem dez anos que não o vejo\" está de acordo com a norma-padrão quanto à concordância verbal.", false,
        "\"Fazer\" indicando tempo decorrido é impessoal e fica na 3ª pessoa do singular: \"Faz dez anos que não o vejo\".", "Verbos impessoais"),
      ce("Regência", 2, "Em \"Assisti ao filme duas vezes\", o verbo \"assistir\", no sentido de ver, é transitivo indireto e exige a preposição \"a\".", true,
        "Assistir no sentido de ver/presenciar rege \"a\". No sentido de prestar assistência, é transitivo direto.", "Regência verbal"),
      ce("Pontuação", 2, "Em \"Os candidatos, que estudaram muito, foram aprovados\", as vírgulas isolam uma oração adjetiva explicativa, o que indica que todos os candidatos estudaram muito.", true,
        "Oração adjetiva explicativa vem entre vírgulas e se aplica a todo o grupo. Sem vírgulas, seria restritiva: só os que estudaram muito.", "Pontuação"),
      ce("Ortografia", 1, "Segundo o Acordo Ortográfico em vigor, as palavras \"ideia\" e \"voo\" são grafadas sem acento.", true,
        "O acordo eliminou o acento dos ditongos abertos \"ei\" e \"oi\" em paroxítonas e o circunflexo em \"oo\".", "Acordo Ortográfico"),
      ce("Classes de palavras", 1, "Em \"Ele estuda mais que eu\", a palavra \"mais\" é uma conjunção adversativa.", false,
        "Aqui, \"mais\" é advérbio de intensidade em comparação. A conjunção adversativa é \"mas\".", "Mas × mais"),
      ce("Coesão", 2, "Em \"O governo anunciou medidas, porém a inflação continuou alta\", a substituição de \"porém\" por \"todavia\" preserva o sentido e a correção gramatical do período.", true,
        "\"Porém\" e \"todavia\" são conjunções adversativas, ambas indicam oposição entre as orações.", "Conectivos"),
    ],
    "Raciocínio Lógico": [
      ce("Negação", 2, "A negação da proposição \"Todos os candidatos foram aprovados\" é \"Nenhum candidato foi aprovado\".", false,
        "A negação de \"todo A é B\" é \"algum A não é B\", ou seja, \"pelo menos um candidato não foi aprovado\".", "Negação de quantificadores"),
      ce("Equivalência", 2, "A proposição \"Se chove, então a rua fica molhada\" é equivalente a \"Se a rua não fica molhada, então não chove\".", true,
        "É a contrapositiva: P→Q ≡ ¬Q→¬P.", "Equivalências"),
      ce("Conectivos", 1, "A proposição P∨Q (disjunção) é falsa somente quando P e Q são ambas falsas.", true,
        "O \"ou\" inclusivo só é falso quando os dois componentes são falsos.", "Tabela-verdade"),
      ce("Conjuntos", 2, "Em um grupo de 30 pessoas, 18 gostam de A e 15 gostam de B. Se todos gostam de pelo menos um dos dois, então exatamente 3 pessoas gostam de ambos.", true,
        "|A∪B| = |A| + |B| − |A∩B| → 30 = 18 + 15 − x → x = 3.", "Inclusão-exclusão"),
      ce("Condicional", 1, "Se a proposição P→Q é falsa, então P é verdadeira e Q é falsa.", true,
        "A condicional só é falsa na combinação V→F.", "Tabela-verdade"),
      ce("Probabilidade", 1, "Ao lançar um dado honesto de seis faces, a probabilidade de obter um número par é igual a 1/3.", false,
        "Há 3 faces pares (2, 4, 6) em 6: 3/6 = 1/2.", "Probabilidade simples"),
      ce("Progressões", 2, "Em uma progressão aritmética de três termos cujos extremos são 18 e 30, o termo central é 24.", true,
        "Em uma PA de 3 termos, o central é a média dos extremos: (18 + 30)/2 = 24.", "PA"),
      ce("Negação", 3, "A negação de \"P e Q\" é \"não P e não Q\".", false,
        "Pelas leis de De Morgan, ¬(P∧Q) ≡ ¬P ∨ ¬Q. A negação da conjunção é uma disjunção.", "De Morgan"),
    ],
    "Direito Constitucional": [
      ce("Remédios constitucionais", 1, "O habeas corpus é cabível sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder.", true,
        "É a redação do art. 5º, LXVIII, da CF/88.", "CF, art. 5º, LXVIII"),
      ce("Remédios constitucionais", 2, "O mandado de segurança protege direito líquido e certo, não amparado por habeas corpus ou habeas data, quando o responsável pela ilegalidade ou abuso de poder for autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público.", true,
        "Art. 5º, LXIX, da CF/88.", "CF, art. 5º, LXIX"),
      ce("Direitos individuais", 2, "A casa é asilo inviolável do indivíduo, e nela ninguém pode penetrar sem consentimento do morador, salvo em caso de flagrante delito, desastre ou para prestar socorro, ou, durante o dia, por determinação judicial.", true,
        "Art. 5º, XI. Note que a determinação judicial só vale durante o dia.", "CF, art. 5º, XI"),
      ce("Cláusulas pétreas", 2, "A separação dos Poderes não é cláusula pétrea, podendo ser abolida por emenda constitucional.", false,
        "O art. 60, §4º, III, protege a separação dos Poderes: não será objeto de deliberação proposta tendente a aboli-la.", "CF, art. 60, §4º"),
      ce("Nacionalidade", 2, "Os cargos de Ministro do Supremo Tribunal Federal e de oficial das Forças Armadas são privativos de brasileiro nato.", true,
        "Art. 12, §3º, IV e VI. Também são privativos o de Presidente e Vice, Presidentes da Câmara e do Senado, carreira diplomática e Ministro de Estado da Defesa.", "CF, art. 12, §3º"),
      ce("Poder constituinte derivado", 2, "A proposta de emenda à Constituição será aprovada, em cada Casa do Congresso Nacional, em dois turnos, se obtiver, em ambos, três quintos dos votos dos respectivos membros.", true,
        "Art. 60, §2º, da CF/88.", "CF, art. 60, §2º"),
      ce("Poder constituinte derivado", 2, "A Constituição Federal pode ser emendada durante a vigência de intervenção federal, de estado de defesa ou de estado de sítio.", false,
        "Art. 60, §1º: a Constituição não poderá ser emendada na vigência dessas medidas excepcionais (limitação circunstancial).", "CF, art. 60, §1º"),
      ce("Poder Executivo", 1, "O mandato do Presidente da República é de quatro anos, sendo permitida uma única reeleição para o período subsequente.", true,
        "Art. 82 combinado com o art. 14, §5º, da CF/88.", "CF, arts. 14, §5º, e 82"),
    ],
    "Direito Administrativo": [
      ce("Princípios", 1, "A legalidade, a impessoalidade, a moralidade, a publicidade e a eficiência são princípios expressos no caput do art. 37 da CF/88.", true,
        "É o conhecido \"LIMPE\" do art. 37, caput.", "CF, art. 37, caput"),
      ce("Princípios", 1, "Em razão do princípio da legalidade, a Administração Pública só pode fazer o que a lei autoriza ou determina.", true,
        "Ao contrário do particular, que pode fazer tudo que a lei não proíbe, a Administração só atua mediante prévia autorização legal.", "Legalidade estrita"),
      ce("Atos administrativos", 2, "A revogação de um ato administrativo ocorre por razões de legalidade e produz efeitos retroativos (ex tunc).", false,
        "Por ilegalidade, o ato é anulado, com efeitos ex tunc. A revogação decorre de conveniência e oportunidade, com efeitos ex nunc.", "Anulação × revogação"),
      ce("Atos administrativos", 1, "A Administração pode anular seus próprios atos quando eivados de vícios que os tornam ilegais.", true,
        "É o princípio da autotutela, consolidado na Súmula 473 do STF.", "Súmula 473 STF"),
      ce("Processo administrativo", 2, "O direito da Administração de anular os atos administrativos dos quais decorram efeitos favoráveis aos destinatários decai em cinco anos, contados da data em que foram praticados, salvo comprovada má-fé.", true,
        "Art. 54 da Lei 9.784/1999.", "Lei 9.784/99, art. 54"),
      ce("Licitações", 2, "A tomada de preços e o convite continuam sendo modalidades de licitação previstas na Lei 14.133/2021, ao lado do pregão e da concorrência.", false,
        "A Lei 14.133/2021 prevê pregão, concorrência, concurso, leilão e diálogo competitivo. Tomada de preços e convite deixaram de existir.", "Lei 14.133/21, art. 28"),
      ce("Organização administrativa", 1, "As empresas públicas e as sociedades de economia mista integram a administração pública indireta.", true,
        "Compõem a administração indireta: autarquias, fundações públicas, empresas públicas e sociedades de economia mista.", "DL 200/67"),
      ce("Responsabilidade civil", 2, "Como regra, a Constituição adota a teoria do risco administrativo para a responsabilidade do Estado por danos que seus agentes, nessa qualidade, causarem a terceiros.", true,
        "Art. 37, §6º: a responsabilidade é objetiva, com direito de regresso contra o agente nos casos de dolo ou culpa.", "CF, art. 37, §6º"),
    ],
    "Informática": [
      ce("Segurança", 1, "Phishing é uma técnica de fraude na qual o atacante tenta induzir a vítima a fornecer dados sensíveis, geralmente por meio de mensagens ou sites falsos.", true,
        "O phishing explora engenharia social para obter senhas, dados bancários e outros dados sensíveis.", "Engenharia social"),
      ce("Segurança", 1, "O firewall é um mecanismo de segurança que controla o tráfego de rede com base em regras previamente definidas.", true,
        "Pode ser software ou hardware e permite ou bloqueia conexões conforme regras.", "Firewall"),
      ce("Planilhas", 1, "No Microsoft Excel, a fórmula =SOMA(A1:A5) calcula a soma dos valores das células de A1 até A5.", true,
        "O intervalo A1:A5 compreende todas as células entre A1 e A5, inclusive.", "Excel"),
      ce("Internet", 1, "O protocolo HTTPS utiliza criptografia para proteger a comunicação entre o navegador e o servidor.", true,
        "O \"S\" indica a camada segura (TLS), que cifra o tráfego.", "HTTPS/TLS"),
      ce("Backup", 2, "O backup incremental copia todos os arquivos selecionados, independentemente de terem sido alterados desde o último backup.", false,
        "O incremental copia apenas o que mudou desde o último backup (de qualquer tipo). Quem copia tudo é o backup completo (full).", "Tipos de backup"),
      ce("Segurança", 2, "O vírus de computador é um tipo de malware que não depende de hospedeiro para se propagar, diferenciando-se do worm exatamente por isso.", false,
        "É o contrário: o vírus precisa de um arquivo hospedeiro e da execução dele; o worm se propaga sozinho pela rede.", "Malwares"),
      ce("Redes", 1, "Em redes TCP/IP, o DNS é responsável por traduzir nomes de domínio em endereços IP.", true,
        "É o \"catálogo telefônico\" da internet.", "DNS"),
      ce("Criptografia", 2, "A criptografia assimétrica utiliza um par de chaves: uma pública e uma privada.", true,
        "O que a chave pública cifra, só a privada decifra (sigilo); a assinatura digital faz o caminho inverso.", "Criptografia"),
    ],
  },

  FGV: {
    "Português": [
      mc("Crase", 2, "Assinale a opção em que o sinal indicativo de crase está empregado de acordo com a norma-padrão.",
        ["Chegamos à Brasília na manhã de ontem.", "Entreguei o documento à diretora.", "Ele começou o trabalho à partir de hoje.", "Dirigi-me à ela com cautela.", "Estamos dispostos à ajudar."], 1,
        "\"Entregar a alguém\" + \"a diretora\" → à diretora. Brasília não admite artigo (\"a Brasília\"); crase não ocorre antes de verbo, de pronome pessoal nem em \"a partir de\".", "Crase"),
      mc("Concordância", 2, "Assinale a frase que está de acordo com a norma-padrão quanto à concordância.",
        ["Haviam muitos candidatos na fila.", "Fazem dois anos que me formei.", "Houve muitas reclamações sobre o edital.", "Devem haver soluções para o problema.", "Existe muitos problemas no processo."], 2,
        "\"Haver\" no sentido de existir é impessoal (\"Havia\", \"Houve\", \"Deve haver\"). \"Fazer\" indicando tempo também é impessoal. \"Existir\" é pessoal e concorda com o sujeito.", "Verbo haver"),
      mc("Emprego de palavras", 1, "Assinale a opção em que o emprego de \"mau\" ou \"mal\" está correto.",
        ["Ele é um mal aluno.", "Ela passou mau durante a prova.", "O mau tempo atrapalhou a viagem.", "Ele agiu muito mau com os colegas.", "Chegou de mal humor à reunião."], 2,
        "\"Mau\" é adjetivo (oposto de bom): mau tempo, mau aluno, mau humor. \"Mal\" é advérbio (oposto de bem): agiu mal, passou mal.", "Mal × mau"),
      mc("Regência", 2, "Assinale a opção que está de acordo com a norma-padrão quanto à regência do verbo \"preferir\".",
        ["Prefiro estudar do que trabalhar.", "Prefiro mais estudar que trabalhar.", "Prefiro estudar a trabalhar.", "Prefiro mais o estudo do que o trabalho.", "Prefiro estudar que trabalhar."], 2,
        "\"Preferir\" rege a preposição \"a\" e dispensa \"mais\" e \"do que\": prefiro uma coisa A outra.", "Regência verbal"),
      mc("Orações subordinadas", 2, "Em \"Embora tenha estudado muito, o candidato não foi aprovado\", a oração iniciada por \"embora\" expressa ideia de:",
        ["causa", "condição", "concessão", "conformidade", "finalidade"], 2,
        "\"Embora\" introduz oração subordinada adverbial concessiva: indica um fato que seria obstáculo, mas não impede o que se afirma na principal.", "Orações adverbiais"),
    ],
    "Direito Constitucional": [
      mc("Direitos individuais", 2, "A Constituição dispõe que a casa é asilo inviolável do indivíduo. Durante a noite, é permitido penetrar na casa sem consentimento do morador em caso de:",
        ["determinação judicial", "flagrante delito, desastre ou para prestar socorro", "mandado expedido pelo Ministério Público", "ordem de autoridade policial", "suspeita fundada de prática de crime"], 1,
        "Art. 5º, XI. À noite, só flagrante delito, desastre ou socorro. Determinação judicial vale apenas durante o dia.", "CF, art. 5º, XI"),
      mc("Direito de reunião", 1, "Segundo a CF/88, para que as pessoas se reúnam pacificamente, sem armas, em locais abertos ao público, é exigido:",
        ["prévia autorização da autoridade competente", "licença judicial prévia", "prévio aviso à autoridade competente", "registro prévio em cartório", "nenhuma comunicação prévia, em qualquer hipótese"], 2,
        "Art. 5º, XVI: independe de autorização, desde que não frustre outra reunião convocada para o mesmo local, sendo exigido prévio aviso.", "CF, art. 5º, XVI"),
      mc("Remédios constitucionais", 2, "O mandado de segurança coletivo pode ser impetrado por:",
        ["qualquer cidadão", "partido político com representação no Congresso Nacional", "apenas o Ministério Público", "apenas a Defensoria Pública", "qualquer pessoa jurídica de direito privado, independentemente do tempo de constituição"], 1,
        "Art. 5º, LXX: partido político com representação no Congresso e organização sindical, entidade de classe ou associação em funcionamento há pelo menos um ano.", "CF, art. 5º, LXX"),
      mc("Remédios constitucionais", 2, "Qualquer cidadão é parte legítima para propor ação popular. Salvo comprovada má-fé, o autor fica isento de:",
        ["qualquer isenção, devendo arcar com todas as despesas", "apenas das custas judiciais", "custas judiciais e do ônus da sucumbência", "apenas dos honorários advocatícios", "apenas das despesas com perícia"], 2,
        "Art. 5º, LXXIII: isento de custas judiciais e do ônus da sucumbência, salvo comprovada má-fé.", "CF, art. 5º, LXXIII"),
      mc("Poder Legislativo", 1, "O mandato dos Senadores da República é de:",
        ["4 anos", "6 anos", "8 anos", "10 anos", "12 anos"], 2,
        "Art. 46, §1º: o mandato é de oito anos, com renovação de quatro em quatro anos, alternadamente, por um e dois terços.", "CF, art. 46"),
    ],
    "Direito Administrativo": [
      mc("Atos administrativos", 2, "Um ato administrativo válido tornou-se inconveniente ao interesse público. Nessa situação, a Administração deve:",
        ["anulá-lo, com efeitos retroativos", "revogá-lo, com efeitos a partir da revogação", "convalidá-lo", "declará-lo nulo de pleno direito", "ratificá-lo"], 1,
        "Ato válido que se torna inconveniente é revogado (mérito administrativo), com efeitos ex nunc. Anulação é para atos ilegais.", "Revogação"),
      mc("Atos administrativos", 1, "Um ato praticado por agente que não tinha atribuição legal para praticá-lo apresenta vício no elemento:",
        ["forma", "motivo", "competência", "objeto", "finalidade"], 2,
        "Competência é o poder legal conferido ao agente para praticar o ato. Ato de quem não a tem é viciado nesse elemento.", "Elementos do ato"),
      mc("Licitações", 2, "Não é modalidade de licitação prevista na Lei 14.133/2021:",
        ["pregão", "concorrência", "concurso", "leilão", "tomada de preços"], 4,
        "As modalidades são pregão, concorrência, concurso, leilão e diálogo competitivo (art. 28). Tomada de preços e convite foram extintos.", "Lei 14.133/21, art. 28"),
      mc("Processo administrativo", 2, "Salvo disposição legal específica, o prazo para interposição de recurso administrativo, contado da ciência ou divulgação oficial da decisão, é de:",
        ["3 dias", "5 dias", "10 dias", "15 dias", "30 dias"], 2,
        "Art. 59 da Lei 9.784/1999: dez dias.", "Lei 9.784/99, art. 59"),
      mc("Responsabilidade civil", 2, "A responsabilidade civil do Estado por danos causados por seus agentes a terceiros é, como regra:",
        ["subjetiva, dependendo sempre de prova de culpa", "objetiva, na modalidade risco administrativo", "objetiva, na modalidade risco integral em todos os casos", "inexistente quando o ato é lícito", "subsidiária à do agente causador do dano"], 1,
        "Art. 37, §6º, da CF: pessoas jurídicas de direito público e privadas prestadoras de serviço público respondem objetivamente, com ação regressiva contra o agente em caso de dolo ou culpa.", "CF, art. 37, §6º"),
    ],
    "Raciocínio Lógico": [
      mc("Equivalência", 2, "A proposição \"Se Ana estuda, então Ana passa\" é logicamente equivalente a:",
        ["Se Ana passa, então Ana estuda.", "Se Ana não estuda, então Ana não passa.", "Se Ana não passa, então Ana não estuda.", "Ana estuda e não passa.", "Ana não estuda ou não passa."], 2,
        "Uma equivalente da condicional é a contrapositiva: P→Q ≡ ¬Q→¬P.", "Equivalências"),
      mc("Negação", 2, "A negação de \"Todos os servidores chegaram no horário\" é:",
        ["Nenhum servidor chegou no horário.", "Algum servidor não chegou no horário.", "Algum servidor chegou no horário.", "Todos os servidores chegaram atrasados.", "Nenhum servidor chegou atrasado."], 1,
        "A negação de \"todo A é B\" é \"algum A não é B\".", "Negação de quantificadores"),
      mc("Porcentagem", 2, "Um produto custa R$ 200,00. Seu preço sofre aumento de 20% e, em seguida, desconto de 20% sobre o novo preço. O preço final é:",
        ["R$ 200,00", "R$ 198,00", "R$ 192,00", "R$ 190,00", "R$ 184,00"], 2,
        "200 × 1,2 = 240; 240 × 0,8 = 192. Aumento e desconto de mesmo percentual não se anulam.", "Porcentagem sucessiva"),
      mc("Análise combinatória", 2, "Quantas senhas de 3 algarismos distintos podem ser formadas com os algarismos 1, 2, 3, 4 e 5?",
        ["15", "30", "60", "120", "125"], 2,
        "Arranjo: 5 × 4 × 3 = 60.", "Princípio multiplicativo"),
      mc("Regra de três", 2, "Três impressoras idênticas imprimem 900 folhas em 1 hora. Funcionando nesse mesmo ritmo, cinco dessas impressoras imprimem em 30 minutos:",
        ["450 folhas", "600 folhas", "750 folhas", "900 folhas", "1.500 folhas"], 2,
        "Cada impressora faz 300 folhas/hora. 5 impressoras = 1.500 folhas/hora; em meia hora, 750 folhas.", "Regra de três composta"),
    ],
  },

  FCC: {
    "Português": [
      mc("Concordância", 2, "Está de acordo com a norma-padrão a seguinte frase:",
        ["Existe muitos motivos para a revisão do prazo.", "Fazem anos que não nos vemos.", "Haviam dúvidas sobre o prazo do edital.", "Deve haver soluções para o impasse.", "Houveram erros no relatório final."], 3,
        "\"Haver\" (existir) é impessoal; com verbo auxiliar, o auxiliar também fica no singular: \"deve haver\". \"Existe\" deveria estar no plural.", "Verbo haver"),
      mc("Pontuação", 2, "Está correta a pontuação da frase:",
        ["O diretor, anunciou as novas regras.", "Os servidores, que chegaram atrasados, foram advertidos.", "O prefeito inaugurou a obra, e, o governador compareceu.", "Maria, e João chegaram cedo.", "Os alunos que, estudaram foram aprovados."], 1,
        "Só a alternativa B usa vírgulas para isolar oração adjetiva explicativa. As demais separam sujeito do verbo ou usam vírgula entre termos que não a admitem.", "Vírgula"),
      mc("Vocabulário", 1, "No contexto jurídico-administrativo, \"prolixo\" se aplica a um texto:",
        ["conciso", "extenso em demasia, redundante", "claro e objetivo", "puramente técnico", "ambíguo"], 1,
        "Prolixo é o que se alonga além do necessário, com repetições. O oposto é conciso.", "Semântica"),
      mc("Crase", 2, "Há emprego obrigatório do sinal indicativo de crase em:",
        ["Referiu-se a ela com respeito.", "Fomos a Roma em janeiro.", "Entregue o laudo à Secretaria de Saúde.", "Voltou a casa depois do expediente.", "Falou a todos os presentes."], 2,
        "\"Entregue a (prep.) a (art.) Secretaria\" → à. Não há crase antes de pronome pessoal, de cidades sem artigo, de \"casa\" sem determinação nem de pronome indefinido.", "Crase"),
      mc("Colocação pronominal", 3, "Está de acordo com a norma-padrão quanto à colocação do pronome:",
        ["Me disseram a verdade.", "Disseram-me a verdade.", "Não disseram-me a verdade.", "Quem disse-me isso?", "Tudo que disseram-me era mentira."], 1,
        "Não se inicia oração com pronome oblíquo átono. Palavras negativas, o pronome \"quem\" e o relativo \"que\" atraem a próclise.", "Colocação pronominal"),
    ],
    "Direito Constitucional": [
      mc("Cláusulas pétreas", 2, "Nos termos da CF/88, não será objeto de deliberação a proposta de emenda tendente a abolir:",
        ["o sistema de governo presidencialista", "a forma federativa de Estado", "o número de ministros do STF", "a organização dos Municípios", "o prazo do mandato presidencial"], 1,
        "Art. 60, §4º: forma federativa de Estado; voto direto, secreto, universal e periódico; separação dos Poderes; direitos e garantias individuais.", "CF, art. 60, §4º"),
      mc("Direitos sociais", 2, "Não consta expressamente do rol de direitos sociais do art. 6º da Constituição Federal:",
        ["transporte", "alimentação", "propriedade", "lazer", "moradia"], 2,
        "O art. 6º traz educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência social, proteção à maternidade e à infância e assistência aos desamparados. Propriedade é direito individual (art. 5º).", "CF, art. 6º"),
      mc("Organização do Estado", 1, "Nos termos da Constituição Federal, a organização político-administrativa da República Federativa do Brasil compreende:",
        ["a União e os Estados, apenas", "a União, os Estados e os Municípios, apenas", "a União, os Estados, o Distrito Federal e os Municípios, todos autônomos", "os Estados, os Municípios e os Territórios", "a União, os Estados, os Territórios e os Municípios"], 2,
        "Art. 18, caput: a União, os Estados, o Distrito Federal e os Municípios, todos autônomos, nos termos da Constituição.", "CF, art. 18"),
      mc("Direitos políticos", 2, "O alistamento eleitoral e o voto são facultativos para:",
        ["os maiores de sessenta e cinco anos", "os maiores de setenta anos", "os estrangeiros residentes", "os maiores de dezoito anos", "os militares conscritos"], 1,
        "Art. 14, §1º, II: facultativos para analfabetos, maiores de 70 anos e maiores de 16 e menores de 18 anos.", "CF, art. 14, §1º"),
      mc("Direitos políticos", 1, "A idade mínima para ser candidato a Senador da República é de:",
        ["18 anos", "21 anos", "30 anos", "35 anos", "40 anos"], 3,
        "Art. 14, §3º, VI, a: 35 anos para Presidente, Vice-Presidente e Senador; 30 para Governador; 21 para Deputado, Prefeito e juiz de paz; 18 para Vereador.", "CF, art. 14, §3º"),
    ],
    "Direito Administrativo": [
      mc("Lei 8.112/90", 1, "Pela Lei 8.112/1990, é requisito básico para a investidura em cargo público ter idade mínima de:",
        ["16 anos", "18 anos", "21 anos", "25 anos", "30 anos"], 1,
        "Art. 5º, V: idade mínima de dezoito anos.", "Lei 8.112/90, art. 5º"),
      mc("Lei 8.112/90", 1, "O prazo para tomar posse em cargo público federal, contado da publicação do ato de provimento, é de:",
        ["15 dias", "20 dias", "30 dias", "45 dias", "60 dias"], 2,
        "Art. 13, §1º: trinta dias.", "Lei 8.112/90, art. 13"),
      mc("Lei 8.112/90", 1, "Tomada a posse, o prazo para o servidor entrar em exercício é de:",
        ["5 dias", "10 dias", "15 dias", "30 dias", "60 dias"], 2,
        "Art. 15, §1º: quinze dias contados da data da posse.", "Lei 8.112/90, art. 15"),
      mc("Licitações", 2, "Pela Lei 14.133/2021, a modalidade de licitação obrigatória para a aquisição de bens e serviços comuns é:",
        ["concorrência", "concurso", "leilão", "diálogo competitivo", "pregão"], 4,
        "Art. 6º, XLI: o pregão é a modalidade obrigatória para bens e serviços comuns, com critério de julgamento de menor preço ou maior desconto.", "Lei 14.133/21, art. 6º, XLI"),
      mc("Servidores públicos", 2, "Nos termos do art. 41 da CF, são estáveis após quantos anos de efetivo exercício os servidores nomeados para cargo de provimento efetivo em virtude de concurso público?",
        ["1 ano", "2 anos", "3 anos", "5 anos", "10 anos"], 2,
        "Art. 41, caput, na redação da EC 19/1998: três anos, além de avaliação especial de desempenho.", "CF, art. 41"),
    ],
    "Informática": [
      mc("Planilhas", 1, "Em uma planilha do Excel, as células A1, A2, A3 e A4 contêm os valores 2, 4, 6 e 8. O resultado de =MÉDIA(A1:A4) é:",
        ["4", "5", "6", "10", "20"], 1,
        "(2 + 4 + 6 + 8) / 4 = 20 / 4 = 5.", "Excel"),
      mc("Windows", 1, "No Windows, a combinação de teclas usada para copiar o item selecionado para a Área de Transferência é:",
        ["Ctrl + V", "Ctrl + X", "Ctrl + C", "Ctrl + Z", "Ctrl + A"], 2,
        "Ctrl+C copia; Ctrl+X recorta; Ctrl+V cola; Ctrl+Z desfaz; Ctrl+A seleciona tudo.", "Atalhos"),
      mc("Segurança", 2, "O tipo de malware que criptografa os arquivos do usuário e exige pagamento para liberar o acesso é o:",
        ["spyware", "adware", "keylogger", "ransomware", "rootkit"], 3,
        "Ransomware sequestra dados mediante criptografia e cobra resgate.", "Malwares"),
      mc("Navegadores", 2, "A navegação em janela anônima (ou privada) de um navegador:",
        ["impede que o provedor de internet veja os sites acessados", "não registra, no próprio dispositivo, o histórico de navegação da sessão", "torna o usuário anônimo para todos os sites", "criptografa todo o tráfego de rede", "impede o download de arquivos"], 1,
        "Ela apenas evita guardar histórico, cookies e dados de formulário no dispositivo. Provedor, empregador e sites visitados ainda podem identificar o acesso.", "Navegadores"),
      mc("Correio eletrônico", 1, "O protocolo utilizado para o ENVIO de mensagens de correio eletrônico é o:",
        ["POP3", "IMAP", "SMTP", "FTP", "HTTP"], 2,
        "SMTP envia; POP3 e IMAP recebem/leem as mensagens.", "E-mail"),
    ],
  },

  VUNESP: {
    "Português": [
      mc("Regência", 1, "Assinale a alternativa em que a regência verbal está de acordo com a norma-padrão.",
        ["Aspiramos o cargo de analista.", "Aspiramos ao cargo de analista.", "Aspiramos pelo cargo de analista.", "Aspiramos do cargo de analista.", "Aspiramos no cargo de analista."], 1,
        "\"Aspirar\" no sentido de desejar, almejar, é transitivo indireto e rege \"a\".", "Regência verbal"),
      mc("Emprego de palavras", 2, "Assinale a alternativa em que o termo destacado está empregado corretamente.",
        ["O prazo para a entrega é eminente.", "A queda do preço é iminente.", "O iminente jurista recebeu o prêmio.", "Havia eminente risco de desabamento.", "A reunião eminente foi cancelada."], 1,
        "\"Iminente\" = prestes a acontecer. \"Eminente\" = ilustre, elevado.", "Eminente × iminente"),
      mc("Ortografia", 1, "Assinale a alternativa em que todas as palavras estão grafadas corretamente.",
        ["excessão, privilégio", "exceção, privilégio", "exceção, previlégio", "excessão, previlégio", "esceção, privilégio"], 1,
        "As formas corretas são \"exceção\" e \"privilégio\".", "Ortografia"),
      mc("Concordância nominal", 2, "Assinale a alternativa em que a concordância nominal está de acordo com a norma-padrão.",
        ["Ela está meia cansada.", "Ela está meio cansada.", "Eles estão meios cansados.", "Elas estão meias cansadas.", "Ela chegou às duas e meio."], 1,
        "Como advérbio (= um pouco), \"meio\" é invariável. Como numeral, concorda: \"duas e meia\".", "Meio/meia"),
      mc("Conjunções", 1, "Em \"Estudou muito; logo, foi aprovado\", a conjunção \"logo\" expressa ideia de:",
        ["oposição", "conclusão", "alternância", "adição", "causa"], 1,
        "\"Logo\" é conjunção coordenativa conclusiva quando posposta ao verbo ou entre vírgulas, equivalendo a \"portanto\".", "Conjunções"),
    ],
    "Raciocínio Lógico": [
      mc("Problemas lógicos", 1, "Em uma fila, Ana é a 7ª pessoa contada a partir da frente e a 12ª contada a partir do final. O total de pessoas na fila é:",
        ["17", "18", "19", "20", "21"], 1,
        "7 + 12 − 1 = 18 (Ana foi contada nas duas posições).", "Posições"),
      mc("Médias", 2, "A média aritmética de quatro números é 15. Acrescentando-se um quinto número, a média passa a ser 16. O quinto número é:",
        ["16", "18", "20", "22", "25"], 2,
        "Soma dos 4 = 60; soma dos 5 = 80; quinto = 20.", "Média aritmética"),
      mc("Regra de três", 1, "Seis pessoas executam um serviço em 10 dias. Mantido o ritmo, quatro pessoas executariam o mesmo serviço em:",
        ["12 dias", "14 dias", "15 dias", "16 dias", "20 dias"], 2,
        "Grandezas inversamente proporcionais: 6 × 10 = 4 × x → x = 15.", "Regra de três inversa"),
      mc("Juros", 1, "Um capital de R$ 2.000,00 é aplicado a juros simples, à taxa de 3% ao mês, durante 5 meses. O juro obtido é de:",
        ["R$ 250,00", "R$ 280,00", "R$ 300,00", "R$ 310,00", "R$ 350,00"], 2,
        "J = C · i · t = 2.000 × 0,03 × 5 = 300.", "Juros simples"),
      mc("Lógica de argumentação", 3, "Considere verdadeiras as premissas: \"todo A é B\" e \"algum B é C\". Com base nelas, é correto concluir que:",
        ["todo A é C", "algum A é C", "todo C é A", "nada se pode concluir, com certeza, sobre a relação entre A e C", "nenhum A é C"], 3,
        "O \"algum B\" pode ser a parte de B que não é A. Logo, não há conclusão necessária entre A e C.", "Silogismos"),
    ],
    "Direito Administrativo": [
      mc("Poderes administrativos", 1, "O poder que permite à Administração condicionar e restringir o uso e o gozo de bens, atividades e direitos individuais em benefício do interesse coletivo é o poder:",
        ["hierárquico", "disciplinar", "regulamentar", "de polícia", "discricionário"], 3,
        "É o poder de polícia administrativa, que limita a liberdade e a propriedade em prol do interesse público.", "Poder de polícia"),
      mc("Organização administrativa", 1, "É entidade integrante da administração pública indireta:",
        ["Ministério", "Secretaria Estadual", "Autarquia", "Órgão da Presidência da República", "Departamento de uma Secretaria"], 2,
        "Ministérios, secretarias e departamentos são órgãos da administração direta. Autarquias são pessoas jurídicas da indireta.", "DL 200/67"),
      mc("Atos administrativos", 2, "O atributo do ato administrativo que lhe permite impor obrigações a terceiros, independentemente de sua concordância, é a:",
        ["presunção de legitimidade", "imperatividade", "tipicidade", "vinculação", "discricionariedade"], 1,
        "A imperatividade (poder extroverso) alcança terceiros sem exigir consentimento prévio.", "Atributos do ato"),
      mc("Improbidade", 2, "Após as alterações da Lei 14.230/2021 na Lei de Improbidade (Lei 8.429/1992), a configuração do ato de improbidade administrativa exige:",
        ["culpa ou dolo", "necessariamente dolo", "apenas culpa grave", "responsabilidade objetiva", "mera ilegalidade do ato"], 1,
        "A reforma de 2021 eliminou a modalidade culposa: só há improbidade se houver dolo.", "Lei 8.429/92 (red. Lei 14.230/21)"),
      mc("Servidores públicos", 1, "De acordo com a CF/88, os cargos em comissão destinam-se às atribuições de direção, chefia e assessoramento e são de:",
        ["provimento efetivo, mediante concurso público", "livre nomeação e exoneração", "provimento vitalício", "nomeação mediante lista tríplice", "estabilidade após três anos"], 1,
        "Art. 37, II, in fine: cargos em comissão são declarados em lei de livre nomeação e exoneração.", "CF, art. 37, II"),
    ],
    "Informática": [
      mc("Planilhas", 2, "Em uma planilha do Excel, A1 = 10, A2 = 20 e A3 = 30. O resultado de =SE(A1>5; SOMA(A2:A3); 0) é:",
        ["0", "10", "30", "50", "60"], 3,
        "A1 > 5 é verdadeiro, então retorna SOMA(A2:A3) = 20 + 30 = 50.", "Função SE"),
      mc("Editor de texto", 1, "A extensão padrão de um documento criado nas versões atuais do Microsoft Word é:",
        [".xlsx", ".pptx", ".docx", ".txt", ".pdf"], 2,
        ".docx (Word), .xlsx (Excel), .pptx (PowerPoint).", "Office"),
      mc("Windows", 2, "No Windows, a combinação de teclas que abre diretamente o Gerenciador de Tarefas é:",
        ["Ctrl + Alt + Tab", "Alt + F4", "Ctrl + Shift + Esc", "Win + D", "Ctrl + Esc"], 2,
        "Ctrl+Shift+Esc abre o Gerenciador de Tarefas. Alt+F4 fecha a janela; Win+D mostra a área de trabalho.", "Atalhos"),
      mc("Segurança", 2, "A autenticação em dois fatores (2FA) consiste em:",
        ["usar duas senhas fortes diferentes", "combinar duas categorias de comprovação de identidade, como algo que se sabe e algo que se possui", "trocar a senha duas vezes por mês", "usar antivírus e firewall ao mesmo tempo", "digitar a senha duas vezes"], 1,
        "Os fatores vêm de categorias distintas: conhecimento (senha), posse (celular, token) ou característica (biometria).", "Autenticação"),
      mc("Computação em nuvem", 2, "Na computação em nuvem, o modelo em que o usuário acessa aplicativos prontos pela internet, sem gerenciar a infraestrutura, é o:",
        ["IaaS", "PaaS", "SaaS", "On-premises", "Backup local"], 2,
        "SaaS (Software as a Service): o usuário só consome o aplicativo, como um webmail. IaaS fornece infraestrutura e PaaS, plataforma de desenvolvimento.", "Cloud"),
    ],
  },

  IBFC: {
    "Português": [
      mc("Acentuação", 1, "Assinale a palavra que é proparoxítona:",
        ["saída", "cadeira", "lâmpada", "café", "amor"], 2,
        "\"Lâmpada\" tem a sílaba tônica na antepenúltima (lâm-pa-da). Todas as proparoxítonas são acentuadas.", "Acentuação"),
      mc("Classes de palavras", 1, "Em \"Ela chegou muito cedo\", as palavras \"muito\" e \"cedo\" são, respectivamente:",
        ["adjetivo e advérbio", "advérbio e advérbio", "substantivo e advérbio", "pronome e advérbio", "advérbio e adjetivo"], 1,
        "\"Cedo\" modifica o verbo (advérbio de tempo) e \"muito\" intensifica o advérbio \"cedo\" (advérbio de intensidade).", "Advérbio"),
      mc("Figuras de linguagem", 1, "Em \"Seus olhos eram duas estrelas\", há a figura de linguagem denominada:",
        ["metonímia", "hipérbole", "metáfora", "ironia", "eufemismo"], 2,
        "Metáfora é a comparação implícita, sem conectivo comparativo.", "Figuras"),
      mc("Plural", 1, "O plural correto da palavra \"cidadão\" é:",
        ["cidadões", "cidadães", "cidadãos", "cidadãs", "cidadaos"], 2,
        "Cidadão → cidadãos. Pertence ao grupo dos substantivos em \"-ão\" que fazem plural em \"-ãos\" (como mão, irmão).", "Plural"),
      mc("Sintaxe", 2, "Em \"Choveu muito ontem\", o sujeito é classificado como:",
        ["simples", "composto", "oculto", "oração sem sujeito", "indeterminado"], 3,
        "Verbos que indicam fenômenos da natureza são impessoais: formam oração sem sujeito.", "Sujeito"),
    ],
    "Raciocínio Lógico": [
      mc("Probabilidade", 1, "Ao lançar duas moedas honestas, a probabilidade de obter duas caras é:",
        ["1/2", "1/3", "1/4", "1/8", "2/3"], 2,
        "(1/2) × (1/2) = 1/4.", "Eventos independentes"),
      mc("Anagramas", 2, "O número de anagramas da palavra ANA é:",
        ["2", "3", "4", "6", "9"], 1,
        "3!/2! = 6/2 = 3 (a letra A repete duas vezes).", "Permutação com repetição"),
      mc("Conjuntos", 2, "Em uma turma de 40 alunos, 25 estudam inglês, 18 estudam espanhol e 5 não estudam nenhum dos dois idiomas. O número de alunos que estudam os dois é:",
        ["5", "6", "8", "10", "13"], 2,
        "Estudam pelo menos um: 40 − 5 = 35. Ambos: 25 + 18 − 35 = 8.", "Inclusão-exclusão"),
      mc("Sequências", 1, "Na sequência 2, 6, 18, 54, ..., o próximo termo é:",
        ["108", "144", "162", "216", "180"], 2,
        "É uma PG de razão 3: 54 × 3 = 162.", "PG"),
      mc("Regra de três", 1, "Se 3 canetas iguais custam R$ 4,50, então 8 dessas canetas custam:",
        ["R$ 10,50", "R$ 11,00", "R$ 12,00", "R$ 12,50", "R$ 13,50"], 2,
        "Cada caneta custa R$ 1,50; 8 × 1,50 = R$ 12,00.", "Regra de três simples"),
    ],
    "Direito Constitucional": [
      mc("Emendas", 2, "Segundo a CF/88, a proposta de emenda à Constituição é aprovada se obtiver:",
        ["maioria simples em um turno", "maioria absoluta em um turno", "três quintos dos votos dos membros de cada Casa, em dois turnos", "dois terços em turno único", "unanimidade dos membros do Congresso"], 2,
        "Art. 60, §2º: discussão e votação em cada Casa, em dois turnos, com três quintos dos votos dos respectivos membros.", "CF, art. 60, §2º"),
      mc("Princípios fundamentais", 2, "Não é fundamento da República Federativa do Brasil, nos termos do art. 1º da CF/88:",
        ["a soberania", "a cidadania", "a dignidade da pessoa humana", "o pluralismo político", "a separação dos Poderes"], 4,
        "Os fundamentos são: soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa e pluralismo político. A separação dos Poderes é princípio (art. 2º).", "CF, art. 1º"),
      mc("Direitos individuais", 2, "É vedada pela CF/88, em qualquer hipótese, a pena:",
        ["de morte", "de caráter perpétuo", "de multa", "de prestação social alternativa", "de perda de bens"], 1,
        "Art. 5º, XLVII: não haverá penas de morte (salvo em guerra declarada), de caráter perpétuo, de trabalhos forçados, de banimento nem cruéis.", "CF, art. 5º, XLVII"),
      mc("Poder Legislativo", 1, "O Poder Legislativo da União é exercido pelo:",
        ["Senado Federal, apenas", "Câmara dos Deputados, apenas", "Congresso Nacional, composto pela Câmara dos Deputados e pelo Senado Federal", "Supremo Tribunal Federal", "Tribunal de Contas da União"], 2,
        "Art. 44: o Poder Legislativo é exercido pelo Congresso Nacional, que se compõe da Câmara dos Deputados e do Senado Federal.", "CF, art. 44"),
      mc("Direitos políticos", 1, "Para os maiores de dezoito e menores de setenta anos, o alistamento eleitoral e o voto são:",
        ["facultativos", "obrigatórios", "vedados", "condicionados à alfabetização", "dispensados mediante requerimento"], 1,
        "Art. 14, §1º, I: obrigatórios para maiores de 18 anos (com exceção dos analfabetos, dos maiores de 70 e dos de 16 a 17 anos).", "CF, art. 14, §1º"),
    ],
    "Informática": [
      mc("Hardware", 1, "A sigla CPU significa:",
        ["Unidade Central de Processamento", "Controle Primário de Usuário", "Central Pública de Usuários", "Unidade de Cálculo Periférico", "Computador Pessoal Universal"], 0,
        "A CPU é o \"cérebro\" do computador: executa as instruções dos programas.", "Hardware"),
      mc("Hardware", 1, "Dentre as opções, a que perde seu conteúdo quando o computador é desligado é a memória:",
        ["HD", "SSD", "RAM", "pen drive", "DVD"], 2,
        "A RAM é volátil. HD, SSD, pen drive e DVD são armazenamento não volátil.", "Memórias"),
      mc("Planilhas", 1, "No Excel, a função =MÁXIMO(B1:B5) retorna:",
        ["a soma dos valores de B1 a B5", "a média dos valores de B1 a B5", "o maior valor entre B1 e B5", "o menor valor entre B1 e B5", "a quantidade de células preenchidas"], 2,
        "MÁXIMO devolve o maior valor do intervalo. MÍNIMO devolve o menor.", "Excel"),
      mc("Internet", 1, "Na URL https://www.exemplo.gov.br, a parte \"https\" corresponde ao:",
        ["domínio", "protocolo", "diretório", "tipo de arquivo", "servidor de e-mail"], 1,
        "\"https\" é o protocolo de transferência de hipertexto com camada segura.", "URL"),
      mc("Segurança", 2, "O malware que se disfarça de programa legítimo para dar ao invasor acesso ao computador é o:",
        ["worm", "cavalo de Troia", "adware", "ransomware", "botnet"], 1,
        "O cavalo de Troia (trojan) parece inofensivo, mas executa ações maliciosas, como abrir uma porta dos fundos (backdoor).", "Malwares"),
    ],
  },
};

// ─── metadados das bancas ─────────────────────────────────────────────────
const BANCA_INFO = {
  CEBRASPE: {
    nome: "Cebraspe", formato: "ce", cor: "#0B7A47",
    resumo: "Itens Certo/Errado. Em alguns editais, cada erro anula um acerto.",
    dica: "Quando houver desconto por erro, só marque se tiver mais de 50% de segurança. Leia o edital.",
  },
  FGV: {
    nome: "FGV", formato: "mc", cor: "#2430E6",
    resumo: "Enunciados longos, casos concretos e alternativas próximas entre si.",
    dica: "Leia a pergunta primeiro e elimine as alternativas que \"parecem certas\" mas mudam uma palavra.",
  },
  FCC: {
    nome: "FCC", formato: "mc", cor: "#C93525",
    resumo: "Letra da lei e gramática normativa, com pouca margem para interpretação livre.",
    dica: "Em Direito, saber o texto do artigo vale mais que saber a doutrina.",
  },
  VUNESP: {
    nome: "Vunesp", formato: "mc", cor: "#B58900",
    resumo: "Questões diretas, forte presença de português e matemática básica.",
    dica: "Não complique: muitas questões têm cálculo simples, a pegadinha está na leitura.",
  },
  IBFC: {
    nome: "IBFC", formato: "mc", cor: "#7C3AED",
    resumo: "Conteúdo objetivo, com muito conceito básico bem fixado.",
    dica: "Revise os fundamentos, porque as questões raramente fogem do básico.",
  },
};

// ─── utilitários ──────────────────────────────────────────────────────────
function slug(s) {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// BANCO: mesma estrutura de antes ({banca:{materia:[questões]}}), agora com id estável e metadados.
const BANCO = {};
const INDEX = {}; // id -> questão
for (const [banca, mats] of Object.entries(RAW)) {
  BANCO[banca] = {};
  for (const [materia, list] of Object.entries(mats)) {
    BANCO[banca][materia] = list.map((q, i) => {
      const full = { id: `${slug(banca)}-${slug(materia)}-${i + 1}`, banca, materia, ...q };
      INDEX[full.id] = full;
      return full;
    });
  }
}

function shuffle(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Embaralha as alternativas de múltipla escolha, recalculando o gabarito.
// Itens Certo/Errado mantêm a ordem fixa.
function prepare(q, rnd = Math.random) {
  if (q.formato === "ce") return { ...q };
  const order = shuffle(q.alternativas.map((_, i) => i), rnd);
  return { ...q, alternativas: order.map((i) => q.alternativas[i]), gabarito: order.indexOf(q.gabarito) };
}

const BANCAS = Object.keys(BANCO);
const ESCOPO_TODAS = "__todas__";

function getMaterias(banca) { return Object.keys(BANCO[banca] || {}); }

function countQuestions(banca, materia = ESCOPO_TODAS) {
  if (!BANCO[banca]) return 0;
  if (materia === ESCOPO_TODAS) return Object.values(BANCO[banca]).reduce((n, l) => n + l.length, 0);
  return (BANCO[banca][materia] || []).length;
}

// Sorteia questões de uma matéria (ou de todas, intercalando matérias como numa prova real).
function getQuestions(banca, materia, n = 10, rnd = Math.random) {
  let pool;
  if (materia === ESCOPO_TODAS) {
    pool = Object.values(BANCO[banca] || {}).flat();
  } else {
    pool = BANCO[banca]?.[materia] || [];
  }
  return shuffle(pool, rnd).slice(0, n).map((q) => prepare(q, rnd));
}

function getQuestionById(id, rnd = Math.random) {
  return INDEX[id] ? prepare(INDEX[id], rnd) : null;
}

function allQuestions() { return Object.values(INDEX); }

// PRNG determinístico (mulberry32) — usado no Desafio do Dia, igual para todos.
function seededRandom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Desafio do dia: 5 questões da base inteira, mesmas para todos no mesmo dia.
function getDailyChallenge(dateKey, n = 5) {
  const rnd = seededRandom(`passeja-${dateKey}`);
  return shuffle(allQuestions(), rnd).slice(0, n).map((q) => prepare(q, rnd));
}

module.exports = {
  BANCO, BANCAS, BANCA_INFO, ESCOPO_TODAS,
  getMaterias, countQuestions, getQuestions, getQuestionById, getDailyChallenge,
  allQuestions, shuffle, seededRandom,
};
