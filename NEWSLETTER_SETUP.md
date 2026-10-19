# Newsletter — configuração e fluxo atual

A inscrição usa Contacts globais do Resend associados ao Segment configurado
(`RESEND_SEGMENT_ID`, com compatibilidade temporária para
`RESEND_AUDIENCE_ID`). Não é necessário manter uma lista de e-mails em arquivos
do repositório.

Os formulários do rodapé, dos artigos/home e do convite flutuante exigem
consentimento explícito e enviam somente a origem da página junto da inscrição.
O endpoint público valida consentimento, e-mail, origem e limite por IP. Após
sucesso, a instrumentação registra `newsletter_signup_success` com a origem e
a data, sem enviar e-mail ou nome ao Analytics. `newsletter_signup_start`
também não contém dados pessoais.

## Variáveis e workflows

Na Vercel, configure:

| Variável | Uso |
|---|---|
| `RESEND_API_KEY` | Criar/listar Contacts e enviar Broadcasts |
| `RESEND_FROM_EMAIL` | Remetente verificado no Resend |
| `RESEND_SEGMENT_ID` | Segment da newsletter; opcional se o serviço conseguir localizar/criar o Segment |
| `NEWSLETTER_CRON_SECRET` | Proteger a rota de envio diário |

No GitHub Actions, configure `NEWSLETTER_CRON_SECRET` com o mesmo valor e
`SITE_URL=https://passejaconcursos.com.br`.

O workflow `.github/workflows/send-newsletter.yml` consulta a rota diária
protegida. A rota compara posts publicados com `data/newsletter-state.json`,
enviando apenas publicações ainda não notificadas. Rascunhos editoriais não
entram em `posts/` e não são enviados nem publicados.

O botão de teste no admin envia apenas ao endereço informado. A lista e os
descadastros são consultados no Resend; cada e-mail deve manter o link de
cancelamento fornecido pelo Resend. O painel mostra os contatos ativos e
descadastrados.

## Operação e privacidade

- `lib/newsletter-service.js` implementa Contacts, Segment e Broadcasts.
- `app/api/newsletter/subscribe/route.js` valida a inscrição pública.
- `app/api/newsletter/send-daily/route.js` executa o envio idempotente.
- `app/api/admin/newsletter/route.js` e `.../test-send/route.js` são restritas ao admin.
- A data e a origem dos eventos analíticos são agregadas e não incluem e-mail.
- O evento de descadastro ainda é acompanhado pelo estado do Contact no Resend,
  não por um evento próprio no Analytics.

Confira limites e preços atuais diretamente no painel/planos do Resend, pois
eles podem mudar.
