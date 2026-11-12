# Execução: renomeação para Letrume

Data: 2026-11-11 · Ramo: `feat/letrume-e-preparatorio-contagem`.

## Cenários

| Cenário | Teste | RED | GREEN |
|---|---|---|---|
| S01, S03 | `tests/ui/portal.test.tsx`; `e2e/smoke.spec.ts`, `e2e/routes.spec.ts` | `h1` "Atlas" | "Letrume"; cartão "Atlas de estudos" mantido |
| S02 | `tests/ui/conta.test.tsx` | título "Entrar · Atlas" | "Entrar · Letrume" |
| S04 | `tests/scripts/deploy.test.ts` | manifesto "Atlas" | `name`/`short_name` "Letrume", `id` "/" (conferido em `dist/manifest.webmanifest`) |
| S05 | `tests/core/backup.test.ts` | `app` "Atlas de Estudos" | "Letrume" |
| S06 | `tests/core/backup.test.ts` | passou de primeira (guarda: a importação já ignorava `app`) | — |
| S07 | `tests/scripts/conteudo-privado.test.ts` | `tituloPdf` "Atlas de Estudos ·" | "Letrume ·" |
| S08 | `tests/core/store.test.ts` | passou de primeira (guarda contra regressão) | — |
| S09 | e2e de rotas e links antigos | — | 76/76 e2e verdes |
| S10 | `tests/scripts/deploy.test.ts` | globo | ícone C (chama) escolhido pelo autor em 2026-11-11; PNGs por `node scripts/icons.mjs`; logo do cabeçalho redesenhado |
| S11–S14 | `tests/core/origem.test.ts` (7 testes) | 4 falhas com módulo vazio | `createCanonicalRedirect` ligado em `src/main.tsx` |
| S15 | manual (`docs/deploy.md`, seção 2.1) | — | **pendente**: depende do DNS, da Vercel e do Supabase |

Também mudaram textos que nomeiam o produto: títulos das páginas do atlas
("Mapa do Atlas · Letrume"), aviso de backup inválido, README, `docs/arquitetura.md`,
`docs/conteudo.md`, `docs/deploy.md` (domínio, variável, e-mails) e ADR-0013.

## Validação executada

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ok |
| `npm run lint` | ok |
| `npx vitest run` | 434 testes, 34 arquivos, todos verdes |
| `npm run validate` | ok |
| `npm run build` | ok |
| `npm run size` | 125,7 KB gzip (limite 150) |
| `npm run secrets` | nenhum segredo |
| `npm run privacy` | materiais fora da distribuição |
| `npx playwright test` | 76/76 |
| `bash tests/db/run.sh` | não executado: o schema não mudou neste corte |

## Pendências

- R8 (autor): DNS no registro.br, domínio e `VITE_ORIGEM_CANONICA` na Vercel,
  *Site URL*/*Redirect URLs* e modelos de e-mail no Supabase; depois o roteiro S15.
- P4 (não bloqueante): renomear repositório, projeto na Vercel e `package.json`
  só com confirmação.
