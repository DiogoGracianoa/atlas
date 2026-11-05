# Plano — Portal Atlas em React

Base: `visao.md` e `especificacao.md`. Repositório único (sem `projects/`, sem
`.sdd/`). Contexto lido: `assets/`, `sw.js`, `index.html`, `vercel.json`, CI,
testes e as especificações de `atlas-sincronizado-multiarea`.

## Decisões arquiteturais

Cada decisão vira um ADR em `docs/adr/` na etapa de documentação.

| # | Decisão | Alternativas | Escolha e motivo | Consequência | Gatilho de revisão |
|---|---|---|---|---|---|
| ADR-001 | Base da interface | JS sem framework dividido em módulos; Preact + htm por CDN; Next.js | **React + TypeScript + Vite**, site estático. O pedido do autor é crescer o portal e usá-lo no portfólio; SSR e funções não são necessários. | Passa a existir build e `node_modules`; Vercel com preset Vite. | Se uma seção precisar de SEO por página ou conteúdo gerado no servidor. |
| ADR-002 | Roteamento | Hash router; roteador próprio | **React Router, modo data (`createBrowserRouter`)**, com rotas limpas. As rotas de cada seção são declaradas pela própria seção e montadas a partir do registro. | Precisa de reescrita para `index.html` na Vercel e de fallback de navegação no SW. | Troca da hospedagem para uma que não suporte reescrita. |
| ADR-003 | Registro de seções | Rotas fixas no `App` | **`src/sections/registry.ts`** lista as seções (metadados, status, rotas e cartão). O shell só itera o registro. | Seção nova = pasta própria + uma entrada (RN08). | Se as seções precisarem compartilhar estado além do armazenamento comum. |
| ADR-004 | Estado na interface | Redux; Zustand; Context com reducer | **Núcleo próprio (store em TS) exposto por `useSyncExternalStore`**. O núcleo já existe, é testado e é independente de framework; não há estado de servidor que justifique uma biblioteca. | Componentes assinam fatias do store; a sincronização continua fora do React. | Se o estado da interface crescer além do que o store modela, como formulários complexos dos dossiês. |
| ADR-005 | Configuração do Supabase | `config.js` versionado (como hoje) | **Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`** (Vercel e `.env.local`; `.env.example` versionado). Vazias = modo só local. | O repositório público não fixa um projeto; o deploy configura. A chave pública vai no bundle, como já ia. | — |
| ADR-006 | Cliente Supabase | CDN jsDelivr com versão fixa (decisão anterior) | **Pacote npm com versão exata** (`@supabase/supabase-js@2.118.0`, a mesma de hoje), importado sob demanda (`import()`) para não pesar a primeira tela. A regra anterior "versão fixa, nunca latest" passa a valer para o `package-lock.json`. | O SW não precisa mais de regra para o jsDelivr. | Atualização de versão só com a suíte de sincronização verde. |
| ADR-007 | Offline | SW escrito à mão (como hoje) | **`vite-plugin-pwa` com estratégia `injectManifest`** e SW próprio em `src/sw.ts` (Workbox): precache dos arquivos versionados do build, fallback de navegação para `index.html`, rede primeiro com cache para `content/` (só o que foi aberto), Supabase nunca em cache. Mesmo caminho `/sw.js`, para substituir o antigo, e limpeza do cache `atlas-v1`. | Os nomes com hash dos arquivos ficam invisíveis para quem escreve o SW. | — |
| ADR-008 | Estilos e tema | Tailwind; CSS-in-JS | **CSS Modules + tokens em CSS custom properties**, gerados a partir de `src/ui/tokens.ts`, o que permite testar o contraste (U01). Fontes auto-hospedadas via `@fontsource` (offline e sem requisição a terceiros). | Sem dependência de runtime de estilos. | — |
| ADR-009 | Testes | `node --test` (atual) | **Vitest** (núcleo e componentes, com jsdom e Testing Library), **Playwright** só com Chromium (rotas, recarga, offline, 320 px) e **axe-core** nos componentes. Os 131 testes atuais são portados com as mesmas asserções. | CI com três jobs; download do Chromium no job `e2e`. | Se o e2e ficar instável: isolar, nunca apagar. |
| ADR-010 | Local do conteúdo | `content/` na raiz | **`public/content/`**, servido como arquivo estático e buscado sob demanda; formato inalterado. | Caminhos de `validate.mjs`, `check-extract.mjs` e da documentação mudam. | — |
| ADR-011 | Versões de dependências | Faixas (`^`) | **Versões exatas** no `package.json`, escolhidas entre as publicadas há pelo menos 14 dias e com peers compatíveis (verificado na T1.1). `npm ci` no CI. | Atualização é decisão explícita. | Alerta de segurança em dependência. |

## Direção visual (RN12)

Liberdade para redesenhar, com estes princípios:

- **Leitura primeiro:** coluna de texto com cerca de 68 caracteres; serifa para
  o texto longo e sem serifa para a interface.
- **Cor de tradição como identidade de cada tema:** faixa e acentos, nunca texto
  pequeno abaixo de AA.
- **Portal sóbrio:** a página inicial apresenta o projeto e as seções em
  cartões.
- **Celular primeiro:**
  - menu em gaveta no celular e lateral fixa a partir de 1024 px;
  - painéis (conta e ajustes) como folhas inferiores no celular e diálogos no
    PC.
- **Componentes de `src/ui`:**
  - `Button`, `IconButton`, `Sheet` (diálogo acessível com foco preso e Esc),
    `Drawer`, `Toast`, `Progress`, `Card`, `Tag`, `SegmentedControl`;
  - todos com estado de foco visível e testados com axe.

## Estrutura

```
index.html                 entrada do Vite
public/content/...         manifesto e currículos (movidos de content/)
public/icons/, manifest     ícones e manifesto PWA
src/
  main.tsx                 redireciona links antigos (antes do roteador) e monta o app
  config.ts                lê import.meta.env (ADR-005)
  core/                    TS portado de assets/lib e assets/sync.js
    types.ts store.ts merge.ts queue.ts backup.ts content.ts legacy.ts sync.ts
  app/                     shell: App, router, layout, providers, hooks (useStore, useSync)
  sections/
    registry.ts            seções do portal (ADR-003)
    atlas/                 rotas, páginas, componentes e impressão do atlas
  ui/                      design system e tokens
  sw.ts                    service worker (ADR-007)
tests/
  core/  ui/  docs.test.ts fixtures/   Vitest
  db/                      inalterado
e2e/                       Playwright
scripts/  validate.mjs check-extract.mjs keepalive.sh size-budget.mjs check-secrets.mjs
docs/  arquitetura.md sincronizacao.md conteudo.md deploy.md adr/  guia-de-artefatos.md (já existe)
```

Saem ao fim da migração: `assets/`, `sw.js` da raiz (substituído pelo gerado),
`scripts/serve.mjs` (substituído por `vite preview`) e `tests/app/` (portado).

## Módulos, responsabilidades e contratos

| Módulo | Responsabilidade | Contrato |
|---|---|---|
| `src/core/*` | domínio, armazenamento local e sincronização; não importa React | K4, K5 e K3 (especificação anterior), inalterados |
| `src/core/legacy.ts` | traduzir endereço antigo para rota nova | KR2 |
| `src/sections/registry.ts` | lista de seções | KS1 |
| `src/sections/atlas` | rotas `/atlas/*` e páginas | KR1, K1 e K2 (conteúdo) |
| `src/app` | shell, roteador montado a partir do registro, providers, avisos | KS1, KR1 |
| `src/sw.ts` | cache e offline | KW1 |
| `src/config.ts` | configuração pública | KC1 |

## Ordem de execução

Etapas com commit ao fim de cada uma, no ramo `feat/portal-react`; `main` só
recebe a migração completa.

1. **E1 Fundação:**
   - Vite, React, TypeScript estrito, ESLint, Vitest, Playwright;
   - `public/content`, scripts adaptados;
   - CI com os três jobs.
2. **E2 Núcleo:** portar `assets/lib` e `assets/sync.js` para `src/core` com os
   131 testes portados (D03–D05). Esta etapa é o menor experimento da hipótese.
3. **E3 Portal e rotas:** shell, registro de seções, roteador, redirecionamento
   de links antigos, página inicial, componentes base de `src/ui` e tokens
   (R01–R03, R05–R07, U01).
4. **E4 Atlas:** mapa, capa, menu, busca, progresso, tema, oficina, tutor,
   anotações e navegação (P01–P10).
5. **E5 Conta e utilidades:** sincronização na interface, painel de conta,
   ajustes, backup, Zerar e PDF (P11–P16, A01–A05, D01).
6. **E6 Offline e deploy:** SW, PWA, `vercel.json`, e2e de rotas, recarga e
   offline (R04, R08, O01–O04).
7. **E7 Acabamento:** revisão visual, axe, teclado, 320 px, limite de tamanho e
   segredos (U02–U04, Q01, Q03).
8. **E8 Documentação:**
   - README em inglês;
   - `docs/` em português e ADRs;
   - capturas de tela;
   - remoção da base antiga;
   - guia local de deploy atualizado (Q04).
9. **E9 Revisão:** `$revisar`, CI verde no ramo; merge em `main` após
   aprovação.

## Validação disponível

| Comando | Cobre | Disponível hoje? |
|---|---|---|
| `npm ci && npm run typecheck && npm run lint` | D05, Q02 | depois da E1 |
| `npm test` | D01–D04, R01–R03, R05–R07, P*, A*, U01–U03, Q04 | depois da E1 |
| `npm run build && npm run size && npm run secrets` | Q01, Q03 | depois da E1 |
| `npm run e2e` | R03, R04, R08, O01–O03, U04 | depois da E1 (precisa do Chromium do Playwright) |
| `npm run validate` | conteúdo (RN09) | sim, hoje como `node scripts/validate.mjs` |
| `bash tests/db/run.sh` | banco inalterado | sim (Docker) |
| GitHub Actions | Q02 | depois do push do ramo |

## Riscos

| ID | Risco | Mitigação |
|---|---|---|
| R1 | Regressão na sincronização durante a portabilidade | A E2 vem antes de qualquer tela; asserções portadas sem alteração; TypeScript estrito. |
| R2 | Comportamento de rolagem e foco diferente do atual ao trocar de rota | Cenário R08 e foco movido para o título da página na navegação. |
| R3 | SW antigo preso nos aparelhos servindo a versão velha | Mesmo caminho `/sw.js`, `skipWaiting` e `clientsClaim`, limpeza de `atlas-v1` e cenário O03. |
| R4 | Versões muito novas das dependências (React Router 8, Vite 8, TypeScript 7) sem compatibilidade de peers, por exemplo `typescript-eslint` com TypeScript 7 | ADR-011: escolher na T1.1 a combinação estável mais recente com peers compatíveis e registrar em `docs/arquitetura.md`. |
| R5 | Cores de tradição do manifesto abaixo de AA para texto pequeno | U01 aponta; uso restrito a faixa e texto grande, sem mudar o manifesto. |
| R6 | Retorno do link mágico em rotas limpas não autorizado no Supabase | `docs/deploy.md` passa a pedir o padrão `https://SEU-SITE/**` nas Redirect URLs; o passo manual fica com o autor. |
