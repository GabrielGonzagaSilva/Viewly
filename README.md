# Viewly

Visualizador de conteúdo público de Instagram, X e TikTok com frontend próprio e backend em Cloudflare Workers.

## Arquitetura

- `public/`: frontend responsivo.
- `src/index.js`: Worker com `/api/resolve` e `/api/health`.
- ScrapeCreators é acessado somente no backend.
- A chave `SCRAPECREATORS_API_KEY` nunca deve ir para Git.

## Desenvolvimento local

```bash
npm install
cp .env.example .dev.vars
# edite .dev.vars e coloque sua chave
npm run dev
```

## Deploy Cloudflare

O repositório inclui workflow de deploy para Cloudflare Workers. Configure estes GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SCRAPECREATORS_API_KEY`

Depois, qualquer push em `main` executa o deploy.

Também é possível publicar manualmente:

```bash
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put SCRAPECREATORS_API_KEY
npx wrangler deploy
```

## Entradas aceitas

- `@usuario`
- URL de perfil
- URL de post/reel do Instagram
- URL de post do X
- URL de vídeo do TikTok

Quando uma URL é fornecida, a rede é identificada automaticamente.

## Segurança

- Nenhuma chave é exposta no frontend.
- O Worker adiciona headers básicos de segurança.
- Apenas conteúdo público é consultado.
- O frontend renderiza o resultado dentro do Viewly, sem embeds navegáveis.
