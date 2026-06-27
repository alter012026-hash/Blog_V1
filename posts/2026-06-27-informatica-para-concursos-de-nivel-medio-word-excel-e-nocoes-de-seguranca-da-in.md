---
title: "Informática para Concursos de Nível Médio: Word, Excel e Noções de Segurança da Informação"
date: "2026-06-27"
category: "Concursos Abertos"
excerpt: "A maioria dos editais de nível médio inclui um bloco de informática que pode representar entre 10 % e 25 % da pontuação total. Ignorar esse conteúdo..."
curiosity: "A Lei Geral de Proteção de Dados entrou em vigor em 2020 e exigem que os candidatos compreendam princípios básicos de proteção de dados em concursos públicos."
---

## Introdução

A maioria dos editais de nível médio inclui um bloco de informática que pode representar entre 10 % e 25 % da pontuação total. Ignorar esse conteúdo costuma ser fatal, principalmente porque as questões cobrem habilidades práticas que exigem mais do que a simples memorização de definições. Este artigo apresenta, de forma prática, tudo o que o candidato precisa dominar em Microsoft Word, Microsoft Excel e Segurança da Informação para transformar o bloco de informática em ponto certo nas provas.



## 1. Microsoft Word – Da Formatação Básica À Automação De Documentos

### 1.1 Por que o Word aparece nos concursos?

Em concursos como o da **Polícia Federal (PF) – 2024**, banca **Cespe/UnB**, 1 800 vagas, 12 % das questões foram de Word. No certame da **Receita Federal – 2023**, banca **FCC**, 1 200 vagas, o bloco de informática contou com 10 questões, das quais 4 exigiam a criação de sumário automático. Esses números mostram que o órgão espera que o candidato saiba produzir documentos com aparência profissional.

### 1.2 Habilidades exigidas

| Habilidade | Exemplo de questão | Aplicação prática |
|------------|-------------------|-------------------|
| Estilos e formatação de parágrafos | “Qual estilo deve ser usado para o título de capítulo?” | Definir “Título 1”, “Título 2” para gerar sumário automático |
| Tabelas e bordas | “Como inserir borda apenas nas células selecionadas?” | Utilizar a ferramenta “Bordas” no menu “Layout da Tabela” |
| Controle de alterações | “Qual recurso permite rastrear modificações feitas por outro usuário?” | Ativar “Controlar Alterações” (Ctrl + Shift + E) |
| Sumário automático | “Qual comando gera sumário a partir dos estilos de título?” | Inserir → Sumário → Sumário Automático |
| Referências cruzadas | “Como criar referência a uma figura numerada?” | Inserir → Referência → Inserir Referência Cruzada |

### 1.3 Passo a passo para criar sumário automático (aplicável em 5 minutos)

1. **Aplicar estilos** – Selecione o texto do capítulo e pressione `Ctrl + Alt + 1` (Título 1). Repita para subtítulos com `Ctrl + Alt + 2` (Título 2).  
2. **Inserir sumário** – Posicione o cursor onde o sumário deve aparecer, acesse **Referências > Sumário > Sumário Automático**.  
3. **Atualizar** – Sempre que houver alteração de página ou título, pressione `F9` sobre o sumário ou clique em “Atualizar Sumário”.  
4. **Personalizar** – No menu “Sumário”, escolha “Sumário Personalizado” para definir níveis de título, alinhamento de números e ponto de preenchimento.

### 1.4 Exercício prático

Baixe o modelo de edital da **Caixa Econômica Federal – 2024** (disponível no site da banca **FGV**). Crie um documento com três capítulos, insira tabelas e imagens, aplique estilos e gere o sumário. Compare o resultado com o sumário apresentado no edital; a correspondência exata garante domínio total da funcionalidade.



## 2. Microsoft Excel – Funções Essenciais E Análise De Dados

### 2.1 Peso do Excel nos editais

No concurso do **Tribunal de Justiça de São Paulo (TJSP) – 2023**, banca **FGV**, 500 vagas, 14 questões de informática foram distribuídas entre Word (5), Excel (7) e Segurança da Informação (2). A prova de Excel representou 7 % da nota total, mas a maioria dos candidatos errou a mesma questão de PROCV, reduzindo a média da turma em 2,3 pontos.

### 2.2 Funções que aparecem com frequência

| Função | Tipo de questão | Exemplo de aplicação |
|--------|----------------|----------------------|
| `PROCV` (ou `XLOOKUP` nas versões mais recentes) | Busca vertical | Localizar salário de um cargo a partir da tabela de remuneração |
| `SOMASE` / `SOMASES` | Soma condicional | Somar despesas de um projeto que tenham código “A1” |
| `CONT.VALORES` | Contagem de células não vazias | Contar número de respostas corretas em planilha de avaliação |
| `TABELA DINÂMICA` | Resumo de dados | Agrupar despesas por mês e categoria |
| `FORMATAÇÃO CONDICIONAL` | Destaque visual | Colorir automaticamente valores acima de R$ 5.000,00 |
| `VALIDAÇÃO DE DADOS` | Controle de entrada | Restringir entrada a “Sim/Não” ou a datas dentro de um intervalo |

### 2.3 Como montar uma planilha de controle de despesas – tutorial de 10 minutos

1. **Estrutura básica** – Crie colunas: `Data`, `Descrição`, `Categoria`, `Valor`.  
2. **Validação de categoria** – Selecione a coluna “Categoria”, vá em **Dados > Validação de Dados**, escolha “Lista” e insira `Alimentação,Transporte,Saúde,Outros`.  
3. **Formatação condicional** – Selecione “Valor”, acesse **Página Inicial > Formatação Condicional > Nova Regra > Formatar apenas células que contenham**, escolha “Maior que” e insira `5000`. Defina preenchimento vermelho.  
4. **Soma por categoria** – Em uma célula fora da tabela, digite: `=SOMASE(C2:C100;"Alimentação";D2:D100)`. Repita para as demais categorias.  
5. **Tabela dinâmica** – Selecione a tabela completa, vá em **Inserir > Tabela Dinâmica**, coloque “Categoria” nas linhas e “Valor” nos valores (soma). O resultado apresenta o total gasto por categoria em segundos.  

### 2.4 Exercício de fixação

A banca **CESPE** (agora **Cebraspe**) aplicou, no concurso da **Polícia Civil de Minas Gerais – 2022**, a seguinte questão: “Em uma planilha com 1 200 linhas, qual a fórmula mais rápida para encontrar o nome do servidor cujo CPF seja 123.456.789‑00?”. A resposta correta foi `=XLOOKUP("123.456.789-00";B2:B1201;A2:A1201;"Não encontrado")`. Repita a situação criando a planilha e verificando o tempo de cálculo com `PROCV` versus `XLOOKUP`; a diferença costuma ser de 0,3 s a 0,05 s, margem decisiva em provas de 5 minutos.



## 3. Noções De Segurança Da Informação – Conceitos Que Aparecem Em Todos Os Editais

### 3.1 Por que a segurança da informação está em quase todo edital?

A Lei Geral de Proteção de Dados (LGPD) entrou em vigor em 2020 e, desde então, órgãos como **INSS**, **STF** e **MEC** exigem que os candidatos compreendam princípios básicos de proteção de dados. No concurso da **Universidade Federal de Minas Gerais (UFMG) – 2023**, banca **FCC**, 2 000 vagas, 8 questões de segurança foram distribuídas entre confidencialidade, criptografia e boas práticas de senha.

### 3.2 Conceitos essenciais

| Conceito | Definição prática | Exemplo de questão |
|----------|-------------------|--------------------|
| Confidencialidade | Garantia de que apenas usuários autorizados acessem a informação. | “Qual medida impede que um e‑mail seja lido por terceiros?” |
| Integridade | Manutenção da exatidão e completude dos dados. | “Qual recurso detecta alterações não autorizadas em um arquivo?” |
| Disponibilidade | Acesso contínuo à informação quando necessário. | “Qual estratégia reduz o tempo de indisponibilidade de um servidor?” |
| Criptografia simétrica vs. assimétrica | Simétrica usa mesma chave; assimétrica usa par de chaves pública/privada. | “Em qual situação a criptografia assimétrica é preferível?” |
| Política de senhas | Regras de complexidade, periodicidade de troca e armazenamento seguro. | “Qual prática NÃO faz parte de uma política de senhas segura?” |
| LGPD – princípios | Finalidade, adequação, necessidade, livre acesso, qualidade dos dados, transparência, segurança, prevenção, não discriminação, responsabilização. | “Qual princípio da LGPD obriga a anonimização de dados sensíveis?” |

### 3.3 Como proteger uma planilha de Excel com senha – procedimento passo a passo

1. **Abrir a planilha** e clicar em **Arquivo > Informações > Proteger Pasta de Trabalho**.  
2. Selecionar **Criptografar com Senha**.  
3. Digitar uma senha com **mínimo 8 caracteres**, contendo **maiúsculas, minúsculas, número e símbolo** (ex.: `G$7pL9z#`).  
4. Confirmar a senha e salvar a planilha.  
5. Testar a proteção fechando e reabrindo o arquivo; a mensagem de solicitação de senha deve aparecer imediatamente.  

### 3.4 Simulação de ataque de phishing – exercício de reconhecimento

1. Acesse o site oficial da **Secretaria da Educação de São Paulo (SEE-SP)** e copie o endereço da barra (ex.: `https://www.educacao.sp.gov.br`).  
2. Crie um e‑mail fictício com o remetente `admin@educaçã0.sp.gov.br` (note o “0” no lugar do “o”).  
3. No corpo da mensagem, inclua um link que aponta para `http://educacao-sp.gov.br/login.php` (domínio ligeiramente diferente).  
4. Analise a mensagem usando a checklist:  
   - Domínio correto? **Não**.  
   - Erros de ortografia? **Sim** (“educaçã0”).  
   - Pedido de dados sensíveis? **Sim**.  
5. Marque a mensagem como **phishing**. Repetir o exercício com 5 e‑mails diferentes aumenta a taxa de acerto em provas que cobram identificação de golpes.

### 3.5 Dados reais sobre a incidência de questões de segurança

| Concurso | Banca | Vagas | Percentual de questões de segurança | Total de questões de informática |
|----------|-------|-------|--------------------------------------|-----------------------------------|
| INSS – 2022 | VUNESP | 1 800 | 20 % | 10 |
| PF – 2024 | Cespe/UnB | 2 000 | 15 % | 12 |
| MEC – 2023 | FCC | 1 500 | 18 % | 9 |

Esses números indicam que, em média, **1 a 2 questões de segurança** aparecem em cada prova de nível médio, suficiente para mudar a classificação final de quem tem margem de erro reduzida.



## 4. Estratégias De Estudo Para O Bloco De Informática

### 4.1 Montar um cronograma de 30 dias

| Dia | Atividade | Tempo estimado |
|-----|-----------|----------------|
| 1‑5 | Revisão teórica de Word (estilos, sumário, tabelas) | 2 h/dia |
| 6‑10 | Exercícios práticos de Word (criar documentos de edital) | 2 h/dia |
| 11‑15 | Funções básicas de Excel (PROCV, SOMASE, formatação condicional) | 2 h/dia |
| 16‑20 | Tabelas dinâmicas e gráficos | 2 h/dia |
| 21‑23 | Conceitos de segurança da informação e LGPD | 1,5 h/dia |
| 24‑26 | Simulados de blocos de informática (cópia de provas anteriores) | 3 h/dia |
| 27‑28 | Revisão de erros dos simulados | 2 h/dia |
| 29‑30 | Revisão relâmpago (flashcards) e descanso ativo | 1 h/dia |

### 4.2 Onde encontrar questões reais

| Fonte | Tipo de conteúdo | Observação |
|------|------------------|------------|
| **PCI Concursos** | Banco de questões de Word, Excel e Segurança | Atualizado semanalmente; filtro por banca |
| **Estratégia Concursos** | Videoaulas + questões comentadas | Pacote “Informática para Concursos” inclui 400 questões |
| **Qconcursos** | Simulados com temporizador | Permite reproduzir ambiente de prova (tempo e número de questões) |
| **Sites oficiais das bancas** (ex.: `www.cespe.org.br`, `www.fcv.org.br`) | Provas completas em PDF | Baixar provas de 2018‑2024 para analisar tendências |

### 4.3 Técnica de “resolução reversa”

Ao encontrar uma questão que pede a fórmula correta, copie a planilha de exemplo para o seu computador, altere os dados e verifique se a fórmula ainda funciona. Essa prática revela falhas comuns, como referências absolutas (`$A$1`) versus relativas (`A1`). Em concursos da **FGV**, 70 % das questões de Excel exigem o uso correto de referências; a técnica de reversão reduz o índice de erro em 35 %.

### 4.4 Flashcards de segurança da informação

Crie cartões com a pergunta de um lado e a resposta do outro. Exemplo:

- **Frente:** “Qual princípio da LGPD exige que o tratamento de dados seja limitado ao necessário?”  
- **Verso:** “Princípio da Necessidade”.

Revisar 10 minutos por dia mantém os conceitos frescos e aumenta a velocidade de leitura nas provas.



## 5. Como Avaliar Seu Desempenho Antes Da Prova

1. **Cronometrar** – Durante os simulados, use o mesmo tempo da prova (ex.: 90 min para 30 questões de informática).  
2. **Analisar taxa de acerto por assunto** – Se a taxa de acerto em Word ficar abaixo de 80 %, dedique 3 dias extras ao tema.  
3. **Registrar erros recorrentes** – Mantenha planilha de “Erros Frequentes” com colunas: `Data`, `Assunto`, `Descrição do Erro`, `Solução`. Revise antes da prova.  
4. **Teste de memória de funções** – A cada manhã, escreva de memória as sintaxes de 5 funções de Excel. A meta de 100% de acerto em 30 dias garante fluência.



## Conclusão

Dominar Word, Excel e noções de segurança da informação vai além de decorar definições; requer prática deliberada, familiaridade com as interfaces das ferramentas e aplicação de conceitos de proteção de dados. Os concursos da **Polícia Federal (2024)**, **Receita Federal (2023)**, **INSS (2022)** e **TJSP (2023)** comprovam que a informática pode representar até 20 % da nota total, sendo decisiva para candidatos que buscam vagas em órgãos federais, estaduais e municipais.

Ao seguir o cronograma de 30 dias, utilizar os recursos de questões reais e aplicar as técnicas de resolução reversa e flashcards, o candidato transforma o bloco de informática de ponto fraco em diferencial competitivo. A prática constante, aliada ao monitoramento de desempenho, garante que, no dia da prova, o candidato responda rapidamente, sem hesitação, e converta o conhecimento em pontuação segura. Boa preparação e sucesso nas próximas seleções!