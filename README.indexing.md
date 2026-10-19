# Descoberta e indexação de URLs

## Artigos editoriais

Artigos comuns são descobertos pelo Google por meio do sitemap XML e dos links
internos do site. Enviar essas URLs à Google Indexing API não é um mecanismo
suportado para artigos editoriais: a API é destinada a páginas com `JobPosting`
ou transmissões ao vivo (`BroadcastEvent` em `VideoObject`), conforme a
[documentação oficial](https://developers.google.com/search/apis/indexing-api/v3/quickstart).

Para artigos editoriais:

1. Confira `https://passejaconcursos.com.br/sitemap.xml`.
2. Envie o sitemap pelo Google Search Console e acompanhe os relatórios de
   indexação e desempenho.
3. Garanta que artigos importantes recebam links internos contextuais.
4. Use a Inspeção de URL no Search Console para diagnosticar uma página
   específica. Solicitar indexação não garante que ela será indexada.

Não configure `GOOGLE_SERVICE_ACCOUNT_B64` nem credenciais Google para
notificar URLs editoriais pela Indexing API.

## IndexNow (Bing e mecanismos compatíveis)

IndexNow pode notificar mecanismos participantes sobre URLs novas ou
atualizadas. Configure uma chave e disponibilize o arquivo de verificação no
site, conforme a [documentação do IndexNow](https://www.indexnow.org/documentation).

Defina `INDEXNOW_KEY` no ambiente. O workflow de publicação e o painel
administrativo podem notificar URLs por IndexNow. A notificação não garante
indexação.

Execução manual:

```bash
node scripts/ping-indexing.js
node scripts/ping-indexing.js --new
node scripts/ping-indexing.js --url /blog/meu-artigo
```

## Métricas do Search Console

A aba Métricas do painel consulta cliques, impressões, CTR e posição por URL.
Para habilitá-la, configure `GOOGLE_SERVICE_ACCOUNT_B64`, habilite a Search
Console API e conceda à conta de serviço acesso de usuário restrito à
propriedade. `SEARCH_CONSOLE_SITE_URL` pode especificar a propriedade exata;
por padrão, usa `sc-domain:passejaconcursos.com.br`.

Os dados podem ter atraso e não representam GA4, acessos diretos ou redes
sociais. O painel compara períodos completos e serve para análise, não como
garantia de indexação.
