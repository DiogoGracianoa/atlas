# Impacto: preparatório Concurso Contagem/MG 2027

| Projeto / sistema | Papel atual | Mudança | Motivo | Dependências | Ordem | Altera código? |
|---|---|---|---|---|---|---|
| Portal (raiz) — núcleo | estado, sincronização, conteúdo, backup | registros, regras do concurso, backup v4, tabela nova no ciclo | RN10–RN22, D4–D9 | migration 0002 | T2–T4, T11 | sim |
| Portal — seção Atlas | mapa, capas, temas | rota `:d`, folha concurso, telas novas, cartão | RN29, D1, D3 | núcleo | T5–T10 | sim |
| Portal — shell e design system | moldura, tokens | nenhuma (só reaproveita) | identidade preservada | — | — | não (só valida) |
| Conteúdo privado | manifesto e currículos | agrupador "Concursos" e pasta `contagem-2027` | RN01–RN06, RN25, RN28 | validador | T1, T13+ | dados |
| Função de conteúdo (`server/`, `api/`) | entrega autenticada | nenhuma: já serve qualquer arquivo sob `private/content` | — | — | — | não (só valida, S46) |
| Supabase | banco com RLS | tabela `registros` (migration 0002), aplicada pelo autor no painel | D4 | — | T3.1 | sim (SQL) + ação externa com confirmação |
| GitHub Actions | CI e keepalive | nenhuma; o job `banco` passa a rodar a migration nova | — | — | — | não |
| Renomeação Letrume | corte paralelo | só valida: textos do preparatório usam o nome vigente; ambos mexem em `backup.ts` (o último a entrar ajusta) | — | — | — | não |

## Extensão 2026-11-11 — implementação

- **Função de conteúdo (`server/conteudo.js`): muda.** O plano previa só
  validar, mas a lista de arquivos permitidos aceitava apenas `areas.json` e
  `curriculum.json`. Agora aceita `concurso.json`, `discursiva.json`,
  `teoria/<disciplina>.json` e `questoes/<disciplina>.json`, só para subtemas
  do tipo concurso do manifesto (testes em `tests/core/conteudo-servidor.test.ts`).
- **Ferramentas do atlas (`AtlasTools.tsx`): mudam.** Exportar gera backup v4;
  importar e zerar também tratam os registros.
- **Testes e2e de diagramas:** passam a ignorar folhas do tipo concurso.
