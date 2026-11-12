# Tarefas: renomeação para Letrume

| # | Cenários | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| R1 | S10 (preparação) | `especificacoes/renomeacao-letrume/prototipo/icone-*.svg` | — | 2–3 SVGs nas cores atuais | autor escolhe um |
| R2.1 | S01, S03 | `tests/ui/portal.test.tsx`, `src/app/Layout.tsx`, `src/app/pages/Portal.tsx`, `index.html` | marca e `h1` "Letrume"; cartão "Atlas de estudos" segue | trocar textos | verde |
| R2.2 | S02 | `tests/ui/conta.test.tsx`, `src/app/conta.tsx` | "acessar o Letrume" | trocar textos | verde |
| R2.3 | S04 | `tests/scripts/deploy.test.ts`, `vite.config.ts` | `name`/`short_name` "Letrume", `id` "/" | manifesto | verde após `npm run build` |
| R2.4 | S05, S06 | `tests/core/backup.test.ts`, `src/core/backup.ts` | `app` "Letrume"; importa "Atlas de Estudos" | constante | verde |
| R2.5 | S07 | `tests/scripts/conteudo-privado.test.ts`, `private/content/areas.json` | `tituloPdf` começa com "Letrume ·" | dados | verde + `npm run validate` |
| R3 | S08 | `tests/core/store.test.ts`, `tests/core/queue.test.ts` | chaves `atlas-v3` e da fila fixadas por teste | nenhuma (guarda contra regressão) | verde |
| R4 | S11–S14 | `tests/core/sync.test.ts`, `src/core/sync.ts` ou `src/core/origem.ts`, `src/app/services.ts`, `.env.example` | quatro cenários com fake backend e janela falsa | `canonicalRedirect` após `whenIdle` | verde |
| R5 | S10 | `public/icon.svg`, `public/icons/*`, `scripts/icons.mjs` | SVG ≠ globo | SVG aprovado + `npm run icons` | verde |
| R6 | — | `README.md`, `docs/arquitetura.md`, `docs/deploy.md`, `docs/adr/0013-dominio-canonico.md`, `docs/adr/README.md` | `tests/docs.test.ts` (se cobrir a lista de ADRs) | textos e ADR | verde |
| R7 | todos | — | — | `typecheck`, `lint`, `test`, `validate`, `build`, `size`, `secrets`, `privacy`, `e2e` | todos verdes |
| R8 | S15 | painel registro.br, Vercel, Supabase | — | feito pelo autor, com confirmação | checklist de `docs/deploy.md` cumprido |
