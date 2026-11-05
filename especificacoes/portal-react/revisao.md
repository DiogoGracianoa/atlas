# Revisão: Portal Atlas em React

Data: 2026-11-05 · Ramo: `feat/portal-react`.

**Base:**
- `visao.md`: RN01–RN18 e AC01–AC22b;
- `especificacao.md`: 50 cenários e a extensão da revisão;
- `contratos.md`: KR1, KR2, KS1, KC1 e KW1, mais K1–K5 herdados;
- uma revisão independente do código, feita por um subagente sem as conclusões
  da implementação, comparando `src/core` linha a linha com a base antiga de
  `main`.

## Veredito

**Aprovada com lacunas.** Todas as verificações disponíveis neste ambiente
passaram. As lacunas são as que só podem ser verificadas com os sistemas reais
do autor (Supabase, Vercel e aparelhos) e os testes do banco.

## Comandos executados

| Comando | Resultado |
|---|---|
| `npm run typecheck` (app + service worker) | 0 erros |
| `npm run lint` | 0 problemas |
| `npx vitest run` | **270/270** (24 arquivos) |
| `npx playwright test` (build de produção) | **33/33** |
| `npm run validate` | conteúdo válido |
| `npm run build` | ok |
| `npm run size` | JS inicial de **118,6 KB** gzip (limite 150 KB); supabase-js em chunk separado |
| `npm run secrets` | nenhum segredo no repositório nem em `dist/` |
| `node scripts/check-extract.mjs` | módulos originais de política idênticos (SHA-256 `f9896542…`) |
| `bash tests/db/run.sh` | **não executado**: o Docker Desktop foi iniciado mas não respondeu |

## Cenário → teste

| Cenários | Testes | Resultado |
|---|---|---|
| D01, D02 (dados do app antigo) | `tests/ui/upgrade.test.tsx`, `tests/core/store.test.ts` | verde |
| D03, D04 (núcleo portado) | `tests/core/{store,merge,queue,backup,content,sync,sync-auth}.test.ts`, com as mesmas asserções e contagens por arquivo da base antiga | verde |
| D05 (tipos) | `tsc` estrito | verde |
| R01–R03, R03b, R04, R08 | `tests/ui/portal.test.tsx`, `tests/ui/atlas/navegacao.test.tsx`, `tests/core/legacy.test.ts`, `e2e/routes.spec.ts` | verde |
| R02, R02b | `tests/ui/atlas/navegacao.test.tsx`, `tests/ui/revisao.test.tsx` | verde |
| R05, R06, R07 (portal, seção nova, área nova) | `tests/ui/portal.test.tsx`, `secao-nova.test.tsx`, `atlas/navegacao.test.tsx` | verde |
| P01–P10 | `tests/ui/atlas/{navegacao,tema}.test.tsx` | verde |
| P11–P16, P11b | `tests/ui/utilidades.test.tsx`, `revisao.test.tsx` | verde |
| A01–A08 | `tests/ui/conta.test.tsx` | verde |
| O01–O03 | `e2e/offline.spec.ts` | verde |
| O04 | `tests/core/sw-rules.test.ts` | verde |
| U01, U05 | `tests/ui/tokens.test.ts`, `revisao.test.tsx` | verde |
| U02 (axe) | jsdom em `tests/ui/*` e contraste real em `e2e/layout.spec.ts`, temas claro e escuro | verde |
| U03, U04 | `tests/ui/ui-kit.test.tsx`, `e2e/layout.spec.ts` (320 px, GG) | verde |
| Q01, Q03 | `tests/scripts/guardas.test.ts`, mais `npm run size` e `npm run secrets` no build real | verde |
| Q02 (CI) | `.github/workflows/validate.yml` | **não executado**: o ramo não foi enviado ao GitHub |
| Q04, Q05 (documentação) | `tests/docs.test.ts` | verde |

Nenhum cenário ficou sem teste, e nenhum teste ficou sem cenário. Os testes de
scripts (`validate`, `keepalive`, `deploy`) cobrem cenários da especificação
anterior, que continuam valendo.

## Achados da revisão independente

| # | Severidade | Local | Achado | Decisão | Evidência |
|---|---|---|---|---|---|
| 1 | média | `sections/atlas/components/parts.tsx` (`Notes`) | Com o campo em foco, a atualização remota não entrava; a tecla seguinte gravava o texto antigo com horário novo e apagava a versão mesclada. Herdado do app antigo. | **Corrigido.** O campo acompanha o store mesmo em foco (nada fica pendente, porque cada tecla já é salva) e o cursor é mantido. O cenário P08 foi ajustado. | `tema.test.tsx`: "continuar digitando… não apaga a versão remota" (vermelho → verde) |
| 2 | média/baixa | `components/AtlasTools.tsx` | A importação aplicava um plano calculado antes da confirmação, e uma versão remota chegada com o diálogo aberto era sobrescrita. Regressão da migração. | **Corrigido.** O plano é calculado no "Mesclar". | `revisao.test.tsx` (vermelho → verde) |
| 3 | baixa | `main.tsx` + `core/legacy.ts` | Qualquer hash, em qualquer rota, era tratado como link antigo. `#conteudo` no tema levava ao mapa ao recarregar. | **Corrigido.** A tradução só roda na raiz (contrato KR2 v1.1). | `e2e/routes.spec.ts` (novo) |
| 4 | baixa | `sections/atlas/model.ts` | A validação das cores e chaves de tradição antes do `<style>` tinha se perdido na portabilidade. | **Corrigido.** Só passam chaves `[a-z0-9-]` e cores `#RRGGBB`, e a busca usa `Object.hasOwn`. | `revisao.test.tsx` (vermelho → verde) |
| 5 | baixa | `core/content.ts`, `Item.tsx` | `/atlas/politica/constructor` quebrava a página com a tela padrão de erro do React Router. Herdado. | **Corrigido.** O índice não tem protótipo, e a rota raiz ganhou `errorElement`. | `revisao.test.tsx` (vermelho → verde) |
| 6 | baixa | `vercel.json` | A reescrita geral devolvia HTML com status 200 para arquivo ausente em `/assets` ou `/content`, o que quebraria o import do chunk antigo e cachearia HTML como conteúdo. | **Corrigido.** A reescrita exclui `/assets/`, `/content/` e `/icons/`. | `tests/scripts/deploy.test.ts` |
| 7 | baixa | `core/sync.ts` (`cleanAuthParams`) | O `replaceState(null, …)` apagava o estado do roteador da entrada atual. | **Corrigido.** O estado do histórico é preservado. | suíte de `sync-auth` verde |
| 8 | baixa (de projeto) | `core/sync.ts` | A fila e o estado local não pertencem a um usuário: se A sai com itens na fila e B entra no mesmo aparelho, os itens de A sobem para a conta de B. É idêntico em `main`. | **Não corrigido:** mudaria uma regra de negócio (dados locais por conta). Volta ao refinamento se houver mais de um usuário. Hoje só a conta do autor existe (cadastro fechado). | — |

**Áreas revisadas sem achado:**
- **Fidelidade do núcleo:** mesmas constantes (800 ms, 15 s, 30 s), mesmos
  laços de envio e busca, mesma captura do `uid` ao sair durante o envio,
  mesma classificação de erros.
- **Contador de versão** (`useSyncExternalStore`).
- **RN18:** visitante sem login e nenhum link para `/entrar`.
- **Service worker:** substitui o antigo no mesmo caminho e nunca guarda o
  Supabase.
- **Segredos.**
- **XSS:** não há `dangerouslySetInnerHTML`, os links externos usam
  `noopener noreferrer`, e o React 19 bloqueia `javascript:`.

## Riscos avaliados

| Risco | Aplica? | Situação |
|---|---|---|
| Perda de dados na sincronização | sim | núcleo portado sem diferença de comportamento; achados 1 e 2 corrigidos; 18 cenários de dois aparelhos verdes |
| Acesso indevido | sim | RLS por `auth.uid()` (migration inalterada); cadastro fechado; só chave pública no front (`npm run secrets`) |
| Injeção | baixo | conteúdo próprio; CSS de tradição validado (achado 4); sem HTML bruto |
| Concorrência | sim | trigger LWW no banco e mescla por entrada; edição simultânea online da mesma anotação perde a mais antiga sem marcador (limitação documentada) |
| Migração e compatibilidade | sim | `localStorage` v3, v2 e fila lidos sem conversão (D01, D02); SW antigo substituído e `atlas-v1` apagado (O03); links com `#` redirecionados (R03) |
| Observabilidade | baixo | erros de rede e descartes vão para o console sem conteúdo de anotação; não há telemetria (site pessoal) |
| Dependências | sim | versões exatas com 14 dias ou mais (ADR-011); avisos conhecidos: `glob@11` deprecado (dev, via `workbox-build`) e `inlineDynamicImports` deprecado no build do SW |

## Lacunas

1. **Testes do banco** (`bash tests/db/run.sh`): não executados. O Docker
   Desktop foi iniciado mas não respondeu em vários minutos; talvez espere
   alguma interação na janela dele. A migration e `tests/db/` não mudaram desde
   `main`, onde passaram (Etapa 2), e rodam no job `banco` do CI.
2. **CI no GitHub (Q02):** o ramo não foi enviado, porque o push depende de
   confirmação do autor.
3. **Supabase real, Vercel real e aparelhos (e2e-real):** dependem dos passos
   manuais de `docs/deploy.md` e do roteiro de verificação de lá.
4. **Aprovação visual do autor (T7.3):** as capturas estão em `docs/img/`.
