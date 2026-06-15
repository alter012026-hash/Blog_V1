# 🚀 Guia de Indexação Rápida no Google

Este projeto usa **dois mecanismos** para acelerar a indexação:

| Mecanismo | O que faz | Dificuldade |
|---|---|---|
| **IndexNow** | Notifica Bing, Yandex e DuckDuckGo em segundos | ⭐ Fácil |
| **Google Indexing API** | Pinga o Google diretamente sobre URLs novas | ⭐⭐ Médio |
| **Sitemap ping** | Avisa o Google que o sitemap mudou | ⭐ Automático |

---

## 1. IndexNow (Bing + Yandex + DuckDuckGo)

### Passo 1 — Gerar a chave

1. Acesse: https://www.bing.com/indexnow/getstarted
2. Clique em **Generate API Key**
3. Copie a chave gerada (ex: `a1b2c3d4e5f6...`)

### Passo 2 — Publicar o arquivo de verificação

Substitua o conteúdo de `public/indexnow-key.txt` pela sua chave:

```
a1b2c3d4e5f6...
```

Depois renomeie o arquivo para `public/<sua-chave>.txt`  
Ex: `public/a1b2c3d4e5f6.txt`

> O arquivo precisa estar acessível em:  
> `https://seusite.com/42eae02bc7524825bc97e8d8c50654d1.txt`

### Passo 3 — Adicionar ao .env.local

```env
INDEXNOW_KEY=a1b2c3d4e5f6...
```

### Passo 4 — Adicionar ao GitHub Secrets

Em **Settings → Secrets → Actions**, crie:
- `INDEXNOW_KEY` → sua chave

---

## 2. Google Indexing API

> ⚠️ A API do Google funciona oficialmente para "Job Postings" e "LiveStream",  
> mas na prática acelera a indexação de qualquer URL.

### Passo 1 — Criar um projeto no Google Cloud

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto (ex: "Aprovado Já Blog")
3. Ative a **Web Search Indexing API**:
   - Menu → APIs e Serviços → Biblioteca
   - Busque "Web Search Indexing API" → Ativar

### Passo 2 — Criar Service Account

1. Menu → APIs e Serviços → Credenciais
2. Clique em **Criar credenciais → Conta de serviço**
3. Dê um nome (ex: `indexing-bot`)
4. Clique em **Concluído**
5. Clique na conta criada → aba **Chaves** → **Adicionar chave → JSON**
6. Faça download do arquivo `.json`

### Passo 3 — Adicionar ao Google Search Console

1. Acesse: https://search.google.com/search-console
2. Configurações → Usuários e permissões → **Adicionar usuário**
3. Cole o e-mail da Service Account (ex: `indexing-bot@projeto.iam.gserviceaccount.com`)
4. Permissão: **Proprietário**

### Passo 4 — Converter o JSON para base64

No terminal:
```bash
base64 -i seu-arquivo-service-account.json | tr -d '\n'
```
Copie o resultado.

### Passo 5 — Adicionar ao GitHub Secrets

Em **Settings → Secrets → Actions**, crie:
- `GOOGLE_SERVICE_ACCOUNT_B64` → o base64 do passo anterior

---

## 3. Uso manual (opcional)

```bash
# Pinga todos os posts
node scripts/ping-indexing.js

# Pinga só posts publicados hoje
node scripts/ping-indexing.js --new

# Pinga uma URL específica
node scripts/ping-indexing.js --url /blog/meu-artigo
```

---

## 4. Como funciona automaticamente

O GitHub Actions já está configurado para:

1. Gerar e publicar o artigo
2. Fazer o deploy na Vercel
3. **Aguardar 60 segundos** (tempo do deploy)
4. **Pingar automaticamente** as URLs novas no Google + IndexNow

Você não precisa fazer nada — cada novo artigo é notificado sozinho.

---

## 5. Verificar se funcionou

- **IndexNow**: acesse https://www.bing.com/webmaster → Relatório IndexNow
- **Google**: Search Console → Inspeção de URL → cole a URL e clique em "Solicitar indexação"

---

## Resumo das variáveis de ambiente

```env
# .env.local
INDEXNOW_KEY=sua_chave_aqui
GOOGLE_SERVICE_ACCOUNT_B64=base64_do_json_aqui
```

```
# GitHub Secrets
INDEXNOW_KEY
GOOGLE_SERVICE_ACCOUNT_B64
```
