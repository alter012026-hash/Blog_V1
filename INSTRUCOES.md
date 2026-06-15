# Instruções de instalação — Correções diretas

Copie cada arquivo desta pasta para o seu projeto em:
`C:\Users\alter\Desktop\blog-de-concursos_ofc\`

Mantenha a estrutura de pastas exatamente como está aqui.

---

## Arquivos incluídos e onde colocar

```
ESTE ZIP                                  →  SEU PROJETO
─────────────────────────────────────────────────────────
app/globals.css                           →  app/globals.css
components/Header.jsx                     →  components/Header.jsx
app/admin/page.js                         →  app/admin/page.js           (NOVO)
app/api/admin/auth/route.js               →  app/api/admin/auth/route.js (NOVO)
app/api/admin/metrics/route.js            →  app/api/admin/metrics/route.js (NOVO)
app/api/admin/affiliates/route.js         →  app/api/admin/affiliates/route.js (NOVO)
app/api/admin/config/route.js             →  app/api/admin/config/route.js (NOVO)
app/api/admin/indexing/route.js           →  app/api/admin/indexing/route.js (NOVO)
lib/admin-auth.js                         →  lib/admin-auth.js           (NOVO)
scripts/ping-indexing.js                  →  scripts/ping-indexing.js
.env.local                                →  .env.local
.env.example                              →  .env.example
```

---

## O que foi corrigido

### Bug do menu mobile (globals.css + Header.jsx)
- CSS reescrito: `.nav` usa `opacity/visibility` para animar, e `.nav.nav--open` reverte corretamente
- z-index reorganizado: header=10000, menu=9999, botão hamburguer=10001

### Admin — aba Configurações não carregava (app/api/admin/config/route.js)
- Reescrita a função `GET` que extraia os campos do `site.config.js` via regex
- Corrigidos os campos `authorName` e `authorBio` que retornavam undefined
- Corrigido o campo `adsenseEnabled` (boolean) que não era lido corretamente

---

## Configuração obrigatória no .env.local

Abra o arquivo `.env.local` e ajuste:

```
ADMIN_PASSWORD=coloque_sua_senha_aqui
```

Na Vercel, adicione também em Settings → Environment Variables:
- `ADMIN_PASSWORD` = sua senha
- `GOOGLE_SERVICE_ACCOUNT_B64` = (já está no .env.local que você recebeu)
- `INDEXNOW_KEY` = sua chave do IndexNow (se tiver)

---

## Acesso ao painel

Após deploy ou `npm run dev`:
→ http://localhost:3000/admin
→ https://seu-site.vercel.app/admin
