# Tarefas: preparatório Concurso Contagem/MG 2027

Cada tarefa: testes RED primeiro, mudança mínima, testes GREEN e suíte
disponível (`typecheck`, `lint`, `test`, `validate`).

| # | Cenários | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| T1.1 | S01, S06, S08, S09, S36, S38, S39 | `scripts/validate.mjs`, `tests/scripts/validate.test.ts`, `tests/scripts/helpers.ts` | casos válidos e inválidos do tipo concurso | validador | verde |
| T1.2 | S01, S08, S09 | `private/content/areas.json`, `private/content/contagem-2027/concurso.json`, `docs/conteudo.md` | `npm run validate` sobre o arquivo real | programa completo (LP, RL, CGM, CE), fontes com página, validação, quadro, datas, trilha (10 semanas), rotina | `validate` verde; tabela de tópicos conferida contra `edital-vigente.md` |
| T2 | S11–S16 | `src/core/concurso/calendario.ts`, `tests/core/concurso/calendario.test.ts` | datas da visão, inclusive virada de fuso | funções puras | verde |
| T3.1 | S24–S26 | `supabase/migrations/0002_registros.sql`, `tests/db/test.sql` | RLS, trigger, limite | migration | `bash tests/db/run.sh` verde |
| T3.2 | S17, S18, S19, S20, S21 | `src/core/registros.ts`, `tests/core/registros.test.ts` | escrita local antes do aviso; eventos e estados | módulo | verde |
| T3.3 | S22, S23, S26 | `src/core/queue.ts`, `merge.ts`, `sync.ts`, `tests/core/fake-backend.ts`, `tests/core/sync.test.ts` | dois aparelhos com registros | tabela `registros` no ciclo | verde; cenários antigos de sync verdes |
| T4 | S05, S27–S34 | `src/core/concurso/{progresso,desempenho,caderno,revisoes,nota}.ts` + testes | exemplos numéricos da visão | funções puras | verde |
| T5.1 | S35, S10 | `routes.tsx`, `AtlasLayout.tsx`, `paths.ts`, `pages/Mapa.tsx`, `Grupo.tsx`, `tests/ui/atlas/*`, `tests/fixtures/*` | cartão, rota da capa, 2º concurso | resolução da folha concurso + chunk `concurso/` | verde; testes atuais do atlas verdes |
| T5.2 | S02–S04, S06, S07, S16 | `concurso/Capa.tsx`, `concurso/Trilha.tsx` + testes | capa e trilha | telas | verde + axe |
| T5.3 | S18, S19, S20, S39 | `concurso/Topico.tsx`, `concurso/Sessao.tsx` + testes | tópico, reagendar, sessão | telas | verde + axe |
| T6 | S36–S38, S29 | `concurso/Questoes.tsx`, `concurso/Erros.tsx` + testes | responder e caderno | telas | verde + axe |
| T7 | S30–S32 | `concurso/Revisoes.tsx` + teste | lista e marcação de revisão | tela | verde + axe |
| T8 | S45 | `concurso/Painel.tsx` + teste | indicadores com dados fixos | tela | verde + axe |
| T9 | S40–S43 | `concurso/Simulado.tsx`, `src/core/concurso/simulado.ts` + testes | sorteio, tempo, retomada, parcial, histórico | tela + núcleo | **só após P9**; verde |
| T10 | S44 | `concurso/Discursiva.tsx` + teste | critérios e limites | tela | verde + axe |
| T11 | S48 | `src/core/backup.ts`, `src/core/store.ts`, `src/app/Ajustes.tsx`, testes | v4, importação v2/v3/v4, zerar | núcleo | verde |
| T12 | S46, S47, S49 | `e2e/concurso.spec.ts`, `scripts/*`, docs, `docs/adr/0014-*.md`, `docs/adr/0015-*.md` | e2e do fluxo; guardas | ajustes | `build`, `size`, `privacy`, `secrets`, `e2e` verdes |
| T13 | S38, S39 | `private/content/contagem-2027/teoria/*.json`, `questoes/*.json` | `validate` com tópicos das semanas 1–2 publicados | leva 1 | `validate` verde + **revisão do autor** — **feito em 2026-11-11** (revisão do autor pendente) |
| T14 | S38, S39 | idem | idem | leva 2 (semanas 3–4) | **feito em 2026-11-12** (revisão do autor pendente) |
| T15–T17 | S38, S39 | idem | idem por leva | levas 3–5 e casos da discursiva | idem |
