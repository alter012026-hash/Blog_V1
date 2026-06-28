# Newsletter diária — guia de configuração

O que foi implementado:

1. **Captação de e-mail**: caixa no rodapé do blog (`components/NewsletterBox.jsx`), que salva o e-mail como Contact em uma Audience do Resend.
2. **Painel admin**: nova aba "Newsletter" em `/admin` — mostra total de inscritos, lista de e-mails, e um botão de envio de teste.
3. **Envio diário automático**: um GitHub Action roda 1x/dia e chama uma rota que verifica se saiu post novo nas últimas 24h. Se sim, dispara um e-mail para todos os inscritos. Se não saiu nada, pula o dia silenciosamente.

Por que **não criei um banco de dados**: o filesystem da Vercel é somente leitura em produção (o próprio projeto já lida com isso via `lib/github-commit.js`). Em vez de subir um Postgres/Supabase só para guardar e-mails, usei o recurso de **Contacts** do Resend — o mesmo serviço que o projeto já usa para enviar e-mail. É grátis até 1.000 contatos e já cuida de descadastro (unsubscribe) automaticamente. Desde a atualização "New Contacts Experience" do Resend (nov/2025), os contatos são globais na conta — não existe mais a etapa de criar uma "Audience" separada com ID próprio.

---

## Passo 1 — Variáveis de ambiente na Vercel

Em **Project Settings → Environment Variables**, adicione (além das que já existem):

| Variável | Valor |
|---|---|
| `NEWSLETTER_CRON_SECRET` | uma string aleatória só sua. Gere com `openssl rand -hex 32` no terminal, ou qualquer gerador de senha forte |

As variáveis `RESEND_API_KEY` e `RESEND_FROM_EMAIL` você já tem configuradas (usadas pelo `/simulado`). Agora que o domínio está verificado no Resend, vale trocar `RESEND_FROM_EMAIL` de `onboarding@resend.dev` para algo como `Passeja Concursos <newsletter@passejaconcursos.com.br>`.

## Passo 2 — Secrets no GitHub (para o envio automático)

Em **Settings → Secrets and variables → Actions** do repositório, adicione:

| Secret | Valor |
|---|---|
| `NEWSLETTER_CRON_SECRET` | **o mesmo valor** que você colocou na Vercel no passo 2 |
| `SITE_URL` | `https://passejaconcursos.com.br` (sem barra no final) |

Esses dois já devem existir no repo (reaproveitados de outros workflows), confira se já estão lá:
- `VERCEL_DEPLOY_HOOK` — não é necessário para a newsletter, só citado por referência
- `GITHUB_TOKEN` — já usado pelo painel admin; a newsletter reaproveita o mesmo `lib/github-commit.js` para guardar o "último post avisado" em `data/newsletter-state.json`

## Passo 3 — Conferir o agendamento

O workflow `.github/workflows/send-newsletter.yml` roda todo dia às **11:00 (horário de Brasília)** — 3h depois do post diário ser gerado (08:00), para dar tempo do deploy na Vercel terminar antes de avisar os inscritos.

Quer testar sem esperar o cron? Vá em **Actions → Enviar Newsletter Diária → Run workflow** no GitHub, ou use o botão "Enviar teste" na aba Newsletter do `/admin` (esse manda só para um e-mail seu, não para a lista toda).

## Passo 4 — Deploy

Depois de configurar as variáveis acima, basta dar `git push` (ou subir o zip) — a Vercel rebuilda automaticamente e a caixa de inscrição já aparece no rodapé do blog.

---

## Como funciona por dentro (resumo técnico)

- `lib/newsletter-service.js` — fala com a API do Resend (criar contato, listar contatos, montar e enviar o broadcast).
- `app/api/newsletter/subscribe/route.js` — rota pública chamada pela caixa do rodapé.
- `app/api/newsletter/send-daily/route.js` — rota protegida por `NEWSLETTER_CRON_SECRET`, chamada pelo GitHub Action. Compara os posts atuais com `data/newsletter-state.json` (guardado no repo) para saber o que é novo, evitando reenviar o mesmo post duas vezes mesmo se o cron disparar mais de uma vez.
- `app/api/admin/newsletter/route.js` e `.../test-send/route.js` — usados só pelo painel `/admin`, protegidos pelo mesmo cookie de admin que as outras abas.
- `.github/workflows/send-newsletter.yml` — o cron diário.

## Limites do plano grátis do Resend

- 1.000 contatos na Audience
- 100 e-mails/dia, 3.000/mês (no broadcast, cada inscrito conta como 1 e-mail)

Se a lista crescer além disso, vale revisar o plano pago do Resend antes que os envios comecem a falhar silenciosamente.
