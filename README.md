# 📚 Passeja Concursos

Blog automatizado em Next.js 14 sobre concursos públicos brasileiros, com
geração diária de artigos por IA, simulado interativo, Q&A por artigo,
newsletter automática e painel administrativo completo — tudo publicado em
[passejaconcursos.com.br](https://passejaconcursos.com.br).

> Este projeto começou como um template genérico de "blog de nicho" e foi
> evoluindo especificamente para concursos públicos. Este README reflete o
> estado atual real do código — não um template replicável para qualquer
> nicho.

---

## Stack

- **Next.js 14** (App Router), deploy na **Vercel**
- **Markdown como CMS** — artigos ficam em `posts/`, sem banco de dados
  (o filesystem da Vercel é somente leitura em produção; escrita acontece
  via commit direto no GitHub, ver `lib/github-commit.js`)
- **Geração de conteúdo por IA multi-provider com fallback em cadeia**:
  `Grok → Groq → OpenRouter → Gemini` (`lib/article-generator.js`). Se um
  provider falhar ou estourar rate limit, tenta o próximo automaticamente.
- **GitHub Actions** para toda a automação (geração diária de posts, envio
  de newsletter, ping de indexação)
- **Resend** para e-mail transacional e newsletter (Contacts + Segments)

---

## Automações (GitHub Actions)

| Workflow | Quando roda | O que faz |
|---|---|---|
| `.github/workflows/generate-articles.yml` | 08:00 BRT, 1x/dia (+ manual) | Gera 1 artigo novo via IA, valida qualidade/duplicidade, commita em `posts/`, dispara deploy na Vercel e avisa os buscadores (IndexNow + Google Indexing API) |
| `.github/workflows/send-newsletter.yml` | 11:00 BRT, 1x/dia (+ manual) | Verifica se saiu post novo nas últimas 48h; se sim, dispara e-mail para os inscritos via Resend Broadcast; se não, pula o dia silenciosamente |

Ambos podem ser disparados manualmente na aba **Actions** do GitHub
(`workflow_dispatch`).

### Pipeline de geração de artigos — o que garante qualidade

A geração não é um prompt solto — passa por várias camadas em
`lib/article-generator.js` + `lib/quality-engine.js`:

- Deduplicação por **similaridade de Jaccard** contra `.content-signatures.json`
  (impede publicar dois artigos quase-idênticos)
- Controle de tópicos já usados (`.used-topics.json`)
- Validação de qualidade (tamanho mínimo, estrutura, título não vazio/lowercase)
- Log de execução em `.quality-log.json`, consultável na aba **Qualidade** do admin
- Card "Curiosidade" gerado por IA ao final de cada post (substituiu a
  integração anterior com banco de imagens de stock/Pexels)

---

## Painel Admin (`/admin`)

Protegido por senha (`ADMIN_PASSWORD`). Abas disponíveis:

| Aba | Para quê |
|---|---|
| 📊 **Métricas** | Vercel Analytics + Google Search Console num só lugar |
| 🎯 **Qualidade** | Relatório de duplicidade/qualidade dos posts, regenerar ou remover artigos problemáticos |
| 📝 **Editor** | Criar post manual (modo "Manual" ou com apoio de IA — "Lego") |
| 💬 **Feedbacks** | Feedbacks deixados por visitantes no site |
| 📬 **Newsletter** | Total de inscritos, lista de e-mails, botão de envio de teste |
| 🔗 **Afiliados** | Cadastrar/editar links de afiliado sem mexer em código |
| ⚙️ **Configurações** | Ajustes gerais do blog |
| 💡 **Ideias** | Sugestões de pauta puxadas do Reddit (r/concursospublicos, r/servidorpublico) |

Os botões de **Regenerar**/**Remover** rodam dentro de uma function
serverless (filesystem somente leitura em produção) — por isso commitam
direto no GitHub via API em vez de escrever em disco, e a Vercel rebuilda a
partir do novo commit (1–3 min).

---

## Funcionalidades da experiência de leitura

### 🧪 Simulado com IA (`/simulado`)
Gera questões inéditas via IA (fallback: banco estático em
`lib/quiz-bank.js` se todos os providers falharem) e dá feedback
personalizado de um "Tutor IA" ao final da prova. Usa
`OpenRouter → Gemini` (sem Groq — reservado exclusivamente para a geração
diária de posts, para não competir pela cota). Resultado pode ser enviado
por e-mail real via Resend (`lib/email-service.js`).

### 🤖 "Tire sua dúvida" — Q&A por artigo
No rodapé de cada post, o leitor pode perguntar algo e recebe uma resposta
gerada com base no conteúdo daquele artigo específico
(`lib/article-qa.js` + `components/ArticleQA.jsx`). Usa a mesma cadeia de
providers da geração de posts (`Grok → Groq → OpenRouter → Gemini`).
Rate-limit de 8 perguntas/10min por IP.

### 📬 Newsletter diária
Captura e-mail no rodapé do blog, guarda como Contact global no Resend e
associa a um Segment (`lib/newsletter-service.js`). Todo dia, se saiu post
novo, dispara um Broadcast para o Segment. Não precisa de banco de dados —
o Resend guarda os inscritos (grátis até 1.000 contacts).

> ⚠️ **Nota de manutenção**: a Resend renomeou "Audiences" para "Segments"
> e mudou o modelo de Contacts (agora são globais, associados
> explicitamente a um Segment). O arquivo `NEWSLETTER_SETUP.md` neste repo
> ainda descreve o modelo antigo ("Audience") e precisa de uma atualização
> — o comportamento real já está no modelo novo.

---

## Estrutura do Projeto

```
Blog_V1/
├── app/
│   ├── page.js                     # Homepage
│   ├── blog/[slug]/page.js         # Artigo individual (+ ArticleQA no rodapé)
│   ├── simulado/                   # Simulado com IA
│   ├── concursos/                  # Listagem de concursos
│   ├── admin/page.js               # Painel admin (todas as abas)
│   ├── og/[slug]/                  # Imagem OG dinâmica por post
│   └── api/
│       ├── admin/                  # Rotas do painel (métricas, qualidade, afiliados, newsletter...)
│       ├── article-qa/             # "Tire sua dúvida"
│       ├── newsletter/             # subscribe + send-daily
│       └── simulado/               # questions, tutor-feedback, send-result
├── components/                     # ArticleQA, NewsletterInline/Popup, Header, Footer...
├── lib/
│   ├── article-generator.js        # Fallback multi-provider (Grok/Groq/OpenRouter/Gemini)
│   ├── article-qa.js                # "Tire sua dúvida"
│   ├── quality-engine.js           # Deduplicação + validação de qualidade
│   ├── quiz-generator.js / quiz-bank.js  # Simulado
│   ├── newsletter-service.js       # Resend Contacts + Segments + Broadcasts
│   ├── email-service.js            # E-mail transacional (resultado do simulado)
│   ├── github-commit.js            # Escrita em produção via commit no GitHub
│   ├── seo-engine.js / faq-extractor.js / search-index.js
│   └── posts.js                    # Leitura de artigos Markdown
├── posts/                          # Artigos gerados (Markdown) — ~75+ atualmente
├── scripts/
│   ├── generate-article.js         # Geração via CLI/Action
│   ├── ping-indexing.js            # IndexNow + Google Indexing API
│   └── backfill-curiosity.js       # Gera cards de Curiosidade retroativos
├── .github/workflows/
│   ├── generate-articles.yml
│   └── send-newsletter.yml
└── site.config.js                  # Identidade, afiliados, categorias, AdSense
```

---

## Variáveis de ambiente

Veja `.env.example` para a lista completa e comentada. Resumo por área:

| Área | Variáveis |
|---|---|
| Geração de conteúdo | `GROK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY` |
| Indexação | `INDEXNOW_KEY`, `GOOGLE_SERVICE_ACCOUNT_B64` |
| E-mail (simulado + newsletter) | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_SEGMENT_ID` (opcional) |
| Newsletter (cron) | `NEWSLETTER_CRON_SECRET`, `SITE_URL` (secret do GitHub Actions) |
| Admin | `ADMIN_PASSWORD` |
| Escrita em produção (admin → GitHub) | `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`, `VERCEL_DEPLOY_HOOK` |

`RESEND_AUDIENCE_ID` (nome antigo) também é aceito como fallback de
`RESEND_SEGMENT_ID`, para não quebrar ambientes configurados antes da
migração da Resend — mas prefira a variável nova.

---

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves reais
npm run dev
```

```bash
npm run build        # build de produção
npm run generate-article -- --topic "tema específico" --count 1   # gerar 1 artigo manualmente
npm run backfill-curiosity                                        # gerar cards de Curiosidade em posts antigos que não têm
```

---

## Boas Práticas de SEO Implementadas

- ✅ Metadata dinâmica por página (title, description, OG, Twitter)
- ✅ JSON-LD structured data (Article schema)
- ✅ Imagem OG dinâmica por post (`app/og/[slug]`)
- ✅ Sitemap.xml + robots.txt automáticos
- ✅ IndexNow + Google Indexing API (ping automático após publicar)
- ✅ Canonical URLs, tempo de leitura, posts relacionados por categoria
- ✅ Headers semânticos (H1→H2→H3), filtro por categoria

---

## Monetização

- **AdSense**: configurado em `site.config.js` (`adsense.publisherId` +
  slots de anúncio)
- **Afiliados**: lista em `site.config.js` (Estratégia Concursos, Gran
  Cursos, QConcursos, Elite Concursos), com matching automático por
  palavra-chave do artigo (`lib/affiliate-matcher.js`) — editável também
  pela aba Afiliados do admin

---

## Aviso Legal

Artigos gerados por IA são revisados por camadas automáticas de qualidade
e deduplicação, mas revisão humana periódica é recomendada — o Google
penaliza conteúdo sem valor real (E-E-A-T). Links de afiliado devem ser
declarados conforme exigências do CONAR e boas práticas de transparência.
