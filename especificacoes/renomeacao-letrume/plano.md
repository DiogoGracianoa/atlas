# Plano: renomeação para Letrume

## Decisões

| # | Decisão | Alternativas | Escolha | Consequência | Gatilho de revisão |
|---|---|---|---|---|---|
| D1 | Chaves locais (`atlas-v3`, fila, cache) | renomear para `letrume-*` com migração | **manter** | nenhum risco de perda; o nome interno não é visível | nova versão do estado local (v4) |
| D2 | Campo `app` do backup | versão 4 do formato | `app: "Letrume"`, **mesma versão 3**; importação ignora o valor de `app` | backups antigos e novos são intercambiáveis | mudança real de estrutura do backup |
| D3 | Endereço antigo | redirecionamento 301 no domínio da Vercel; dois endereços em paralelo | **redirecionamento no app, depois de esvaziar a fila** (`VITE_ORIGEM_CANONICA`). Os dois domínios servem o mesmo deploy | nada pendente se perde; o 301 de servidor descartaria a fila presa à origem antiga | quando nenhum aparelho usar o endereço antigo, trocar por 301 na Vercel |
| D4 | Ícone | contratar/fornecer; manter o globo | SVG criado aqui nas cores atuais (`#2F4A63`, `#F7F4EE`), **aprovado pelo autor antes do commit**; PNGs gerados por `npm run icons` | identidade nova sem mudar a paleta | — |
| D5 | Seção | renomear rotas | rotas `/atlas/...` e "Atlas de estudos" ficam | links e progresso intactos | — |

D3 vira o ADR-0013 (domínio canônico e redirecionamento após envio).

## Módulos e responsabilidades

| Módulo | Mudança |
|---|---|
| `index.html` | `<title>Letrume</title>` |
| `vite.config.ts` | `manifest.name`/`short_name` "Letrume"; `id` explícito igual ao atual (`/`) para o app instalado ser o mesmo |
| `src/app/Layout.tsx`, `src/app/pages/Portal.tsx` | marca e `h1` |
| `src/app/conta.tsx` | textos de entrada |
| `src/core/backup.ts` | `app: "Letrume"` |
| `private/content/areas.json` | `tituloPdf` com "Letrume ·" |
| `src/core/sync.ts` (ou `src/core/origem.ts` novo, injetado) | `canonicalRedirect`: depois de `whenIdle()` com fila vazia, online e origem ≠ canônica, `location.replace` |
| `src/app/services.ts` | lê `import.meta.env.VITE_ORIGEM_CANONICA` e injeta |
| `.env.example`, `docs/deploy.md` | variável nova; passo a passo do domínio (registro.br → Vercel), *Site URL*/*Redirect URLs* e modelos de e-mail no Supabase; **não** configurar redirecionamento de domínio na Vercel enquanto D3 valer |
| `public/icon.svg`, `public/icons/*` | ícone novo |
| `README.md`, `docs/arquitetura.md`, `docs/adr/0013-*.md` | nome e decisão |

## Ordem

1. **R1 — Ícone (protótipo):** desenhar 2–3 propostas de SVG; o autor escolhe.
   Nada é commitado antes da escolha.
2. **R2 — Nome visível:** testes S01–S07 vermelhos → troca de textos → verdes.
3. **R3 — Continuidade:** S08 (prova de que as chaves não mudam).
4. **R4 — Redirecionamento:** S11–S14 vermelhos → `canonicalRedirect` → verdes.
5. **R5 — Ícone aprovado:** S10; `npm run icons`.
6. **R6 — Documentação e ADR-0013.**
7. **R7 — Suíte completa** e build.
8. **R8 — Deploy (autor, com confirmação):** DNS, domínio na Vercel, variável
   `VITE_ORIGEM_CANONICA=https://letrume.com.br`, Supabase; depois S15 manual.

## Validação disponível

`npm run typecheck`, `npm run lint`, `npm test`, `npm run validate`,
`npm run build`, `npm run size`, `npm run secrets`, `npm run privacy`,
`npm run e2e`. A verificação S15 é manual e depende do R8.

## Riscos

| Risco | Mitigação |
|---|---|
| Fila presa na origem antiga | D3 + S11/S14 |
| Laço de redirecionamento | S13: só redireciona com origem diferente e variável preenchida |
| Login pedido de novo no domínio novo (sessão é por origem) | esperado; documentado em `docs/deploy.md` e na visão |
| App instalado duplicado | a visão já avisa: reinstalar a partir do domínio novo |
| E-mails com link para o endereço antigo | trocar *Site URL* no Supabase no R8, antes de ativar o redirecionamento |
