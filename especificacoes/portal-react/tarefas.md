# Tarefas — Portal Atlas em React

Ramo: `feat/portal-react`. Um commit ao fim de cada etapa (E1–E8). A regra de
cada tarefa é: teste vermelho, mudança mínima, teste verde e suíte disponível.

| Tarefa | Cenário | Arquivos prováveis | Teste a escrever primeiro | Efeito | Termina quando |
|---|---|---|---|---|---|
| **E1 — Fundação** | | | | | |
| T1.1 | R4, D05 | `package.json`, `package-lock.json` | — (decisão) | versões exatas, publicadas há pelo menos 14 dias e com peers compatíveis | `npm ci` limpo, sem aviso de peer |
| T1.2 | D05 | `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `index.html`, `src/main.tsx` | `npm run typecheck` e `npm run lint` num `App` mínimo | scaffold com TypeScript estrito e regras de hooks e jsx-a11y | os dois comandos com código 0 |
| T1.3 | ADR-010 | `public/content/**` (via `git mv`), `scripts/validate.mjs`, `scripts/check-extract.mjs`, `tests/app/*` (caminhos) | suíte atual (`node --test`) com os novos caminhos | conteúdo servido em `/content/...` pelo Vite | 131 testes verdes, `validate` e `check-extract` ok |
| T1.4 | Q02 | `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/validate.yml`, `.gitignore`, `.env.example` | um teste Vitest trivial e um e2e de fumaça (`/` responde) | três jobs no CI | `npm test` e `npm run e2e` verdes localmente |
| **E2 — Núcleo** | | | | | |
| T2.1 | D03 | `tests/core/{store,merge,queue,backup,content,routes→legacy}.test.ts` | portar os testes de `tests/app` (vermelhos: módulos TS ausentes) | — | testes portados rodam e falham por import |
| T2.2 | D03, D02 | `src/core/{types,store,merge,queue,backup,content}.ts` | os testes de T2.1 | portabilidade fiel, com tipos | verdes; asserções idênticas às originais |
| T2.3 | D03, D04 | `tests/core/{sync,sync-auth}.test.ts`, `tests/core/fake-backend.ts`, `src/core/sync.ts` | 18 cenários de dois aparelhos + autenticação | sincronização em TS com `import()` sob demanda do supabase-js do npm | verdes; contagem de testes ≥ a suíte antiga |
| T2.4 | R03 | `tests/core/legacy.test.ts`, `src/core/legacy.ts` | a tabela de KR2 | tradução de endereços antigos | verde |
| **E3 — Portal e rotas** | | | | | |
| T3.1 | U01 | `tests/ui/tokens.test.ts`, `src/ui/tokens.ts`, `src/ui/theme.css` | razões WCAG dos pares de cor e das tradições | tokens dos temas claro e escuro | verde ou desvio documentado do R5 |
| T3.2 | R05, R06 | `tests/ui/{portal,secao-nova}.test.tsx`, `src/sections/registry.ts`, `src/app/{App,router,Layout}.tsx`, `tests/fixtures/secao-teste/` | portal com seção planejada e seção de teste | registro KS1 e shell | verdes, sem stub de shell, armazenamento ou sincronização |
| T3.3 | R01, R02, R03 | `tests/ui/routes.test.tsx`, `src/main.tsx`, `src/sections/atlas/routes.tsx` | tabela KR1 e redirecionamentos | rotas limpas e redirecionamento antes do roteador | verde |
| T3.4 | U02, U03 | `src/ui/{Button,Sheet,Drawer,Toast,Card,Tag,Progress,SegmentedControl}.tsx` | axe e teclado em cada componente | design system base | verdes |
| **E4 — Atlas** | | | | | |
| T4.1 | P01, P02, R07 | `tests/ui/atlas/{mapa,capa,area-nova}.test.tsx`, `src/sections/atlas/pages/{Mapa,Capa}.tsx`, `src/app/hooks/useStore.ts` | mapa, continuar e capa com `{temas}` | — | verdes |
| T4.2 | P03, P04, P05 | `tests/ui/atlas/menu.test.tsx`, `src/sections/atlas/components/{Menu,Busca,ProgressoArea}.tsx` | seletor, contagens, busca e busca em todas | — | verdes |
| T4.3 | P06, P07, P09, P10 | `tests/ui/atlas/{tema,oficina}.test.tsx`, `src/sections/atlas/pages/{Tema,Oficina}.tsx`, `components/{Marcas,Tutor,Pager}.tsx` | seções do JSON, marcações, prompt e navegação | — | verdes; m8e3 renderiza por inteiro |
| T4.4 | P08 | `tests/ui/atlas/anotacoes.test.tsx`, `components/Anotacoes.tsx` | atualização remota durante a digitação | foco e texto preservados; aplicação ao perder o foco | verde |
| **E5 — Conta e utilidades** | | | | | |
| T5.1 | A01–A05, P15 | `tests/ui/conta.test.tsx`, `src/app/hooks/useSync.ts`, `src/app/{IndicadorSync,PainelConta}.tsx` | fluxos com cliente falso | — | verdes |
| T5.2 | P11, P12, P14, P16 | `tests/ui/{ajustes,backup}.test.tsx`, `src/app/{Ajustes,Backup}.tsx` | — | — | verdes |
| T5.3 | P13 | `tests/ui/atlas/pdf.test.tsx`, `src/sections/atlas/print/RoteiroImpresso.tsx` | conteúdo imprimível e chamada de `window.print` | — | verde |
| T5.4 | D01 | `tests/ui/upgrade.test.tsx`, `tests/fixtures/estado-v3-real.json` | estado gerado pelo app atual | — | verde |
| **E6 — Offline e deploy** | | | | | |
| T6.1 | O04 | `tests/core/sw-rules.test.ts`, `src/sw.ts`, `vite.config.ts` (PWA) | regras de rota do SW | SW com KW1 | verde |
| T6.2 | R04, R08, R03 | `e2e/routes.spec.ts`, `vercel.json` | recarga, voltar e avançar, links antigos | — | verde em `vite preview` |
| T6.3 | O01–O03 | `e2e/offline.spec.ts`, `e2e/fixtures/sw-antigo/` | offline e substituição do SW antigo | — | verde |
| **E7 — Acabamento** | | | | | |
| T7.1 | U04 | `e2e/layout.spec.ts` | 320 px e tamanho GG | — | verde |
| T7.2 | Q01, Q03 | `scripts/size-budget.mjs`, `scripts/check-secrets.mjs` | fixtures que estouram ou vazam | — | verdes; build atual dentro do limite |
| T7.3 | RN12 | `src/**/*.module.css` | revisão visual no navegador, claro e escuro | redesenho final | capturas aprovadas pelo autor |
| **E8 — Documentação e limpeza** | | | | | |
| T8.1 | Q04 | `tests/docs.test.ts`, `README.md`, `docs/{arquitetura,sincronizacao,conteudo,deploy}.md`, `docs/adr/0001…0011-*.md`, `docs/img/*.png` | seções exigidas, ADRs completos, comandos existentes | documentação de portfólio | verde |
| T8.2 | — | remover `assets/`, `sw.js`, `scripts/serve.mjs`, `tests/app/` | suíte completa | base antiga removida | tudo verde num clone limpo |
| T8.3 | — | `docs/subir-atlas.html` (local) | — | guia local atualizado | — |

## Registro de execução

(preenchido durante `$implementar`)

## Extensão 2026-11-05

| Tarefa | Cenário | Arquivos prováveis | Teste a escrever primeiro | Efeito | Termina quando |
|---|---|---|---|---|---|
| T5.1b | A06–A08 | `tests/ui/conta.test.tsx`, `src/app/pages/Entrar.tsx`, `src/app/IndicadorSync.tsx` | visitante não vê login; `/entrar` autentica e grava a marca | login discreto | verde |
| T8.1b | Q05 | `LICENSE`, `README.md`, `tests/docs.test.ts` | presença da licença MIT e do link da demo | — | verde |
