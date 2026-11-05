# Especificação — Portal Atlas em React

Base: `visao.md` (RN01–RN17, AC01–AC21).

## Níveis de teste

| Nível | O que é | Comando |
|---|---|---|
| **unit** | Vitest em Node: módulos puros de `src/core` | `npm test` |
| **comp** | Vitest com jsdom e Testing Library: componentes e páginas montados com roteador em memória | `npm test` |
| **e2e** | Playwright (Chromium) contra `vite preview` do build de produção: rotas, recarga, offline e redirecionamentos | `npm run e2e` |
| **script** | verificações em Node | `npm run validate`, `npm run size`, `npm run secrets` |
| **db** | inalterado | `bash tests/db/run.sh` |
| **browser** | verificação dirigida no navegador embutido, incluindo largura de 320 px e tema escuro | — |
| **e2e-real** | dois aparelhos reais contra o Supabase do autor; possível só depois do deploy | — |

Convenção: `K(área,id,marca)` = `politica/m1e1:def`.

## Dados e núcleo

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| D01 | RN02, AC02 | `localStorage` com `atlas-v3` do app antigo (fixture real gerada pelo app atual) e `atlas-v3-queue` com 2 operações | — | montar o app | marcações, anotação, `lastAt`, tema escuro e tamanho G iguais; com sessão falsa e rede, 2 upserts e fila vazia | JSON corrompido: estado vazio sem exceção (como hoje) | comp |
| D02 | RN02, AC03 | só `atlas-estudos-v2` | `{done:{"m1e1:def":true}}` | montar | `politica/m1e1:def` marcado; chave v2 intacta | — | unit |
| D03 | RN03, AC04 | suíte `tests/app/{store,merge,queue,backup,sync,sync-auth}.test.mjs` | mesmos casos | portar para Vitest + TypeScript sem mudar asserções | mesmas asserções verdes (sem casos removidos) | caso removido ou afrouxado reprova a revisão | unit |
| D04 | RN03 | cliente Supabase falso | marcação | `sync` | linha `progress` com as mesmas colunas e o mesmo `onConflict` do contrato K3 da especificação anterior | coluna nova ou ausente reprova | unit |
| D05 | técnico (risco R1) | tipos de `src/core` | `tsc --noEmit` estrito | checar tipos | zero erros; `any` explícito proibido pelo lint em `src/core` | — | script |

## Rotas e portal

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| R01 | RN04, AC05 | build servido | `/`, `/atlas`, `/atlas/politica`, `/atlas/politica/m8e3` | navegar | portal; mapa; capa; tema com o título de m8e3 | — | comp + e2e |
| R02 | RN04, AC06 | — | `/atlas/historia` (planejada), `/atlas/xyz`, `/atlas/politica/zzz`, `/xyz` | navegar | mapa com aviso; mapa com aviso; capa de política; portal com aviso | nunca tela branca nem exceção | comp |
| R03 | RN05, AC07 | — | `/#/politica/m1e1`, `/#m1e1`, `/#inicio`, `/#/politica`, `/#/` | abrir | endereço vira o novo (substituição); `history.length` não cresce | hash desconhecido (por exemplo `/#zzz`): leva a `/atlas` sem erro | unit (função) + e2e |
| R04 | RN06, AC08 | build em `vite preview` com fallback de SPA | `/atlas/politica/m1e1` | recarregar | mesma página, status 200 | — | e2e |
| R05 | RN07, AC10 | registro: atlas `disponivel` e dossiês `planejado` | `/` | renderizar | cartão Atlas com link e progresso; cartão Dossiês "em breve" sem `<a>` | — | comp |
| R06 | RN08, AC11 | seção de teste `fixtures/secao-teste` com rota `/teste` e cartão próprio | registro de teste = padrão + teste | montar portal | cartão na página inicial; `/teste` renderiza a página da seção | o teste importa o shell, o armazenamento e a sincronização reais, sem stub | comp |
| R07 | RN09, AC12 | manifesto e currículo de teste servidos por `fetch` falso | área `teste` | navegar | área no mapa, capa e tema navegáveis | — | comp |
| R08 | técnico (risco R2) | `history` com estado | navegação entre temas | voltar e avançar | rolagem volta ao topo ao trocar de item e preserva a posição ao voltar | — | e2e |

## Paridade (inventário da visão)

| ID | Origem | Item do inventário | Verificação | Nível |
|---|---|---|---|---|
| P01 | RN01 | 1 mapa, progresso, "em breve", continuar | cartões por área; `%` com total conhecido; continuar leva a `lastAt` | comp |
| P02 | RN01 | 2 capa | título, subtítulo, `lead` com `{temas}` trocado, três passos | comp |
| P03 | RN01 | 3 menu | seletor troca de área; contagem `n/total` por módulo; item atual destacado | comp |
| P04 | RN01 | 4 busca | filtro na área; atalho "buscar em todas" agrupa por área; área sem rede avisa e segue | comp |
| P05 | RN01 | 5 progresso | barra reflete marcações da área | comp |
| P06 | RN01 | 6 tema | todas as seções do JSON aparecem; livro ou ponte; marcações def, vid e book alternam e persistem | comp |
| P07 | RN01 | 7 tutor | "copiar prompt" copia `promptBase` + tema; links para Claude e ChatGPT | comp |
| P08 | RN01 | 8 anotações | cada tecla grava local; uma atualização remota não rouba o foco nem apaga o que está sendo digitado; aplica-se ao perder o foco | comp |
| P09 | RN01 | 9 anterior e próximo | navega na ordem do currículo, atravessando módulos | comp |
| P10 | RN01 | 10 oficina | proposta, exercício, entregável e marcação "feito" | comp |
| P11 | RN01 | 11 backup | exporta v3; importa v2 e v3 mesclando | unit (núcleo) + comp (botões) |
| P12 | RN01 | 12 Zerar | pede confirmação; aplica `resetAt` | comp |
| P13 | RN01, RN14, AC18 | 13 PDF | conteúdo imprimível contém todos os módulos, temas e oficinas da área; `window.print` chamado | comp |
| P14 | RN01, RN12 | 14 ajustes | tamanho (P, M, G, GG) e tema (auto, claro, escuro) persistem por aparelho e não entram na fila | comp |
| P15 | RN01, RN11 | 15 conta | ver cenários A01–A04 | comp |
| P16 | RN01 | 16 avisos | aviso aparece em `role=status`; texto do backup muda com o login | comp |

## Autenticação

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| A01 | RN11, AC13 | em `/atlas/politica/m2e1`, sem sessão | e-mail | pedir login | `signInWithOtp` com `emailRedirectTo = origin + /atlas/politica/m2e1` e `shouldCreateUser:false` | e-mail inválido: "Digite um e-mail válido." | comp |
| A02 | RN11, AC13 | retorno com `?code=` em `/atlas/politica/m2e1` | — | montar | sessão trocada; `?code` removido com `replaceState`; página certa | `otp_expired`: mensagem de link expirado | comp |
| A03 | RN11, AC14 | código pedido | `123456` correto / errado | verificar | autenticado / "Código inválido ou expirado. Peça um novo." | — | comp |
| A04 | RN11, AC15 | autenticado com marcações | — | sair | `signOut({scope:'local'})`; marcações seguem; indicador "Não sincronizado" | — | comp |
| A05 | RN13, AC17 | Supabase não configurado (env vazio) | — | montar | modo só local; nenhum `import` do cliente | — | comp |

## Offline e PWA

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| O01 | RN06, RN10, AC09 | visitei `/` e abri política; service worker ativo | contexto offline | abrir `/atlas/politica/m3e1` direto e marcar `def` | tema aberto; marcação gravada local; indicador "Offline" | — | e2e |
| O02 | RN10, AC09 | offline; área de teste disponível nunca aberta | `/atlas/teste` | abrir | aviso "Esta área precisa de conexão na primeira abertura."; menu navegável | — | e2e (manifesto de teste) |
| O03 | técnico (risco R3) | service worker antigo (`sw.js`, cache `atlas-v1`) instalado | nova versão publicada | ativar | novo service worker no mesmo caminho `/sw.js` substitui o antigo e apaga `atlas-v1` | — | e2e |
| O04 | RN03 | — | requisições ao domínio do Supabase | interceptar | nunca vão para o cache | — | unit (regras do SW) |

## Interface, acessibilidade e qualidade

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| U01 | RN12, AC16 | tokens de cor em `src/ui/tokens.ts` | pares texto/fundo dos temas claro e escuro, mais cores de tradição sobre o fundo | calcular razão WCAG | texto normal ≥ 4,5; texto grande e ícones ≥ 3 | cor de tradição abaixo de 4,5 só pode ser usada como faixa ou texto grande; o teste lista onde | unit |
| U02 | RN12, AC16 | telas principais | `axe-core` (regras de nome acessível, papéis e rótulos; contraste fica com U01) | rodar em cada tela montada | zero violações sérias ou críticas | — | comp |
| U03 | RN12, AC16 | — | Tab e Shift+Tab, Enter, Esc | percorrer menu, painel de conta, ajustes, marcações e anotação | toda ação alcançável; Esc fecha painéis e devolve o foco a quem abriu | — | comp + browser |
| U04 | RN12, AC16 | 320 px de largura, tamanho GG | telas principais | medir | `scrollWidth <= clientWidth`; campos de texto com fonte ≥ 16 px | — | e2e (viewport 320) |
| Q01 | RN13, AC17 | `dist/` gerado | manifesto do Vite | `npm run size` | soma gzip do chunk de entrada e dos seus imports estáticos ≤ 150 KB; nenhum desses chunks contém `@supabase` | estouro: código 1 com o tamanho por chunk | script |
| Q02 | RN16, AC20 | push | — | Action | jobs `qualidade` (tipos, lint, conteúdo, testes, build, tamanho, segredos), `e2e` e `banco` | qualquer falha deixa vermelho | CI |
| Q03 | RN17, AC21 | repositório e `dist/` | padrões `service_role`, `sb_secret_`, JWT com `"role":"service_role"` | `npm run secrets` | nenhuma ocorrência fora da documentação que alerta contra elas | ocorrência: código 1 com o arquivo | script |
| Q04 | RN15, AC19 | README e `docs/` | seções exigidas; ADRs | teste de documentação | README tem todas as seções da RN15; cada ADR tem as cinco partes; comandos citados existem em `package.json` | — | unit (docs) |

## Matriz RN → AC → cenário → teste

| RN | AC | Cenários | Testes |
|---|---|---|---|
| RN01 | AC01, AC18 | P01–P16 | `tests/ui/atlas/*.test.tsx` |
| RN02 | AC02, AC03 | D01, D02 | `tests/ui/upgrade.test.tsx`, `tests/core/store.test.ts` |
| RN03 | AC04 | D03, D04, O04 | `tests/core/{store,merge,queue,backup,sync,sync-auth}.test.ts`, `tests/core/sw-rules.test.ts` |
| RN04 | AC05, AC06 | R01, R02 | `tests/ui/routes.test.tsx`, `e2e/routes.spec.ts` |
| RN05 | AC07 | R03 | `tests/core/legacy.test.ts`, `e2e/routes.spec.ts` |
| RN06 | AC08, AC09 | R04, O01 | `e2e/routes.spec.ts`, `e2e/offline.spec.ts` |
| RN07 | AC10 | R05 | `tests/ui/portal.test.tsx` |
| RN08 | AC11 | R06 | `tests/ui/secao-nova.test.tsx` |
| RN09 | AC12 | R07 | `tests/ui/area-nova.test.tsx` |
| RN10 | AC09 | O01, O02 | `e2e/offline.spec.ts` |
| RN11 | AC13–AC15 | A01–A04 | `tests/ui/conta.test.tsx` |
| RN12 | AC16 | U01–U04, P14 | `tests/ui/tokens.test.ts`, `tests/ui/a11y.test.tsx`, `e2e/layout.spec.ts` |
| RN13 | AC17 | Q01, A05 | `scripts/size-budget.mjs`, `tests/ui/conta.test.tsx` |
| RN14 | AC18 | P13 | `tests/ui/atlas/pdf.test.tsx` |
| RN15 | AC19 | Q04 | `tests/docs.test.ts` |
| RN16 | AC20 | Q02 | `.github/workflows/validate.yml` (execução real) |
| RN17 | AC21 | Q03 | `scripts/check-secrets.mjs` |
| técnico | — | D05, R08, O03 | `tsc`, `e2e/routes.spec.ts`, `e2e/offline.spec.ts` |

## Totais

- 17 RNs e 21 ACs.
- 46 cenários: D 5, R 8, P 16, A 5, O 4, U 4, Q 4. Destes, 4 são técnicos (D05,
  R08, O03, O04), cada um ligado a um risco.
- Nenhum gap.
- Pendentes de verificação real, só possíveis depois do deploy: e2e-real e
  login real (A01–A03 com Supabase de verdade).

## Extensão 2026-11-05 — login discreto (RN18) e licença

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| A06 | RN18, AC22 | `localStorage` sem a marca de "já entrou" | `/`, `/atlas`, `/atlas/politica/m1e1` | renderizar | sem indicador de sincronização, sem painel de conta e sem texto de login; nenhum `<a href="/entrar">` no DOM | — | comp |
| A07 | RN18, AC22b, AC13 | aparelho sem a marca de "já entrou" | `/entrar`, e-mail, código `123456` | entrar | autenticado; navega para `/atlas`; a marca de "já entrou" é gravada; o indicador aparece | código errado: "Código inválido ou expirado. Peça um novo." | comp |
| A08 | RN18 | marca de "já entrou" presente e sem sessão (o autor saiu) | `/atlas` | renderizar | indicador "Não sincronizado" visível | — | comp |
| Q05 | RN15 | raiz do repositório | `LICENSE` | teste de documentação | texto MIT com o ano e o titular; README com a seção "License" e o link da demo | — | unit (docs) |

O A01 passa a partir do painel de conta, quando a marca de "já entrou" está
presente, e do `/entrar`, quando não está; o `emailRedirectTo` aponta para a
página atual nos dois casos. A matriz recebe `RN18 → AC22, AC22b, AC13 → A06–A08
→ tests/ui/conta.test.tsx` e `RN15 → AC19 → Q05 → tests/docs.test.ts`. Novos
totais: 18 RNs, 23 ACs e 50 cenários.
