# Execução: preparatório Concurso Contagem/MG 2027

Data: 2026-11-11 · Ramo: `feat/letrume-e-preparatorio-contagem`.

## Cenários → testes

| Cenário | Teste | Situação |
|---|---|---|
| S01, S06, S08, S09, S36, S38, S39 (validação) | `tests/scripts/validate-concurso.test.ts` (11) | verde |
| S02–S04, S06, S07 (tela) | `tests/ui/concurso/concurso.test.tsx` | verde |
| S05, S27–S34 | `tests/core/concurso/desempenho.test.ts` (13) | verde |
| S10 | `concurso.test.tsx` › "S10: um segundo concurso entra só com dados" | verde |
| S11–S16 | `tests/core/concurso/calendario.test.ts` (10) + capa em `concurso.test.tsx` | verde |
| S17–S21 | `tests/core/registros.test.ts` (12) + tópico/sessão em `concurso.test.tsx` | verde |
| S21–S23, S26, S48 (sincronização) | `tests/core/sync-registros.test.ts` (6) | verde |
| técnico: banco sem a migration 0002 | `sync-registros.test.ts` › marcações seguem sincronizando; registros esperam na fila (achado durante o registro de execução) | verde |
| S24–S26 (banco) | `tests/db/test.sql` | **não executado**: daemon do Docker parado nesta máquina; roda no job `banco` do CI |
| S35 | `concurso.test.tsx` + `tests/ui/atlas/navegacao.test.tsx` (mapa com 3 cartões) | verde |
| S36–S38 | `concurso.test.tsx` | verde |
| S40–S43 | `concurso.test.tsx` (completo com tempo, retomada após recarregar, parcial, histórico) | verde |
| S44 | `concurso.test.tsx` | verde |
| S45 | `concurso.test.tsx` | verde |
| S46 | `npm run privacy` | verde |
| S47 | `npm run size`: 127,9 KB gzip (limite 150); telas do concurso em chunk sob demanda | verde |
| S48 (backup) | `tests/core/backup.test.ts` (v4) + `tests/ui/utilidades.test.tsx` (exportar v4) | verde |
| S49 | `e2e/concurso.spec.ts` (2) + `e2e/layout.spec.ts` (6 páginas do concurso a 320 px e com axe nos dois temas) | verde |
| Entrega dos arquivos do concurso | `tests/core/conteudo-servidor.test.ts` (9 novos) | verde |
| Carga do concurso no núcleo | `tests/core/content-concurso.test.ts` (4) | verde |

Observação de método: em `registros.ts`, `estudo.ts`, `content.ts` (concurso)
e no simulado, o teste foi escrito antes do código, mas o primeiro vermelho
foi por módulo ausente, não por asserção; nos demais (validador, calendário,
desempenho, sincronização, telas, servidor, backup, redirecionamento) houve
vermelho por asserção antes da implementação.

## Validação executada

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ok |
| `npm run lint` | ok |
| `npx vitest run` | 522 testes, 41 arquivos, todos verdes |
| `npm run validate` | ok: 3 áreas, incluindo o concurso (72 tópicos obrigatórios + 1 opcional) |
| `npm run build` | ok |
| `npm run size` | 127,9 KB gzip |
| `npm run secrets` | nenhum segredo |
| `npm run privacy` | materiais fora da distribuição |
| `npx playwright test` | 96/96 |
| `bash tests/db/run.sh` | **não executado** (Docker sem daemon) |

## Sensor de coerência

- **Cobertos:** RN01–RN29 têm cenário e teste verde, exceto o que depende de
  conteúdo (abaixo).
- **Pendentes de conteúdo:** RN25 e RN28 estão implementadas e testadas com a
  fixture, mas nenhum tópico real está `publicado`: teoria e questões de
  Contagem 2027 são as tarefas T13–T17 (levas). Até lá, todo tópico mostra
  "Conteúdo em preparação" e o simulado sai parcial.
- **P9 (aberta):** as respostas de simulado são gravadas com
  `origem: "simulado"` e **não** entram na taxa de acertos nem no caderno de
  erros. O plano condicionava a T9 à P9; a tela foi feita com esse
  comportamento conservador, e mudar a decisão é trocar um filtro em
  `src/core/concurso/desempenho.ts` (`tentativas`) com o teste correspondente.
- **P8:** o tópico do PCCS segue `pendente`; a capa mostra "1 tópico pendente
  de conferência com o edital" até a conferência.
- **Contratos:** K1 v3, K-C1, K-R1 e KB4 respeitados; ajustes registrados na
  extensão de `contratos.md` (campos `revisar`, `notas`, marca de exclusão).
- **Decisões adicionadas:** ADR-0014 e ADR-0015.
- **Impacto real:** a função de conteúdo mudou (extensão em `impacto.md`).
- **Ação externa pendente (autor):** aplicar
  `supabase/migrations/0002_registros.sql` no Supabase **antes** do deploy.
  Sem a tabela, marcações e anotações continuam sincronizando, mas os
  registros ficam na fila do aparelho (indicador em "sincronizando") até a
  migration ser aplicada; nada é descartado.

## Extensão 2026-11-11 — leva 1 de conteúdo (T13)

- **Publicados:** 21 tópicos das semanas 1 e 2, com teoria completa e 197
  questões autorais (LP 55, RL 30, CE 63, CGM 49). Pontos para o autor em
  [revisao-leva-1.md](revisao-leva-1.md).
- **Mudança de formato:** a teoria ganhou `fontes` opcional (título e URL
  https), exibida como "Fontes consultadas"; obrigatória pelo guia nos tópicos
  de Contagem. Testes: `validate-concurso.test.ts` e `concurso.test.tsx`.
- **Guia:** [guia-de-conteudo.md](guia-de-conteudo.md), base das próximas levas.
- **Validação:** `checar-leva.mjs` nas 4 disciplinas; `npm run validate` ok;
  `npx vitest run` 524/524; lint e tipos ok; build, tamanho (127,9 KB),
  segredos e privacidade ok.
- **E2E:** 102 testes (inclui tópico publicado e página de questões a 320 px e
  com axe nos dois temas). Em duas rodadas completas houve 3 e 4 falhas por
  espera de 5 s estourada sob carga da máquina, atingindo também testes de
  diagramas fora do concurso; as que falharam passaram ao repetir
  (`--last-failed`: 4/4) e com 1 worker (24/24). O CI usa 1 nova tentativa.
  Lacuna declarada: instabilidade de tempo, não corrigida nesta leva.

## Extensão 2026-11-12 — leva 2 de conteúdo (T14)

- **Publicados:** 18 tópicos das semanas 3 e 4 (168 questões novas); total de
  39 tópicos e 365 questões. Pontos para o autor em
  [revisao-leva-2.md](revisao-leva-2.md).
- **Programa:** títulos e subtópicos de `cgm-lei-organica-1/2` ajustados à
  divisão do texto da lei (competências na semana 3).
- **Verificador:** passou a recusar a correta como maior alternativa com mais
  do dobro da menor (regra incluída no guia).
- **Achado e corrigido:** a 320 px, o tópico de endereçamento IP rolava na
  horizontal (endereços IPv6 sem quebra). Os textos do concurso agora quebram
  palavras longas (`.texto` em `Concurso.module.css`). Varredura temporária
  das 39 páginas de tópico e 39 de questões a 320 px: 78/78. O e2e fixo ganhou
  `topico/ce-poo-conceitos` (não publicado) e `questoes/ce-redes-ip`.
- **Validação:** `npm run validate` ok; `checar-leva.mjs` nas 4 disciplinas;
  `npx vitest run` 524/524; lint e tipos ok; build, tamanho (127,9 KB),
  segredos e privacidade ok; `npx playwright test` 108/108.
