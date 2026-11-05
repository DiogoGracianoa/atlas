# Impacto — Portal Atlas em React

## Muda no repositório

| Área | Mudança |
|---|---|
| `index.html` | vira a entrada do Vite (`<div id="root">`); a marcação atual sai |
| `assets/` | substituído por `src/`; removido na E8 |
| `sw.js` (raiz) | substituído pelo SW gerado a partir de `src/sw.ts`, publicado no mesmo caminho `/sw.js` |
| `content/` | movido para `public/content/`, sem mudar o formato |
| `scripts/` | `validate.mjs` e `check-extract.mjs` com novos caminhos; entram `size-budget.mjs` e `check-secrets.mjs`; sai `serve.mjs` |
| `tests/app/` | portado para `tests/core` e `tests/ui` (Vitest); removido na E8 |
| `e2e/` | novo (Playwright) |
| `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `playwright.config.ts`, `.env.example` | novos |
| `.gitignore` | `dist/`, `.env.local`, `playwright-report/`, `test-results/` |
| `.github/workflows/validate.yml` | jobs `qualidade`, `e2e` e `banco` |
| `vercel.json` | preset Vite, reescrita de SPA, cabeçalhos de cache para `/assets/*` (com hash) e `/content/*` |
| `.vercelignore` | revisto: o build precisa de `src/`, `public/` e dos arquivos de configuração |
| `README.md` | reescrito em inglês, como apresentação de portfólio |
| `docs/` | `arquitetura.md`, `sincronizacao.md`, `conteudo.md`, `deploy.md` e `adr/` (novos); `guia-de-artefatos.md` não muda |
| `docs/subir-atlas.html` | guia local, fora do git: atualizado para o preset Vite e as variáveis de ambiente |

## Só valida (não muda)

- `supabase/migrations/0001_init.sql` e `tests/db/`: o banco não muda (RN03).
- `scripts/keepalive.sh` e `.github/workflows/keepalive.yml`.
- O formato de `areas.json` e de `curriculum.json` (K1 e K2).

## Muda fora do repositório (passo manual do autor, documentado em `docs/deploy.md`)

| Sistema | Mudança | Quando |
|---|---|---|
| Vercel | preset **Vite** (build `npm run build`, saída `dist`) e variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` | antes do primeiro deploy do ramo ou de `main` |
| Supabase | em Redirect URLs, trocar o endereço exato pelo padrão `https://SEU-SITE/**`, porque o link volta para rotas como `/atlas/politica/m2e1` | antes de testar o login pelo link |

## Dados de quem já usa

- **`localStorage`:** as chaves `atlas-v3`, `atlas-v3-queue` e
  `atlas-estudos-v2` são lidas sem conversão (D01 e D02).
- **Service worker:** o antigo é substituído no mesmo caminho e o cache
  `atlas-v1` é apagado (O03).
- **Linhas no Supabase:** não mudam.
