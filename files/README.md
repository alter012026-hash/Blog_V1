# 🎯 Passeja Concursos — Blog Automatizado com IA

> Blog de nicho em **Next.js 14** focado em concursos públicos, com geração automática de artigos via IA, painel admin completo, simulado com tutor IA e newsletter automática.

🌐 **Produção:** [passejaconcursos.com.br](https://passejaconcursos.com.br)  
📦 **Repositório:** GitHub → Vercel (deploy automático a cada commit)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Geração de conteúdo | Groq → OpenRouter → Gemini (fallback em cadeia) |
| Geração de imagens | Pollinations.ai (FLUX — gratuito, sem chave) |
| CMS | Markdown puro (`posts/*.md`) — zero banco de dados |
| Deploy | Vercel (serverless) |
| CI/CD | GitHub Actions |
| E-mail | Resend (simulado + newsletter) |
| Commit automático | GitHub API (serverless-safe) |

---

## Estrutura do Projeto

```
Blog_V1/
├── app/
│   ├── page.js                  # Homepage com contador e rotador de boas-vindas
│   ├── blog/
│   │   ├── page.js              # Listagem com filtro por categoria
│   │   └── [slug]/page.js       # Artigo individual
│   ├── simulado/page.js         # Simulado IA (questões geradas on-demand)
│   ├── concursos/               # Página de concursos abertos
│   ├── sobre/                   # Sobre o blog
│   ├── og/                      # Geração de OG images dinâmicas
│   ├── admin/page.js            # Painel admin (protegido por senha)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── affiliates/      # CRUD de afiliados
│   │   │   ├── auth/            # Autenticação do admin
│   │   │   ├── config/          # Leitura/edição do site.config.js
│   │   │   ├── ideas/           # Busca de ideias em Reddit (e proxy)
│   │   │   ├── indexing/        # Envio ao Google Indexing API
│   │   │   ├── metrics/         # Métricas do blog
│   │   │   ├── newsletter/      # Gestão de assinantes
│   │   │   └── quality/         # Regeneração de posts via IA
│   │   ├── newsletter/          # Rota de inscrição pública
│   │   └── simulado/
│   │       ├── questions/       # Gera questões via IA
│   │       ├── tutor-feedback/  # Feedback do tutor pós-prova
│   │       └── send-result/     # Envia resultado por e-mail (Resend)
│   ├── sitemap.js               # Sitemap dinâmico
│   └── robots.js                # robots.txt
│
├── components/
│   ├── Header.jsx               # Navegação + ThemeToggle + SearchPalette
│   ├── Footer.jsx
│   ├── PostCard.jsx
│   ├── SEO.jsx                  # Metadata + JSON-LD
│   ├── AdSense.jsx
│   ├── AffiliateBox.jsx         # Box de afiliado injetado automaticamente
│   ├── CuriosityCard.jsx        # Card de curiosidade nos artigos
│   ├── NewsletterBox.jsx        # Caixa de captura de e-mail
│   ├── ReadProgressEnhanced.jsx # Barra de progresso com milestones (25/50/75/100%)
│   ├── WelcomeCountdownRotator.jsx # Alterna boas-vindas e countdown do próximo post
│   ├── NextPostCountdown.jsx    # Contador regressivo até o próximo artigo
│   ├── ScrollReveal.jsx         # Animação de entrada ao rolar
│   ├── SearchPalette.jsx        # Busca rápida (Ctrl+K)
│   └── ThemeToggle.jsx          # Dark/light mode
│
├── lib/
│   ├── posts.js                 # Leitura e parse dos .md
│   ├── article-generator.js     # Núcleo de geração de artigos (serverless-safe)
│   ├── quiz-generator.js        # Geração de questões e feedback do tutor
│   ├── quiz-bank.js             # Banco estático (~90 questões, fallback)
│   ├── newsletter-service.js    # Gerencia assinantes + envio diário (Resend)
│   ├── email-service.js         # Envio de e-mails transacionais (Resend)
│   ├── github-commit.js         # Commit via GitHub API (sem tocar no disco)
│   ├── affiliate-matcher.js     # Injeta links de afiliado nos artigos
│   ├── quality-engine.js        # Valida qualidade do artigo gerado
│   ├── seo-engine.js            # Helpers de SEO
│   ├── faq-extractor.js         # Extrai FAQs dos artigos
│   ├── search-index.js          # Índice de busca client-side
│   └── admin-auth.js            # Autenticação do painel admin
│
├── scripts/
│   ├── generate-article.js      # CLI de geração (GitHub Actions / local)
│   ├── detect-topic-overlap.js  # Detecta duplicatas de tópicos
│   ├── fix-existing-titles.js   # Corrige títulos de posts antigos
│   ├── backfill-curiosity.js    # Adiciona campo curiosity nos posts legados
│   ├── ping-indexing.js         # Pinga Google Indexing API manualmente
│   └── validate-posts.js        # Valida frontmatter dos posts
│
├── posts/                       # ← Artigos em Markdown (gerados automaticamente)
├── public/
│   ├── images/                  # Capas geradas pelo Pollinations.ai
│   └── ads.txt                  # Verificação AdSense
│
├── .github/workflows/
│   ├── generate-articles.yml    # Gera 1 artigo/dia às 08:00 BRT
│   └── send-newsletter.yml      # Envia newsletter às 11:00 BRT
│
└── site.config.js               # ← CONFIGURAÇÃO CENTRAL (edite apenas este)
```

---

## Setup Inicial

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/Blog_V1
cd Blog_V1
npm install
```

### 2. Configure o blog

Edite **`site.config.js`** — é o único arquivo que você precisa mudar para personalizar o blog:

```js
name: "Passeja Concursos",
niche: "concursos públicos",
url: "https://passejaconcursos.com.br",
// afiliados, categorias, AdSense...
```

### 3. Variáveis de ambiente

Crie `.env.local` na raiz:

```bash
# Geração de artigos (pelo menos uma é obrigatória)
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
GEMINI_API_KEY=AIza...

# Commit serverless (obrigatório para o admin funcionar)
GITHUB_TOKEN=ghp_...
GITHUB_REPO=usuario/Blog_V1
GITHUB_BRANCH=main

# Rebuild automático após commit
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...

# E-mail (simulado + newsletter)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Passeja Concursos <contato@passejaconcursos.com.br>"

# Admin
ADMIN_PASSWORD=sua_senha_segura

# Google Indexing API (opcional)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 4. Gere os primeiros artigos

```bash
# 1 artigo com tema aleatório (configurado em site.config.js)
npm run generate-article

# Tema específico
node scripts/generate-article.js --topic "como estudar para o INSS" --count 1

# Com imagem de referência para capa (usa modelo kontext)
node scripts/generate-article.js --topic "Carreira de Auditor" --reference-image "https://..."
```

### 5. Rode localmente

```bash
npm run dev   # http://localhost:3000
npm run build # build de produção
```

---

## Deploy na Vercel

1. Importe o repositório em [vercel.com](https://vercel.com)
2. Adicione todas as variáveis de ambiente em **Settings → Environment Variables**
3. Deploy automático a cada push na branch `main`

> ⚠️ **Importante para o admin funcionar em produção:** a Vercel tem filesystem read-only. Toda escrita (geração, regeneração, remoção de posts) é feita via **GitHub API** — o código commita direto no repositório, e a Vercel rebuilda automaticamente.

---

## Automação com GitHub Actions

### Geração de artigos — `generate-articles.yml`

Roda todo dia às **08:00 BRT** (11:00 UTC) e gera 1 artigo.

**Secrets necessários no GitHub** (Settings → Secrets and variables → Actions):

| Secret | Descrição |
|--------|-----------|
| `GROQ_API_KEY` | Chave Groq (principal gerador, gratuito) |
| `OPENROUTER_API_KEY` | Fallback 1 |
| `GEMINI_API_KEY` | Fallback 2 |
| `VERCEL_DEPLOY_HOOK` | URL do Deploy Hook da Vercel |

### Newsletter — `send-newsletter.yml`

Roda todo dia às **11:00 BRT** e envia o último artigo para assinantes.

**Secret adicional:**

| Secret | Descrição |
|--------|-----------|
| `RESEND_API_KEY` | Chave Resend |

### Rodar manualmente

GitHub → aba **Actions** → workflow desejado → **Run workflow**

### Conflitos de commit

O GitHub Actions commita artigos automaticamente. Se você fizer push local ao mesmo tempo, pode ter conflito. Resolva com:

```bash
git pull --rebase && git push
```

---

## Painel Admin (`/admin`)

Acesso protegido por senha (`ADMIN_PASSWORD`). Interface responsiva com:

- **Sidebar** no desktop (fixa no topo)
- **Bottom nav** no mobile

### Abas disponíveis

| Aba | Função |
|-----|--------|
| 📊 **Métricas** | Total de posts, categorias, palavras, tempo médio de leitura |
| 🤝 **Afiliados** | Adicionar, editar e remover links de afiliado (commita no GitHub) |
| ⚙️ **Configurações** | Editar nome, tagline, nicho, autor e outras configs do `site.config.js` |
| 🔍 **Indexação** | Enviar URLs ao Google Indexing API manualmente |
| 💡 **Ideias** | Busca de ideias de pauta nos subreddits r/concursospublicos e r/servidorpublico |

### Regenerar / Remover posts

Cada post na lista tem botões para **Regenerar** (reescreve o conteúdo mantendo o mesmo slug e URL) e **Remover**. Ambos operam via commit no GitHub — não tentam escrever no disco da Vercel.

---

## Geração de Imagens de Capa

Cada artigo gerado recebe automaticamente uma imagem de capa via **Pollinations.ai** (FLUX):

- Gratuito, sem necessidade de chave de API
- Imagem salva em `public/images/<slug>.jpg`
- Tamanho 1200×630px (ideal para OG image)
- `private=true` — não aparece no feed público do Pollinations
- Suporte a `--reference-image` para usar o modelo **kontext** (image-to-image)

Se a geração de imagem falhar (timeout, API fora do ar), o artigo é salvo normalmente sem capa — nunca bloqueia a geração de conteúdo.

---

## Simulado com Tutor IA (`/simulado`)

Página de simulado com questões geradas on-demand pela IA, estilo das principais bancas (CESPE, FCC, FGV, VUNESP, IBFC).

**Fluxo:**

1. Usuário seleciona disciplina e número de questões
2. `/api/simulado/questions` gera as questões via Groq → OpenRouter → Gemini
3. Usuário responde e submete
4. `/api/simulado/tutor-feedback` gera análise personalizada do desempenho
5. Resultado pode ser enviado por e-mail real via `/api/simulado/send-result` (Resend)

**Fallback:** se a IA falhar, o simulado funciona com o banco estático de ~90 questões (`lib/quiz-bank.js`). A experiência nunca quebra.

---

## Newsletter Automática

Sistema completo de captura e envio de newsletter:

- Formulário de inscrição (`NewsletterBox.jsx`) disponível nos artigos
- Assinantes armazenados no Resend (contacts)
- Envio automático diário via GitHub Actions às 11:00 BRT com o último artigo publicado
- Rota de inscrição: `POST /api/newsletter`
- Gestão de assinantes no painel admin (aba Configurações ou rota dedicada)

---

## Provedores de IA — Fallback em Cadeia

A geração de conteúdo tenta os provedores nesta ordem:

```
1. Groq (gratuito, mais rápido)
   ↓ falha
2. OpenRouter
   ↓ falha
3. Gemini (Google AI)
```

Cada provider é testado com timeout. Se todos falharem, o script loga o erro e encerra sem criar arquivo — evitando artigos vazios no repositório.

---

## SEO Implementado

- ✅ Metadata dinâmica por página (title, description, OG, Twitter Cards)
- ✅ JSON-LD structured data (Article schema)
- ✅ Sitemap.xml automático (`/sitemap.js`)
- ✅ robots.txt dinâmico
- ✅ Canonical URLs
- ✅ OG images geradas dinamicamente (`/og`)
- ✅ Tempo de leitura e contagem de palavras
- ✅ Posts relacionados por categoria
- ✅ Headers semânticos H1→H2→H3
- ✅ Filtro de artigos por categoria

---

## Variáveis de Ambiente — Referência Completa

| Variável | Obrigatória | Descrição |
|----------|------------|-----------|
| `GROQ_API_KEY` | Sim (ou outra IA) | Gerador principal (gratuito) |
| `OPENROUTER_API_KEY` | Não | Fallback geração |
| `GEMINI_API_KEY` | Não | Fallback geração |
| `GITHUB_TOKEN` | Sim (admin) | PAT com write no repositório |
| `GITHUB_REPO` | Sim (admin) | `usuario/Blog_V1` |
| `GITHUB_BRANCH` | Não | `main` (padrão) |
| `VERCEL_DEPLOY_HOOK` | Não | Acelera rebuild pós-commit |
| `RESEND_API_KEY` | Sim (e-mail) | Simulado + newsletter |
| `RESEND_FROM_EMAIL` | Não | Remetente dos e-mails |
| `ADMIN_PASSWORD` | Sim | Senha do painel `/admin` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Não | Google Indexing API |

---

## Scripts Utilitários

```bash
# Gerar artigo(s)
npm run generate-article
node scripts/generate-article.js --topic "tema" --count 1

# Detectar artigos com tópicos muito parecidos
node scripts/detect-topic-overlap.js

# Corrigir títulos de posts antigos
node scripts/fix-existing-titles.js

# Pingar Google Indexing API para todos os posts
node scripts/ping-indexing.js

# Validar frontmatter de todos os posts
node scripts/validate-posts.js

# Adicionar campo curiosity em posts legados
npm run backfill-curiosity
```

---

## Replicar para Outro Nicho

1. Fork ou clone o repositório
2. Edite apenas `site.config.js` com o novo nicho, categorias e afiliados
3. Delete `posts/*.md` (ou mantenha como base)
4. Crie novo repositório no GitHub + novo projeto na Vercel
5. Configure as variáveis de ambiente
6. Pronto — cada blog é totalmente independente

---

## Aviso Legal

Artigos gerados por IA devem ser revisados periodicamente. O Google avalia E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) — conteúdo genérico sem valor real pode ser penalizado. Os prompts do sistema foram otimizados para qualidade, mas revisão humana é recomendada.

Links de afiliado devem ser declarados conforme o CONAR e boas práticas de transparência com o leitor.
