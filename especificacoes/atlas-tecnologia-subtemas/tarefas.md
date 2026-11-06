# Tarefas

Cada tarefa segue a sequência: teste vermelho, mudança mínima, teste verde e
suíte.

| Tarefa | Cenários | Arquivos | Teste primeiro | Termina quando |
|---|---|---|---|---|
| T1.1 | S14 | `src/core/{types,content}.ts` | `tests/core/content.test.ts`: `leaves`, `area`, `parentOf` | verde |
| T1.2 | S09 | `scripts/validate.mjs` | `tests/scripts/validate.test.ts` (4 fixtures) | verde |
| T1.3 | S01–S08, S10 | `src/sections/atlas/{paths.ts,AtlasLayout.tsx,pages/Grupo.tsx,pages/Mapa.tsx,components/AtlasNav.tsx,…}` | `tests/ui/atlas/subtemas.test.tsx` | verde; suíte de UI e e2e verdes |
| T1.4 | — | `public/content/areas.json` | `validate`, `tokens.test.ts` (cores das trilhas) | verde |
| T2 | S11, S13 | `public/content/arquitetura-lideranca-tecnica/curriculum.json` (m1–m3) | `tests/scripts/conteudo-tecnologia.test.ts` | verde + revisão do autor |
| T3 | S11, S13 | idem (m4–m6) | idem | verde + revisão do autor |
| T4 | S11, S13 | idem (m7–m9) | idem | verde + revisão do autor |
| T5 | — | `docs/conteudo.md`, `README.md`, `docs/img/` | `tests/docs.test.ts` | verde |

## Registro de execução

(preenchido durante a implementação)
