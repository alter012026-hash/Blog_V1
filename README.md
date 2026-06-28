# 🚀 Niche Blog — Blog Automatizado com IA

Blog de nicho em Next.js 14 com geração automática de artigos via Claude (Anthropic), SEO on-page completo, suporte a AdSense e links de afiliado.

---

## Stack

- **Next.js 14** (App Router)
- **Claude claude-sonnet-4-20250514** para geração de conteúdo
- **GitHub Actions** para automação (3 artigos/dia)
- **Vercel** para deploy
- **Markdown** como CMS (zero banco de dados)

---

## Setup em 5 Passos

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/seu-repo
cd seu-repo
npm install
```

### 2. Configure o blog

Edite **`site.config.js`** — é o único arquivo que você precisa mudar:

```js
name: "Seu Blog",
niche: "seu nicho aqui",
url: "https://seu-dominio.com.br",
// adicione seus links de afiliado...
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
# Edite .env.local com sua ANTHROPIC_API_KEY
```

Obtenha sua chave em: https://console.anthropic.com/

### 4. Gere os primeiros artigos

```bash
# Gera 3 artigos (padrão do config)
npm run generate-article

# Gera 1 artigo sobre tema específico
node scripts/generate-article.js --topic "como guardar dinheiro" --count 1
```

### 5. Rode e faça deploy

```bash
npm run dev          # Desenvolvimento local
npm run build        # Build de produção
```

**Deploy na Vercel:**
1. Importe o repositório em [vercel.com](https://vercel.com)
2. Adicione `ANTHROPIC_API_KEY` nas Environment Variables da Vercel
3. Deploy automático a cada push

---

## Automação com GitHub Actions

A pipeline roda 3x por dia e gera 1 artigo por execução.

### Configurar Secrets no GitHub

Vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Valor |
|--------|-------|
| `ANTHROPIC_API_KEY` | Sua chave da Anthropic |
| `VERCEL_DEPLOY_HOOK` | URL do Deploy Hook da Vercel (opcional) |

### Obter o Vercel Deploy Hook

1. No dashboard da Vercel, acesse seu projeto
2. **Settings → Git → Deploy Hooks**
3. Crie um hook chamado "github-actions"
4. Copie a URL e cole no Secret `VERCEL_DEPLOY_HOOK`

### Rodar manualmente

Na aba **Actions** do GitHub → **Gerar e Publicar Artigos** → **Run workflow**

---

## Painel Admin: Regenerar, remover posts e editar afiliados em produção

O `/admin` tem botões para **regenerar** o conteúdo de um post (mantendo a mesma
URL), **remover duplicatas**, e a aba **Afiliados** permite cadastrar/editar os
links de afiliado direto pelo navegador. Todos esses botões rodam dentro de uma
function serverless da Vercel — que tem filesystem **somente leitura** em
produção — então eles não escrevem em disco. Em vez disso, comitam direto no
GitHub via API (mesma lógica que o GitHub Action de geração automática já
usa), e a Vercel rebuilda a partir do novo commit.

### Variáveis de ambiente necessárias na Vercel

Configure em **Settings → Environment Variables** no seu projeto na Vercel:

| Variável | Valor |
|----------|-------|
| `GITHUB_TOKEN` | Personal Access Token com permissão de escrita no repo ([criar aqui](https://github.com/settings/tokens)) |
| `GITHUB_REPO` | `usuario/repositorio` |
| `GITHUB_BRANCH` | `main` (ou a branch que a Vercel builda) |
| `VERCEL_DEPLOY_HOOK` | Mesma URL de Deploy Hook usada no GitHub Action (opcional, acelera o rebuild) |

> Sem `GITHUB_TOKEN`/`GITHUB_REPO`, os botões de Regenerar/Remover retornam erro
> explicando o que falta — eles nunca tentam escrever no disco da Vercel.

Depois de clicar em Regenerar ou Remover, o painel mostra que o commit foi
enviado, mas o site só reflete a mudança depois que a Vercel terminar o
próximo deploy (1–3 minutos).

---

## Estrutura do Projeto

```
niche-blog/
├── app/                    # Next.js App Router
│   ├── page.js             # Homepage
│   ├── blog/
│   │   ├── page.js         # Listagem de artigos
│   │   └── [slug]/page.js  # Artigo individual
│   ├── sitemap.js          # Sitemap dinâmico
│   └── robots.js           # robots.txt
├── components/             # Componentes React
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── PostCard.jsx
│   ├── SEO.jsx
│   └── AdSense.jsx
├── lib/
│   └── posts.js            # Leitura de artigos Markdown
├── posts/                  # ← Artigos gerados ficam aqui
├── scripts/
│   └── generate-article.js # Script de geração
├── .github/workflows/
│   └── generate-articles.yml
└── site.config.js          # ← CONFIGURE AQUI
```

---

## Configurar AdSense

1. Crie conta em [Google AdSense](https://adsense.google.com)
2. Adicione seu site e aguarde aprovação (pode levar dias)
3. Após aprovado, insira seu Publisher ID em `site.config.js`:
   ```js
   adsense: {
     enabled: true,
     publisherId: "ca-pub-XXXXXXXXXXXXXXXX",
   }
   ```

---

## Boas Práticas de SEO Implementadas

- ✅ Metadata dinâmica por página (title, description, OG, Twitter)
- ✅ JSON-LD structured data (Article schema)
- ✅ Sitemap.xml automático
- ✅ robots.txt
- ✅ Canonical URLs
- ✅ Tempo de leitura e contagem de palavras
- ✅ Posts relacionados por categoria
- ✅ Headers semânticos (H1→H2→H3)
- ✅ Filtro por categoria

---

## Replicar para Outros Nichos

Para criar um novo blog em outro nicho:

1. Faça fork ou clone do repositório
2. Edite **apenas** `site.config.js` com o novo nicho
3. Apague os artigos em `posts/` (ou mantenha como base)
4. Configure novo repositório no GitHub + novo projeto na Vercel

Cada blog é independente. Mesma base de código, configuração diferente.

---

## Simulado com IA (Tutor + Geração de Questões) e E-mail Real

A página `/simulado` foi atualizada para gerar questões inéditas via IA (em vez
de um banco fixo de ~90 questões) e dar feedback personalizado de um "Tutor IA"
ao final da prova. O envio do resultado por e-mail também passou a ser real
(antes era só um link `mailto:`).

**O que mudou:**

- `lib/quiz-bank.js` — o banco de questões estático antigo, extraído da página.
  Agora serve só de **fallback**: se a IA falhar (provedores fora do ar, JSON
  inválido), o simulado continua funcionando com essas questões fixas.
- `lib/quiz-generator.js` — gera questões e o feedback do tutor, reaproveitando
  a mesma cadeia Groq → OpenRouter → Gemini já configurada em
  `lib/article-generator.js`. **Não precisa de nenhuma chave nova** para isso.
- `lib/email-service.js` + `app/api/simulado/send-result/route.js` — envio
  real de e-mail via [Resend](https://resend.com). Precisa de uma chave nova:

  ```bash
  # .env.local
  RESEND_API_KEY=re_xxxxxxxx       # https://resend.com/api-keys (free: 100/dia)
  RESEND_FROM_EMAIL="Passeja Concursos <onboarding@resend.dev>"
  ```

  Sem domínio verificado no Resend, o remetente padrão
  (`onboarding@resend.dev`) só entrega para o e-mail da própria conta Resend —
  bom para testar, mas para enviar a qualquer aluno em produção é necessário
  verificar um domínio em [resend.com/domains](https://resend.com/domains) e
  trocar `RESEND_FROM_EMAIL` para um endereço desse domínio.

- Novas rotas: `app/api/simulado/questions` (gera as questões) e
  `app/api/simulado/tutor-feedback` (gera o feedback pós-prova). Ambas
  retornam `200` mesmo quando a IA falha — o front-end degrada para o banco
  estático ou esconde o card de feedback, nunca quebra a experiência.

Sem nenhuma configuração extra, o simulado continua 100% funcional usando
apenas o banco estático (como antes). As chaves de Groq/OpenRouter/Gemini que
já existem habilitam a geração ilimitada de questões; a `RESEND_API_KEY`
habilita o envio real de e-mail.

---

## Aviso Legal

Artigos gerados por IA devem ser revisados antes da publicação em escala. O Google penaliza conteúdo sem valor ou experiência real (E-E-A-T). Os prompts do sistema foram otimizados para gerar conteúdo de qualidade, mas revisão humana periódica é recomendada.

Links de afiliado devem ser declarados conforme exigências do CONAR e boas práticas de transparência.
