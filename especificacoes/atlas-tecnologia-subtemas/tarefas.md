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

### T1, estrutura (2026-11-06)

- **T1.1:** `content.ts` ganhou `leaves`, `area` (também para subtemas),
  `parentOf` e `isGroup`. O teste S14 falhou primeiro e depois passou.
- **T1.2:** o `validate` passou a aceitar agrupadores, com slug único em todo o
  manifesto. Os 5 testes novos (S09) falharam primeiro e depois passaram.
- **T1.3:**
  - `paths.ts`: `areaPath` e `itemPath` com o prefixo do agrupador;
  - `AtlasLayout`: resolve `:a/:b/:c` pela KR1 v1.2 e expõe a vista, o
    agrupador, o item e os caminhos no contexto;
  - página `Grupo`;
  - no mapa, progresso somado e "Continuar" com o endereço completo;
  - no menu, `optgroup`, subtemas aninhados e busca em todas as folhas;
  - `tests/ui/atlas/subtemas.test.tsx`: 11 testes (S01–S08, S10), que falharam
    primeiro e depois passaram.
- **T1.4:**
  - no manifesto, Tecnologia virou agrupador, com o subtema e as trilhas
    `lideranca` (#9A3D12 / #F0A47A), `engenharia` (#1E5F86 / #8CC4E8) e
    `ia` (#5B3FA0 / #B9A4F0);
  - todas as cores passam AA nos dois temas (`tokens.test.ts`);
  - `public/content/tecnologia/.gitkeep` foi removido, porque o agrupador não
    tem currículo.

### T2, leva 1: Liderança técnica (2026-11-06)

- **Produção:** os módulos m1 (9 temas), m2 (10) e m3 (9) foram escritos por
  três subagentes em paralelo, cada um com
  `GUIA-DE-ESTILO.md`, um briefing por módulo e a biblioteca do guia.
- **Revisão:** amostra lida (m1e4, por exemplo) e atribuições conferidas,
  entre elas:
  - Bacchelli e Bird (2013);
  - Nygard e os ADRs (2011);
  - Paul Graham (2009);
  - Oncken e Wass;
  - Bezos e as portas de mão única;
  - Larson e Reilly;
  - Brooks, que deu o nome à Lei de Conway;
  - a manobra inversa (ThoughtWorks);
  - Allspaw e Dekker.
- **Números:** definições de cerca de 850 a 980 palavras por tema.
- **Oficinas:**
  - m1of incorpora o método de estudo;
  - m3of incorpora as armadilhas do caminho.
- **Livros que cobrem o tema só em parte**, com o próprio texto de leitura
  avisando:
  - m2e1 (Marquet, para liderança situacional);
  - m2e5 (Peopleware, para contratação);
  - m2e9 (Adzic, para facilitação).
- **`tests/scripts/conteudo-tecnologia.test.ts`:** 31 verificações (S11, S13)
  passando.
- **Comandos executados:**
  - `npm run validate`: 2 áreas;
  - `npx vitest run`: 319/319;
  - `npx playwright test`: 34/34, incluindo o subtema no build;
  - `npm run size`: 119,6 KB;
  - `tsc` e `eslint`: limpos.
- **Pendente:** revisão do autor antes da leva 2 (AC11).
