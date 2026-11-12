# Plano: preparatório Concurso Contagem/MG 2027

## Decisões

| # | Decisão | Alternativas | Escolha | Consequência | Gatilho de revisão |
|---|---|---|---|---|---|
| D1 | Onde o concurso mora no Atlas | área de topo `/atlas/contagem-2027`; área comum com currículo de temas | agrupador **"Concursos"** (`concursos`) com o subtema `contagem-2027` de **`tipo: "concurso"`**: `/atlas/concursos/contagem-2027`. Reaproveita o modelo de subtemas (K1 v2) e deixa o próximo concurso ser só mais um subtema (RN23) | o mapa ganha o cartão "Concursos"; a moldura do atlas precisa reconhecer o tipo | um concurso precisar de navegação fora do atlas |
| D2 | Formato do conteúdo | estender `curriculum.json`; um arquivo único gigante | **`concurso.json`** (edital, fontes, quadro, datas, disciplinas › módulos › tópicos › subtópicos, trilha, rotina) + **`teoria/<disciplina>.json`** + **`questoes/<disciplina>.json`**, todos em `private/content/contagem-2027/` e carregados sob demanda pela função autenticada | o `curriculum.json` atual não muda; o `validate` ganha um validador do tipo concurso | arquivos de questões > ~500 KB: dividir por módulo |
| D3 | Rotas | rotas fora da árvore do atlas | acrescentar `:area/:b/:c/:d`. Na folha concurso: `c` = página (`trilha`, `topico`, `questoes`, `simulado`, `erros`, `revisoes`, `discursiva`, `painel`), `d` = ID; sem `c`, a capa (hoje + contagem + cobertura) | rotas atuais intactas; resolução continua no `AtlasLayout` | — |
| D4 | Persistência dos registros | uma tabela por tipo (sessões, tentativas, simulados…); reaproveitar `progress`/`notes` | **uma tabela `registros`** `(user_id, area, tipo, registro_id, corpo jsonb, updated_at)`, PK `(user_id, tipo, registro_id)`, RLS "dono", trigger "vence o mais recente", limite de 16 KB por corpo. Eventos (tentativa, sessão, replanejamento, simulado, discursiva) têm ID único e nunca são reescritos; estados (tópico, revisão feita, plano) são linhas mutáveis | a fila e a sincronização ganham uma tabela genérica; nenhum tipo novo exige migração | consultas no servidor que precisem de colunas tipadas |
| D5 | Estado local dos registros | campo novo no estado `atlas-v3` | **chave própria `atlas-registros-v1`** e módulo `src/core/registros.ts` com a mesma regra do store (grava antes de avisar) | uma aba com versão antiga não apaga registros ao salvar o `atlas-v3` | — |
| D6 | Regras de cálculo | calcular nos componentes | **funções puras** em `src/core/concurso/` (calendário, progresso, taxa, caderno, revisões, nota, temas fracos) com relógio injetado | testáveis sem navegador, como o resto do núcleo | — |
| D7 | Fuso de "hoje" | UTC; fuso do aparelho | **`America/Sao_Paulo`** via `Intl.DateTimeFormat` | o dia não vira às 21h; viagens não mudam o plano | concurso em outro fuso: fuso vira campo do `concurso.json` |
| D8 | Simulado em andamento | sincronizar a cada resposta | **só local** (`atlas-simulado-ativo`) até terminar; ao terminar vira registros | não há conflito entre aparelhos no meio da prova | — |
| D9 | Backup e "Zerar tudo" | ficar de fora | backup **v4** inclui registros; importa v2, v3 e v4; "Zerar tudo" aplica o `resetAt` também aos registros | o princípio "nunca perder" vale para o preparatório | — |
| D10 | Produção do conteúdo (~73 tópicos, 600–700 questões, casos da discursiva) | escrever tudo em sequência | **levas por semana da trilha**; em cada leva, um subagente por disciplina escreve teoria e questões a partir do item do edital e de um guia de estilo; eu valido, reviso coerência e o autor revisa antes do commit | qualidade verificável por leva | queda de qualidade: reescrever os tópicos apontados |

D1+D3 viram o ADR-0014 (concurso como subtema tipado) e D4+D5 o ADR-0015
(registros genéricos sincronizados).

## Módulos e responsabilidades

| Módulo | Mudança |
|---|---|
| `src/core/types.ts` | `AreaMeta.tipo?: "curriculo" \| "concurso"`; tipos do concurso (K-C1) e dos registros (K-R1) |
| `src/core/content.ts` | `loadConcurso(slug)` (concurso + teoria/questões sob demanda), sem mudar `loadArea` |
| `src/core/registros.ts` (novo) | estado local, escrita, eventos, `applyOps`, `reset` |
| `src/core/queue.ts`, `src/core/merge.ts`, `src/core/sync.ts` | tabela `registros` no ciclo (pull, mescla por `updated_at`, envio) |
| `src/core/concurso/*.ts` (novo) | calendário, progresso, desempenho, caderno, revisões, simulado, nota, temas fracos |
| `src/core/backup.ts` | v4 |
| `supabase/migrations/0002_registros.sql` (novo) | tabela, índice, RLS, trigger, grants, limite de tamanho |
| `tests/db/test.sql` | RLS, trigger e limite da tabela nova |
| `src/sections/atlas/routes.tsx`, `AtlasLayout.tsx`, `paths.ts` | rota `:d`; resolução da folha concurso |
| `src/sections/atlas/concurso/` (novo, chunk sob demanda) | Capa (hoje, contagem, cobertura, composição), Trilha, Tópico, Questões, Simulado, Erros, Revisões, Discursiva, Painel, Sessão |
| `src/sections/atlas/pages/Mapa.tsx`, `Grupo.tsx`, `AtlasCard.tsx` | progresso do concurso a partir dos registros |
| `scripts/validate.mjs` | validador do tipo concurso (S01, S06, S08, S09, S36, S38, S39) |
| `private/content/areas.json` | agrupador "Concursos" + subtema `contagem-2027` |
| `private/content/contagem-2027/*` | programa, trilha, teoria e questões |
| `docs/conteudo.md`, `docs/arquitetura.md`, `docs/sincronizacao.md`, `README.md`, ADRs | formato, tabela nova, rotas |

## Ordem (todas as funcionalidades antes do início, conforme P4)

1. **T1 — Programa e trilha como dado:** validador + `concurso.json` com o
   programa completo do Anexo IV (Ret. 02), fontes, estados de validação, quadro,
   datas, trilha e rotina. Sem teoria ainda.
2. **T2 — Calendário** (S11–S16).
3. **T3 — Registros e banco** (S17–S26): migration 0002, `registros.ts`,
   sincronização, testes de banco.
4. **T4 — Regras de cálculo** (S27–S34).
5. **T5 — Telas base:** cartão, capa, trilha com reagendamento, tópico com
   estado/leitura/confiança/fonte, sessão (S02–S07, S10, S19, S20, S35).
6. **T6 — Questões e caderno de erros** (S36–S39).
7. **T7 — Revisões** (telas de S30–S32).
8. **T8 — Painel** (S45).
9. **T9 — Simulados** (S40–S43). **Depende de P9.**
10. **T10 — Discursiva** (S44).
11. **T11 — Backup v4 e zerar** (S48).
12. **T12 — Guardas e e2e** (S46, S47, S49) e documentação/ADRs.
13. **T13 — Conteúdo, leva 1:** teoria e questões dos tópicos das semanas 1–2.
    Revisão do autor. Libera o início do estudo.
14. **T14–T17 — Levas 2 a 5** (semanas 3–4, 5–6, 7–8, 9–10 + casos da
    discursiva), sempre ao menos uma semana à frente da trilha.

## Validação disponível

`npm run typecheck`, `npm run lint`, `npm test`, `npm run validate`,
`npm run build`, `npm run size`, `npm run secrets`, `npm run privacy`,
`npm run e2e`, `bash tests/db/run.sh` (Docker) e o CI.

## Riscos

| Risco | Mitigação |
|---|---|
| Prazo: "tudo antes" + conteúdo extenso empurram o início para depois de 16/11/2026 | ordem acima; o reagendamento (RN10) permite deslocar semanas; o autor decide a data real de início |
| Questão autoral com gabarito errado | `validate` confere estrutura (4 alternativas, um gabarito); comentário obrigatório justifica a resposta; revisão do autor por leva; botão de "reportar problema" fica como melhoria futura |
| Conteúdo de Contagem (história, leis municipais) impreciso | só fatos verificáveis com fonte citada no tópico; leis lidas no texto oficial; o que não for conferido fica `pendente` |
| Itens obsoletos (XP, Office 2007, StarOffice 5.1) | são obrigatórios no edital vigente: escrever com foco no que a banca costuma cobrar desses itens, sem tratá-los como opcionais |
| Nova retificação | `edital-vigente.md` registra versão; nova retificação → comparar, marcar tópicos `divergente` e atualizar |
| Registros crescem sem limite (tentativas) | ~700 questões × poucas tentativas cabem com folga; corpo ≤ 16 KB; pull por `area` |
| Quebrar o atlas atual | rotas e `curriculum.json` intocados; suíte atual roda a cada tarefa |
| Peso do JS inicial | telas do concurso em `lazy()`; `npm run size` |
