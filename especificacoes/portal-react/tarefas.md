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

### E1 — Fundação (2026-11-05)

- **T1.3:** primeiro os testes e os helpers apontaram para `public/content`
  (22 falharam pelo motivo esperado). Depois `git mv content public/content` e
  `validate.mjs` e `check-extract.mjs` passaram a ler de `public/`. A
  isolação de `exemplos/` agora cobre `src`, `public` e `vite.config.ts`.
  Resultado: 131/131 verdes, `validate` ok e `check-extract` com os módulos
  originais idênticos.
- **T1.1 (R4, ADR-011):** versões exatas, todas publicadas antes de 2026-10-22.
  A escolha foi decidida pelos peers:
  - TypeScript **6.0.3**, não 7.0.2, porque o `typescript-eslint` 8.72 exige
    `<6.1`.
  - ESLint **10.13.0** com `eslint-plugin-jsx-a11y-x` 0.2.0 (fork mantido,
    peer `^9 || ^10`), porque o `eslint-plugin-jsx-a11y` 6.10.2 só aceita
    ESLint até 9, e o ESLint 9 está fora de suporte.
  - Demais versões:
    - React 19.3.1;
    - Vite 8.3.5 com `@vitejs/plugin-react` 6.1.2;
    - Vitest 5.0.5;
    - jsdom 30.1.3 (exige Node ≥ 22.22.2, declarado em `engines`);
    - Playwright 1.64.1;
    - Testing Library 16.3.3, 10.4.2 e 14.6.8.
- **Limitação encontrada:** `npm install` do npm 10.9 (que vem com o Node
  22.23) quebra ao resolver peers opcionais (`Cannot read properties of null
  (reading 'edgesOut')`). O lockfile foi gerado com o npm 11.6.2 (`npx`).
  `npm ci` com o npm 10 instala o lockfile sem erro (verificado), então o CI não
  muda. Atualizar dependências exige `npx npm@11 install` até o npm 10 corrigir.
- **T1.2:**
  - TypeScript estrito com `noUncheckedIndexedAccess` e `verbatimModuleSyntax`;
  - ESLint com `typescript-eslint` strict, react-hooks e jsx-a11y;
  - `any` explícito proibido em `src/core`;
  - a base antiga (`assets/`, `sw.js`, `scripts/serve.mjs`, `tests/app`)
    fica fora do lint até sair, na E8.
- **T1.4:**
  - Vitest com dois projetos: `core` (Node) e `ui` (jsdom);
  - o teste de fumaça falhou com o `App` vazio e passou com o shell;
  - Playwright contra `vite preview`: 2 de 2 verdes (raiz e `/content/areas.json`);
  - CI com os jobs `qualidade` (tipos, lint, conteúdo, testes antigos, Vitest e
    build), `e2e` e `banco`.
- **Comandos executados:**
  - `npm run typecheck`, `npm run lint` e `npm run validate`: ok;
  - `npm run test:legacy`: 131/131;
  - `npm test`: 1/1;
  - `npm run e2e`: 2/2;
  - `npm run build`: JS de 68,7 KB gzip, só React.
- **Não executado:** `tests/db/run.sh`, porque o banco não mudou; roda no CI.
- **Efeito colateral esperado:** o `index.html` virou a entrada do Vite e o app
  antigo deixa de abrir neste ramo até a E4 e a E5. Os arquivos dele continuam
  em `assets/` como referência até a E8.

## Extensão 2026-11-05

| Tarefa | Cenário | Arquivos prováveis | Teste a escrever primeiro | Efeito | Termina quando |
|---|---|---|---|---|---|
| T5.1b | A06–A08 | `tests/ui/conta.test.tsx`, `src/app/pages/Entrar.tsx`, `src/app/IndicadorSync.tsx` | visitante não vê login; `/entrar` autentica e grava a marca | login discreto | verde |
| T8.1b | Q05 | `LICENSE`, `README.md`, `tests/docs.test.ts` | presença da licença MIT e do link da demo | — | verde |

### E2 — Núcleo (2026-11-05)

- **T2.2/T2.3:** `src/core/{types,store,merge,queue,backup,content,sync}.ts`
  portados de `assets/lib/*.js` e `assets/sync.js`, mantendo o comportamento.
  Diferenças intencionais:
  - `createSync` não recebe mais `moduleUrl`. O carregador padrão
    (`defaultLoader`) faz `import("@supabase/supabase-js")` do pacote npm
    2.118.0 (ADR-006), num chunk separado. O cast para a fronteira mínima
    `SupabaseLike` fica só nesse ponto.
  - `indexArea` cria os nós com spread, em vez de mutar os objetos do currículo.
  - A fila usa `Map` internamente e serializa no mesmo formato de objeto do K4.
  - Os tipos de linha remota em `RemoteData` aceitam `area`, que vem do servidor.
- **T2.1:** testes portados para `tests/core/*.test.ts` com as asserções
  originais (`node:assert/strict`) e as mesmas contagens de `assert.*` por
  arquivo:

  | Arquivo | Asserções |
  |---|---|
  | store | 39 |
  | merge | 26 |
  | queue | 16 |
  | backup | 18 |
  | content | 32 |
  | sync | 57 |
  | sync-auth | 41 |

  A tipagem estrita dos testes foi feita por um subagente e conferida aqui:
  contagens iguais, `tsc` limpo e 94/94 verdes. É uma portabilidade de testes
  de caracterização: o vermelho não se aplica, porque os testes já existiam e
  passavam na base antiga. O vermelho vale para o comportamento novo (T2.4).
- **T2.4:** `tests/core/legacy.test.ts` (15 casos da tabela KR2) falhou contra
  o stub e passou com `src/core/legacy.ts`. `routes.test.mjs` (parseRoute e
  hrefFor do roteador por hash) não foi portado: o roteador por hash deixa de
  existir e foi substituído por KR1 (E3/E4) e KR2.
- **Comandos executados:**
  - `npx vitest run --project core`: 94/94;
  - `npx tsc --noEmit`: limpo em `src/core` e `tests/core`;
  - `npx eslint src/core tests/core`: limpo.
- **Dependências** instaladas nesta etapa (todas publicadas antes de
  2026-10-22):
  - `@supabase/supabase-js` 2.118.0 (de 15/10);
  - para a E3: `react-router` 8.5.0, `@fontsource-variable/literata` e
    `@fontsource-variable/inter` 5.3.0, e `axe-core` 4.14.0.

### E3 — Portal e rotas (2026-11-05)

- **T3.1 (U01):** `src/ui/tokens.ts` (paletas clara e escura) e `theme.ts`
  (gera as custom properties nos modos claro, escuro automático e escuro
  forçado). `tests/ui/tokens.test.ts` verifica 42 itens: 16 pares de texto ≥ 4,5
  e 4 de interface ≥ 3 por tema, mais as cores de tradição. As 8 tradições do
  manifesto passam AA nos dois temas, então o risco R5 não se materializou.
- **T3.2 (R05, R06):**
  - `src/sections/{types,registry}.ts` (KS1) e `src/app/routes.tsx`, que monta
    as rotas iterando o registro;
  - seção de teste em `tests/fixtures/secao-teste`, usada só via registro e com
    o shell, o armazenamento e a sincronização reais.
- **T3.3 (R02, R03):**
  - `*` redireciona para `/` com o aviso "Página não encontrada.";
  - `main.tsx` aplica `legacyToPath` com `replaceState` antes de montar o
    roteador. O teste de ponta a ponta fica na E6.
- **T3.4 (U02, U03):** `src/ui/primitives.tsx`, `Sheet.tsx` (foco preso,
  `Esc`, devolve o foco) e `Toast.tsx` (`role=status`), com axe-core sem
  violações sérias.
- **Decisões técnicas:**
  - Fontes: só os subconjuntos latino e latino estendido (`src/ui/fonts.css`,
    extraído do fontsource). Os demais incharia o cache offline.
  - Estado na interface: um contador de versão por serviço, assinado com
    `useSyncExternalStore`. O store muta no lugar; o contador força o redesenho
    (ADR-004).
  - Testes de UI: `tests/ui/setup.ts` faz o `cleanup` (o Vitest roda sem
    globais) e `tests/ui/harness.tsx` monta o app real com roteador em memória.
- **Comandos executados:**
  - `npx vitest run --project ui`: 52/52;
  - `npx vitest run --project core`: 94/94;
  - `tsc` e `eslint .`: limpos;
  - `npm run build`: JS inicial de 108,7 KB gzip, com o supabase-js em chunk
    separado de 56,7 KB;
  - `npx playwright test`: 2/2;
  - portal conferido no navegador (tema escuro).

### E4 — Atlas (2026-11-05)

- **Moldura** (`AtlasLayout.tsx`):
  - resolve a área da rota contra o manifesto: desconhecida vai para `/atlas`
    com "Área não encontrada."; planejada, com "Esta área ainda não está
    disponível."; erro de carga, com "Esta área precisa de conexão na primeira
    abertura.";
  - injeta as cores de tradição da área;
  - mostra o menu como lateral fixa a partir de 1024 px e como gaveta (`Sheet`)
    abaixo disso.
- **Páginas:**
  - `Mapa` (P01), com o atalho "Continuar" que mostra o título quando a área
    está em cache;
  - `Capa` (P02);
  - `Item`, com `Tema` (P06), `Oficina` (P10) e `Pager` (P09);
  - `Tutor` (P07), com o mesmo prompt do app antigo, em `model.ts`;
  - `Notes` (P08): o estado acompanha o store durante a renderização, sem
    efeito, e não troca o texto enquanto o campo tem foco.
- **Menu** (`AtlasNav`, P03–P05): seletor de área, contagem por módulo, item
  atual com `aria-current`, busca e "buscar em todas" agrupando por área.
- **Testes:**
  - `tests/ui/atlas/navegacao.test.tsx`: R01, R02, R07 e P01–P05;
  - `tests/ui/atlas/tema.test.tsx`: P06–P10;
  - axe-core na capa e no tema.
- **Ajustes durante a implementação:**
  - No jsdom o CSS não esconde o menu lateral, então as consultas dos testes
    são feitas dentro de regiões nomeadas. A capa ganhou a região "Módulos".
  - O user-event instala uma área de transferência falsa, e o teste do tutor lê
    o texto copiado dela.
- **Comandos executados:**
  - `npx vitest run --project ui`: 75/75;
  - `npx vitest run --project core`: 94/94;
  - `tsc` e `eslint .`: limpos;
  - tema m8e3 conferido no navegador a 800 px e a 1280 px.

### E5 — Conta e utilidades (2026-11-05)

- **Login discreto (RN18):**
  - `src/app/account.ts`: chave `atlas-conta-vista`;
  - `src/app/conta.tsx`: `SyncIndicator`, painel, `LoginForm` em dois passos
    e `useAccountTracker`, que marca o aparelho e avisa "Conectado como…";
  - `src/app/pages/Entrar.tsx`: rota `/entrar` registrada no shell, sem link
    no site.
- **Ajustes** (`src/app/Ajustes.tsx`, P14): tamanho P/M/G/GG e tema
  auto/claro/escuro, aplicados no `<html>` e guardados só no aparelho.
- **Ferramentas** (`AtlasTools`, P11/P12):
  - exportar, importar (com confirmação), Zerar (com confirmação, texto conforme
    o login) e Salvar em PDF;
  - `src/ui/Confirm.tsx` substitui o `window.confirm`.
- **PDF (P13):** `print/RoteiroImpresso.tsx` é renderizado sob demanda num
  portal. `usePrint` fica na moldura do atlas, que é única: o menu aparece duas
  vezes no celular e duplicaria a impressão. O Ctrl+P também gera o roteiro
  (`beforeprint` com `flushSync`).
- **Testes:**
  - `conta.test.tsx`: 7 testes (A01–A08);
  - `utilidades.test.tsx`: 8 testes (P11–P14, P16);
  - `upgrade.test.tsx`: 2 testes (D01, D02), com o estado e a fila no formato
    exato do app antigo (K4);
  - `fake-supabase.ts`: cliente falso injetado via `loadSupabase`.
- **Comandos executados:**
  - `npx vitest run`: 186/186 (17 arquivos);
  - `tsc` e `eslint .`: limpos.

### E6 — Offline e deploy (2026-11-05)

- **T6.1 (O04, KW1):**
  - `src/sw-rules.ts` concentra as regras puras: app-shell, conteúdo, precache
    e rede. `tests/core/sw-rules.test.ts` falhou contra o stub e passou com a
    implementação.
  - `src/sw.ts` usa Workbox via `vite-plugin-pwa` (`injectManifest`):
    - precache dos arquivos versionados, sem `content/**`;
    - `NavigationRoute` para o `index.html`;
    - `NetworkFirst` com 3 s para `/content/*`;
    - apaga `atlas-v1` na ativação;
    - `skipWaiting` e `clientsClaim`.
  - O `tsconfig.sw.json` usa a lib WebWorker; o `typecheck` roda os dois
    tsconfig.
- **PWA:** manifesto com ícones 192, 512 e maskable, e `apple-touch-icon`. Os
  ícones são gerados de `public/icon.svg` por `scripts/icons.mjs`, com o
  Chromium do Playwright. O registro do SW só acontece em produção (`main.tsx`).
- **Vercel:**
  - `vercel.json` com `framework: vite`, `npm ci`, `npm run build` e saída
    `dist`;
  - reescrita `/(.*)` → `/index.html` (a Vercel serve primeiro os arquivos
    existentes);
  - `no-cache` geral, `/assets/*` imutável por 1 ano e `/content/*` por 5 min
    com revalidação;
  - `.vercelignore` revisto para o build do Vite.
- **R08:** a rolagem passou ao `ScrollRestoration` do React Router (topo em
  navegação nova, posição restaurada ao voltar). O foco continua indo ao
  `<main>`.
- **Testes portados:** `tests/app/{validate,keepalive,deploy}` foram para
  `tests/scripts/*.test.ts` (Vitest). O teste de deploy foi reescrito para a
  configuração nova. Os fixtures inválidos do `validate` usam um tipo frouxo
  declarado e justificado no arquivo.
- **E2E** (`e2e/routes.spec.ts` e `e2e/offline.spec.ts`), 13/13:
  - R01, R03 (5 links antigos, com `history.length` igual ao de uma visita
    direta), R04 e R08;
  - O01 (tema aberto e marcado offline);
  - O02 (área nunca aberta, com o manifesto alterado via `context.route`, que
    intercepta também o SW no Chromium);
  - O03 (cache `atlas-v1` apagado).
- **Aviso conhecido:** o `workbox-build` 7.4.1 traz `glob@11` como dependência
  de desenvolvimento, com aviso de descontinuação. Ele não vai para o bundle.
- **Comandos executados:**
  - `npm run typecheck` e `eslint .`: ok;
  - `npx vitest run`: 226/226;
  - `npm run test:legacy`: 95/95 (o que resta da base antiga);
  - `npm run validate`: ok;
  - `npx playwright test`: 13/13.

### E7 — Acabamento (2026-11-05)

- **T7.2 (Q01, Q03):**
  - `scripts/size-budget.mjs` soma o gzip do chunk de entrada e de seus imports
    estáticos e falha se passar de 150 KB ou se o supabase-js entrar no
    carregamento inicial;
  - `scripts/check-secrets.mjs` procura, nos arquivos versionados e em `dist/`,
    JWT com papel `service_role`, chaves `sb_secret_` e variáveis de segredo
    preenchidas, sem imprimir o valor encontrado;
  - `tests/scripts/guardas.test.ts`: 5 testes, que falharam sem os scripts e
    passaram com eles;
  - os dois passos entraram no job `qualidade` do CI;
  - resultado real: JS inicial de 118,1 KB gzip e nenhum segredo encontrado.
- **T7.1 (U04) e U02 com renderização real** (`e2e/layout.spec.ts`), 19/19:
  - 6 páginas a 320 px em GG, sem rolagem lateral e com campos ≥ 16 px;
  - a gaveta cabe na tela, fecha com `Esc` e devolve o foco;
  - axe-core injetado no Chromium, com contraste real (wcag2a, wcag2aa e
    wcag21aa) nos temas claro e escuro, sem violações sérias ou críticas.
- **T7.3 (revisão visual):** conferido no navegador a 1280 px (claro) e a
  375 px (escuro). Ajustes feitos:
  - o mapa separa as áreas disponíveis da lista compacta "Em breve";
  - o progresso da área aparece no topo do menu lateral;
  - a linha de progresso do celular some no desktop.

  **Pendente:** a aprovação visual do autor, que estava ausente. As capturas
  entram na documentação (E8).
- **Comandos executados:** `npx vitest run`: 231/231; `eslint .` limpo.

### E8 — Documentação e limpeza (2026-11-05)

- **T8.1 (Q04, Q05):**
  - `README.md` reescrito em inglês: as 13 seções da RN15, dois diagramas
    mermaid (arquitetura e sincronização), quatro capturas e tabela de ADRs;
  - `LICENSE` MIT;
  - em `docs/`: `arquitetura.md`, `sincronizacao.md`, `conteudo.md` (formato,
    guia de área nova em 5 passos, regras de `exemplos/`), `deploy.md`
    (Supabase, Vercel, GitHub, roteiro de verificação e problemas comuns) e
    `adr/0001…0011` mais o índice;
  - `tests/docs.test.ts`, 33 testes: seções, ADRs com as cinco partes,
    `npm run X` citados existem, links relativos resolvem, a tabela de áreas
    bate com o manifesto e o exemplo de currículo é JSON válido.
- **Capturas** (`docs/img/`): geradas do build de produção por
  `scripts/screenshots.mjs` (`npm run screenshots`): portal claro, tema claro,
  capa escura e celular escuro.
- **T8.2 (limpeza):**
  - removidos `assets/`, `sw.js` da raiz, `scripts/serve.mjs` e `tests/app/`,
    com o script `test:legacy` e o passo dele no CI;
  - `validate.mjs` agora varre `.ts` e `.tsx` na isolação de `exemplos/`. A
    substituição feita na E1 não tinha aplicado; o teste do fixture passou a
    usar `src/app.ts` e foi visto falhar antes da correção.
- **T8.3:** guia local `docs/subir-atlas.html` (fora do git) atualizado:
  - preset Vite e variáveis de ambiente no lugar de `config.js`;
  - redeploy depois de cadastrar as variáveis;
  - Redirect URLs com `/**`;
  - login por `/entrar`.
- **Aviso conhecido:** o build do SW mostra "inlineDynamicImports option is
  deprecated", vindo do `vite-plugin-pwa` 2.0.0 com o Vite 8. Não afeta a
  saída.
- **Comandos executados:**
  - `npm run typecheck` e `eslint .`: ok;
  - `npx vitest run`: 264/264 (23 arquivos);
  - `npm run validate`: ok;
  - `npm run build`: ok;
  - `npm run size`: 118,2 KB gzip;
  - `npm run secrets`: nenhum segredo encontrado;
  - `npx playwright test`: 32/32;
  - `bash tests/db/run.sh`: não executado localmente nesta etapa (banco
    inalterado); roda no CI.
