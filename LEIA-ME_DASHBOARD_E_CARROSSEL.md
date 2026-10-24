# Dashboard de tráfego + carrossel "Novos artigos"

Os arquivos deste pacote têm os mesmos caminhos do repositório. Basta copiar a pasta
`app/`, `components/`, `lib/`, `tests/` e o `.env.example` por cima do projeto
(substituindo os 5 arquivos que já existiam).

## Arquivos NOVOS
| Arquivo | Função |
|---|---|
| `lib/visit-store.js` | Grava e lê as visitas no Upstash Redis (sem dependência nova) |
| `app/api/track/route.js` | Recebe cada visualização de página |
| `app/api/admin/analytics/route.js` | Entrega os números ao admin (protegido pela senha) |
| `components/PageViewTracker.jsx` | Envia a visita do navegador (sem cookies) |
| `components/admin/AnalyticsPanel.jsx` | Aba "Tráfego" do admin |
| `components/LatestCarousel.jsx` | Carrossel da home |
| `tests/visit-store.test.mjs` | 6 testes da lógica (rodam com `npm test`) |

## Arquivos ALTERADOS (mudanças pequenas)
- `app/layout.js` — 2 linhas: importa e renderiza `<PageViewTracker />`
- `app/admin/page.js` — 3 trechos: import, nova aba `traffic` em `TABS`, e `{tab === "traffic" && <AnalyticsPanel />}`
- `app/page.js` — a lista "Novos artigos" virou `<LatestCarousel posts={latestPosts} />` (agora com 10 artigos, antes 6)
- `app/styles/home.css` — CSS do carrossel acrescentado no FINAL do arquivo
- `.env.example` — documenta as 2 variáveis novas

Se preferir não substituir `admin/page.js` e `home.css` inteiros (caso tenha mexido neles depois),
aplique só os trechos acima à mão — são pequenos.

## Passo obrigatório para o dashboard mostrar dados reais
O site roda na Vercel, que não guarda dados em arquivo, então as visitas precisam de um banco.
O mais simples e gratuito é o **Upstash Redis**:

1. Vercel → seu projeto → **Storage** → **Create Database** → **Upstash (Redis)** → plano **Free**.
2. Conecte ao projeto. A Vercel cria sozinha `KV_REST_API_URL` e `KV_REST_API_TOKEN`
   (os nomes `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` também funcionam).
3. Faça um novo deploy.

Sem essas variáveis nada quebra: a aba "Tráfego" só mostra esse passo a passo.
O contador começa no dia em que for ativado — não é possível recuperar visitas passadas.

## Como funciona
- **Cada página vista** (inclusive navegação interna do Next) envia um POST para `/api/track`.
- **Não conta:** robôs/crawlers, pré-carregamentos do navegador, páginas que não existem
  (só entram caminhos conhecidos: páginas fixas e `/blog/<slug existente>`), e **as suas próprias
  visitas enquanto estiver logado no /admin**.
- **Visitantes únicos:** hash de IP + navegador + dia + segredo, que muda todo dia e não volta ao IP.
  Sem cookie e sem localStorage. "Visitantes" no painel = únicos por dia, somados
  (quem volta em outro dia conta de novo).
- **Dia, semana, mês:** os dados ficam por dia (fuso de Brasília); o painel agrupa em
  Dia / Semana (segunda a domingo) / Mês. Períodos: 7, 30, 90 dias e 12 meses.
- **Mostra:** visualizações, visitantes, hoje x ontem, média por dia, variação contra o período
  anterior, gráfico, páginas mais acessadas (com o título do artigo) e origens (Google, Facebook, direto…).

## Limites do plano gratuito do Upstash
Cada visualização usa 4 comandos de gravação. Confira a cota atual do plano Free em
upstash.com/pricing/redis. Abrir o painel por 30 dias consome ~150 comandos de leitura.
Se um dia o tráfego passar da cota, o contador deixa de gravar (o site continua normal).

## Recomendação: atualizar /privacidade
Vale acrescentar na página de privacidade uma frase como: "Medimos visitas de forma anônima e
agregada (páginas acessadas, origem do acesso), sem cookies e sem identificar você."

## Carrossel
- Arrastar com o dedo no celular; setas e teclado (← →) no desktop; barra de progresso embaixo.
- Cards compactos (capa 16:8, categoria, título em 2 linhas, data e tempo de leitura).
- Para mudar quantos artigos aparecem: `.slice(0, 10)` em `app/page.js`.
- Para mudar a largura dos cards: `flex-basis` de `.lc-slide` no fim do `home.css`.
