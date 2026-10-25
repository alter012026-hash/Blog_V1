# Faixa branca na home (anúncio vazio) — o que foi feito

## Causa provável
A tira branca entre "Destaque da semana" e "Explore concursos por estado" não vem do
layout do site. Ela é um contêiner `.google-auto-placed` criado pelos **Anúncios
automáticos** do Google AdSense, que ficou sem anúncio para exibir (sobra só a tira).
O site já usa locais fixos de anúncio, então os automáticos são redundantes.

## Correção no código (já aplicada neste zip)
- `app/styles/chrome.css`: contêineres automáticos vazios recolhem (`display:none`) e
  qualquer margem deslocada injetada pelo Google é neutralizada.
- `components/AdSliverGuard.jsx` (montado na home): recolhe só contêineres automáticos
  vazios ou finos (< 48px). Anúncios com conteúdo real nunca são tocados.
- `app/page.js`: o painel "Publicidade" ao lado do mapa só é renderizado quando o
  AdSense está configurado e em produção (antes aparecia uma caixa vazia).

## Correção definitiva (2 minutos, no painel do AdSense)
1. AdSense → **Anúncios** → **Por site** → seu site → **Editar** (lápis).
2. Em **Anúncios automáticos**, desligue **Anúncios in-page** (mantenha só os formatos
   que você realmente quer, ex.: nenhum, já que os locais fixos estão no código).
3. Salve. Pode levar algumas horas para refletir.

## Como confirmar a causa em 20 segundos
No Chrome (PC): clique com o botão direito na tira branca → **Inspecionar**.
Se o elemento tiver `google-auto-placed` ou `adsbygoogle`, é isso mesmo.
