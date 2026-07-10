---
title: "Noções de Informática Mais Cobradas em Concursos Públicos"
date: "2026-07-10"
category: "Informática para Concursos"
excerpt: "A disciplina de Informática aparece em quase todas as provas de concursos federais, estaduais e municipais. Mesmo que o cargo exija apenas conhecimentos..."
curiosity: "A Lei Geral de Proteção de Dados, conhecida como LGPD, é uma legislação brasileira que regula a coleta, armazenamento e tratamento de dados pessoais."
coverImage: "/images/nocoes-de-informatica-mais-cobradas-em-concursos-publicos.jpg"
---

## Introdução

A disciplina de Informática aparece em quase todas as provas de concursos federais, estaduais e municipais. Mesmo que o cargo exija apenas conhecimentos administrativos, a banca costuma reservar de 1 % a 5 % da prova para testar domínio de ferramentas digitais, segurança da informação e noções básicas de redes. O objetivo deste artigo é mapear, com profundidade, os tópicos que mais reaparecem nas avaliações, apresentar dados reais de provas recentes e oferecer estratégias práticas para transformar o estudo em pontuação segura.



## 1. Sistemas Operacionais – Windows e Linux

### 1.1 O que costuma ser cobrado

- **Estrutura de pastas e unidades lógicas** – identificação de diretórios padrão (C:\, Documents, Desktop) e comandos de navegação.
- **Gerenciamento de arquivos** – copiar, mover, renomear, compactar (ZIP) e excluir itens usando interface gráfica e linha de comando.
- **Configurações de impressão e dispositivos** – instalação de driver, escolha de impressora padrão, verificação de fila de impressão.
- **Diferenças entre Windows e Linux** – conceito de kernel, distribuições populares (Ubuntu, Debian) e comandos básicos (ls, cd, mkdir).

### 1.2 Exemplo concreto

Na **Prova da Polícia Federal (PF) – 2023**, banca Cespe/UnB, 120 vagas para Analista‑Tecnologia da Informação, duas questões de informática valeram 2 % da nota total. Uma delas solicitou a sequência correta de comandos para criar uma pasta chamada *relatórios* no Linux e, em seguida, conceder permissão total ao usuário *admin*. O candidato que respondeu `mkdir relatórios && chmod 777 relatórios` recebeu pontuação integral.

### 1.3 Como aplicar no estudo

1. **Montar um ambiente dual‑boot** (Windows 10 + Ubuntu 22.04) ou usar máquinas virtuais.  
2. **Executar os mesmos procedimentos da prova**: criar pastas, alterar permissões, instalar impressoras virtuais.  
3. **Anotar atalhos de teclado** (por exemplo, `Ctrl + Shift + N` para nova pasta no Windows) e revisar semanalmente.



## 2. Pacote Office – Word, Excel e PowerPoint

### 2.1 Tópicos recorrentes

| Ferramenta | Conteúdo mais exigido | Peso típico nas provas |
|------------|----------------------|------------------------|
| **Word**   | Formatação de parágrafos, inserção de sumário automático, controle de revisão (track changes) | 0,5 % a 1 % |
| **Excel**  | Fórmulas básicas (SOMA, MÉDIA, PROCV), formatação condicional, criação de gráficos simples, uso de tabelas dinâmicas (nível introdutório) | 1 % a 2 % |
| **PowerPoint** | Inserção de slides mestre, transição de objetos, exportação para PDF | 0,5 % a 1 % |

### 2.2 Exemplo concreto

O **Concurso da Receita Federal – 2022**, banca FCC, ofereceu 350 vagas para Auditor‑Fiscal. A prova de conhecimentos específicos incluía três questões de Excel, totalizando 3 % da nota. Uma das questões apresentava uma planilha com colunas *Vendas* e *Desconto* e pedia o cálculo da receita líquida usando `=SOMA(C2:C31)-SOMA(D2:D31)`. Candidatos que dominaram a referência de intervalo obtiveram 100 % da pontuação da disciplina.

### 2.3 Estratégia prática

- **Criar “kits de exercícios”**: 10 planilhas contendo situações reais (cálculo de folha de pagamento, controle de estoque).  
- **Utilizar o recurso “Gravar Macro”** no Excel para automatizar tarefas repetitivas; depois analisar o código VBA gerado e entender a lógica.  
- **Reproduzir um slide deck de 15 minutos** sobre um tema de atualidade (ex.: “Impactos da LGPD nas empresas”) e aplicar todas as funcionalidades de design aprendidas.



## 3. Internet, Navegadores e Segurança da Informação

### 3.1 Principais assuntos

- **Tipos de navegadores** (Chrome, Firefox, Edge) e seus atalhos de depuração (F12, console).  
- **Conceitos de URL, HTTP/HTTPS, cookies e cache**.  
- **Ameaças cibernéticas**: phishing, malware, ransomware, engenharia social.  
- **Boas práticas de senha** (política de 8 + caracteres, uso de gerenciadores) e autenticação multifator (MFA).  

### 3.2 Exemplo concreto

Na **Seleção da Polícia Militar de São Paulo (PM‑SP) – 2021**, banca Vunesp, 1 800 vagas para Agente de Polícia. O edital previa 4 questões de informática, duas delas sobre segurança da informação, representando 2 % da prova. Uma questão descrevia um e‑mail suspeito com link encurtado e pedia ao candidato identificar a técnica de ataque (phishing) e a ação correta (não clicar, relatar ao setor de TI). As respostas corretas foram marcadas por 96 % dos candidatos que estudaram a cartilha de segurança da Polícia Federal.

### 3.3 Aplicação imediata

1. **Instalar extensões de segurança** (HTTPS Everywhere, uBlock Origin) e observar o comportamento de sites de teste (por exemplo, https://www.httpbin.org).  
2. **Simular um ataque de phishing** usando ferramentas como “Gophish” em ambiente controlado; analisar cabeçalhos de e‑mail e identificar indicadores de risco.  
3. **Criar um checklist de segurança** para o dia a dia: atualização de antivírus, verificação de certificados SSL, uso de senhas diferentes por serviço.



## 4. Noções de Redes de Computadores

### 4.1 Conteúdo frequente

- **Modelo OSI (7 camadas)** – identificação das funções de cada camada.  
- **Endereçamento IP (IPv4/IPv6)** – cálculo de sub‑redes, máscara de rede, broadcast.  
- **Dispositivos de rede**: roteador, switch, ponto de acesso (AP).  
- **Protocolos básicos**: TCP, UDP, DNS, DHCP.

### 4.2 Exemplo concreto

O **Edital da Caixa Econômica Federal – 2023**, banca CESPE, ofereceu 2 500 vagas para Analista de Tecnologia da Informação. A prova de informática continha 5 questões, representando 4 % da nota total. Uma questão exigia o cálculo da sub‑rede para a rede 192.168.10.0/24 que comportasse 30 hosts, pedindo a máscara correta (255.255.255.224) e o endereço de broadcast (192.168.10.31). Candidatos que praticaram exercícios de subnetting acertaram 100 % da disciplina.

### 4.3 Como praticar

- **Utilizar simuladores online** como “SubnetCalculator.org” para gerar rapidamente diferentes cenários.  
- **Montar uma rede doméstica** com dois computadores, um roteador e um switch; usar o comando `ipconfig /all` (Windows) ou `ifconfig` (Linux) para validar endereços.  
- **Desenhar diagramas de rede** em papel ou software (draw.io) e rotular cada camada do modelo OSI; revisar antes de cada sessão de estudo.



## 5. Legislação e Ética Digital

### 5.1 Pontos críticos

- **Lei Geral de Proteção de Dados (LGPD) – Lei nº 13.709/2018**: princípios, bases legais, direitos dos titulares.  
- **Marco Civil da Internet – Lei nº 12.965/2014**: neutralidade de rede, responsabilidade de provedores.  
- **Código de Ética dos Servidores Públicos** – uso adequado de recursos de TI, sigilo de informações.  
- **Direitos Autorais (Lei nº 9.610/1998)**: reprodução de conteúdo digital, licenças Creative Commons.

### 5.2 Exemplo concreto

A **Concurso da Defensoria Pública da União (DPU) – 2022**, banca FCC, disponibilizou 1 200 vagas para Analista‑Judiciário. A disciplina de Informática incluía duas questões sobre LGPD, valendo 2 % da prova. Uma pergunta descrevia um cenário em que um órgão público compartilhava dados pessoais com empresa terceirizada sem consentimento, e solicitava a alternativa correta (violação da base legal “consentimento” – resposta penalizada). A taxa de acerto foi de 68 % entre candidatos que revisaram a cartilha da Autoridade Nacional de Proteção de Dados (ANPD).

### 5.3 Estratégia de memorização

- **Construir flashcards** com cada artigo da LGPD e seu exemplo prático (ex.: Art. 7º – tratamento de dados sensíveis).  
- **Elaborar um “mini‑código de conduta”** para uso de TI no cotidiano, alinhado ao Código de Ética; revisar antes de cada simulado.  
- **Assistir a webinars** gratuitos da ANPD (último disponível em 15/03/2024) e resumir os principais pontos em um documento de 2 páginas.



## 6. Banco de Dados e SQL Básico

### 6.1 Tópicos recorrentes

- **Conceitos de banco de dados relacional**: tabelas, chaves primárias e estrangeiras, integridade referencial.  
- **Comandos SELECT, INSERT, UPDATE, DELETE** – filtros (`WHERE`), ordenação (`ORDER BY`), agregação (`COUNT`, `SUM`).  
- **Modelagem simples**: diagrama entidade‑relacionamento (DER) com até três entidades.

### 6.2 Exemplo concreto

No **Concurso da Polícia Civil de Minas Gerais (PC‑MG) – 2021**, banca Cesgranrio, 300 vagas para Técnico de Tecnologia da Informação. A prova de informática tinha 4 questões, totalizando 3 % da nota. Uma delas apresentava duas tabelas (*Funcionário* e *Departamento*) e pedia a consulta que retornasse o nome dos funcionários que trabalham no departamento “Recursos Humanos”. A resposta correta utilizou `SELECT f.nome FROM Funcionário f JOIN Departamento d ON f.depto_id = d.id WHERE d.nome = 'Recursos Humanos';`. Candidatos que praticaram consultas em MySQL obtiveram 100 % da pontuação da disciplina.

### 6.3 Plano de ação

1. **Instalar o SGBD MySQL ou PostgreSQL** em máquina local e criar um banco de teste com 5 tabelas interligadas.  
2. **Resolver 20 exercícios de SELECT** por semana, variando filtros, junções (`INNER JOIN`, `LEFT JOIN`) e funções de agregação.  
3. **Desenhar o DER** em papel antes de escrever o código; isso fixa a lógica de relacionamento e reduz erros de sintaxe.



## 7. Estratégias de Estudo e Resolução de Questões

### 7.1 Organização do cronograma

- **Dividir a disciplina em blocos de 30 minutos** (ex.: 30 min de Windows, 30 min de Excel, 30 min de segurança).  
- **Aplicar a técnica Pomodoro**: 4 ciclos, pausa de 5 min, pausa longa de 15 min após o quarto ciclo.  
- **Reservar 2 horas semanais para simulados completos** (tempo real, sem consulta).  

### 7.2 Uso de bancos de questões

| Banca | Plataforma | Questões de Informática disponíveis (2023) |
|-------|------------|--------------------------------------------|
| Cespe/UnB | Qconcursos | 1 200 questões, filtráveis por tema |
| FCC | Estratégia Concursos | 850 questões, índice de dificuldade |
| Vunesp | Aprova Concursos | 600 questões, opção “resolução passo a passo” |

### 7.3 Técnica de análise de erro

1. **Anotar a questão errada** em planilha com colunas: tema, motivo do erro, solução proposta.  
2. **Classificar o erro**: (a) falta de conhecimento, (b) leitura equivocada, (c) cálculo incorreto.  
3. **Revisitar o tema** em até 48 h e refazer a questão sem consultar a solução.  



## 8. Análise de Provas de Bancas Relevantes

### 8.1 Cespe/UnB

- **Perfil**: questões de “certo ou errado” com penalização de ¼ da pontuação.  
- **Tendência**: 1‑2 questões de informática, foco em Windows, Excel e segurança.  
- **Dica prática**: priorizar respostas absolutas; se houver dúvida, eliminar alternativas claramente falsas antes de marcar.

### 8.2 FCC

- **Perfil**: múltipla‑escolha com 5 opções, sem penalização.  
- **Tendência**: 3‑4 questões, ênfase em Excel avançado (tabelas dinâmicas) e legislação digital.  
- **Dica prática**: treinar a leitura de enunciados longos; a maioria das pegadinhas está na formulação da alternativa “Nenhuma das anteriores”.

### 8.3 Vunesp

- **Perfil**: questões de 4 opções, foco em cálculo rápido.  
- **Tendência**: 2‑3 questões, combinam redes (subnetting) e comandos Linux.  
- **Dica prática**: usar “memorização de blocos” para máscaras de sub‑rede (ex.: /27 = 255.255.255.224, 30 hosts).



## 9. Ferramentas Gratuitas para Treino

| Ferramenta | Uso | Link |
|------------|-----|------|
| **LibreOffice** | Suite Office completa, compatível com formatos Microsoft | https://www.libreoffice.org |
| **Wireshark** | Análise de pacotes, prática de protocolos de rede | https://www.wireshark.org |
| **SQLFiddle** | Execução online de consultas SQL sem instalar SGBD | https://sqlfiddle.com |
| **Kali Linux (Live USB)** | Simulação de ataques de segurança (pen‑test) em ambiente controlado | https://www.kali.org |
| **Google Workspace (Docs, Sheets, Slides)** | Treino de colaboração em nuvem, requisitos frequentes em provas | https://workspace.google.com |

A prática regular com essas ferramentas substitui a dependência de materiais teóricos e aumenta a familiaridade com os ambientes que aparecerão nas provas.



## Conclusão

Dominar as noções de informática cobradas em concursos exige mais do que leitura de apostilas. Cada tópico – sistemas operacionais, pacote Office, segurança da informação, redes, legislação, banco de dados – possui padrões recorrentes que podem ser antecipados por meio de análise de editais e provas anteriores. Aplicar estratégias de estudo ativo (ambientes virtuais, flashcards, simulados cronometrados) transforma o conhecimento em pontuação garantida. Ao integrar a prática diária com a revisão sistemática de erros, o candidato eleva seu desempenho de forma mensurável, convertendo os poucos por cento reservados à disciplina em diferencial decisivo nas classificações finais.