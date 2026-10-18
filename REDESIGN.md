# Passeja Concursos — Redesign v4 "Cartão-resposta"

## Conceito
O objeto mais icônico de quem faz concurso é o **cartão-resposta**: a grade de
bolinhas A·B·C·D·E preenchida a caneta. A identidade inteira fala essa língua:

- **Logo:** uma bolinha já marcada (anel + miolo amarelo + visto). "Passeja" = "passe já".
- **Capa de cada artigo:** um cartão-resposta preenchido, na cor da categoria
  (gerado por slug, sem imagem: leve e consistente nos 139 artigos).
- **Bolinha preenchida = marcador de escolha:** menu ativo, filtros, índice do artigo,
  listas, tópicos, "Por onde começar?".
- **Cores:** azul-caneta `#2430E6`, amarelo marca-texto `#FFD43B`, tinta `#12163A`,
  papel `#F4F6FF` (frio, não creme). Seleção de texto = marca-texto. Cada categoria tem um
  matiz próprio (`lib/category-meta.js`).
- **Tipografia:** Bricolage Grotesque (títulos/interface) + Literata (leitura longa,
  desenhada para telas pequenas).

## O que os dados do Google (últimos 6 meses) mostraram → decisão
| Dado | Decisão |
|---|---|
| 60% das impressões e 15 de 26 cliques vêm do **celular** | Mobile-first de verdade: dock inferior com 5 atalhos, menu em tela cheia, cards em linha compacta, tabelas com rolagem lateral, alvos de toque ≥ 44px |
| CTR médio 0,89% com posição ~10 | Cards e listas centrados no **título** (3 linhas), data + tempo de leitura, índice do artigo, WhatsApp |
| Buscas: cronograma/plano de estudos, plano de carreira INSS, avaliação de títulos, cursos gratuitos, rotina de estudos, editais "o que mudou" | Hero com **"Por onde você quer começar?"** (config `quickStart`) levando direto a esses conteúdos |
| Páginas com muita impressão e quase nenhum clique (Nível médio × superior: 614 imp.; Agente penitenciário: 520 imp.) | Seção **"Mais procurados"** na home (config `trending`) reforça links internos para elas |
| Quase 100% Brasil | Texto 100% pt-BR, compartilhamento por **WhatsApp** |

## Principais mudanças
- **Transições entre páginas** (View Transitions API): a página recua e a nova sobe; header e dock ficam
  fixos; a capa do card clicado "viaja" até o topo do artigo. Em navegadores sem suporte (ou com
  "reduzir movimento") vira um fade simples. `components/ViewTransitions.jsx`.
- **Header/Footer agora vivem no `layout.js`** (antes cada página importava os seus): header persistente,
  busca disponível em todas as páginas (inclusive simulado), menos código repetido.
- **Menu enxuto:** 6 itens principais; Sobre/Metodologia/Privacidade/Contato foram para o rodapé.
- **Artigo:** migalhas, capa-faixa, índice lateral fixo (desktop) / recolhível (celular), botões de
  WhatsApp e copiar link, leitura em Literata, tabelas e citações redesenhadas.
- **Home:** hero com grade de cartão-resposta animada (um único momento de animação), mais procurados,
  novos artigos, temas coloridos (carrossel no celular), simulado/materiais, bloco de confiança editorial, newsletter.
- **Sem animação de scroll em cada seção** (melhor LCP/CLS no celular). `prefers-reduced-motion` respeitado.

## Correções de bugs encontrados no caminho
1. **Fontes nunca carregavam em produção:** o `@import` do Google Fonts era bloqueado pela CSP do
   `next.config.js` (`font-src 'self'`). Agora usa `next/font` (auto-hospedado) — carrega e ainda é mais rápido.
2. **"Invalid Date" no artigo:** `post.date` já é ISO e o código concatenava `"T12:00:00"`. Corrigido.
3. Ícone do site (`app/icon.svg`) — antes não havia favicon.

## Onde mexer
- Cores/tipografia/espaçamentos: `app/styles/tokens.css`
- Header, menu, dock, busca, rodapé: `app/styles/chrome.css`
- Home e cards: `app/styles/home.css` · Artigo/leitura: `app/styles/article.css`
- Textos do "Por onde começar", "Mais procurados" e menu: `site.config.js`
- Cor de uma categoria: `lib/category-meta.js` (campo `hue`, 0–360)
- Desligar o ticker lateral (telas ≥1720px): remover `<SideTicker />` de `app/layout.js`

## Observações
- Se o AdSense ativar **anúncios de âncora** no celular, eles podem sobrepor o dock; desative "âncora" nos anúncios automáticos.
- Testado em Chromium (390px e 1440px, claro e escuro) com build de produção. Não testado em aparelhos reais/Safari.
- Sugestão de SEO (fora do escopo visual): reescrever título/descrição dos artigos com muitas impressões e CTR ~0
  (ex.: "Nível médio ou superior…", "Agente penitenciário…") com a pergunta exata que o candidato digita.
- Arquivo antigo `app/globals.css` removido (substituído por `app/styles/*.css`). Componentes não usados
  (`WelcomeBanner`, `ReadProgress`) foram mantidos.
