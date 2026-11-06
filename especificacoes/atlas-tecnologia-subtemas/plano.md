# Plano: subtemas e atlas de arquitetura e liderança técnica

Ramo: `feat/portal-react`, que é onde está a versão React; ainda não está no
`main`.

## Decisões

| # | Decisão | Alternativas | Escolha | Gatilho de revisão |
|---|---|---|---|---|
| D1 | Onde ficam os subtemas | arquivo de manifesto por área; pasta com convenção | campo `subtemas` na entrada da área em `areas.json` (K1 v2). Uma só fonte de verdade, lida de uma vez | manifesto grande demais para uma requisição |
| D2 | Chave do progresso | `tecnologia/arquitetura-lideranca-tecnica/m1e1` (3 partes) | `arquitetura-lideranca-tecnica/m1e1` (slug do subtema, globalmente único). Store, fila, sincronização e banco não mudam (a regex `área/id` continua valendo) | subtemas com o mesmo nome em áreas diferentes; aí seria preciso um prefixo |
| D3 | Rotas | rota própria do subtema fora do atlas | a mesma árvore `/atlas/:a/:b?/:c?`, interpretada pelo manifesto: na área agrupadora, `b` é o subtema e `c` o item; nas outras, `b` é o item | — |
| D4 | Produção do texto (cerca de 85 temas) | escrever tudo em sequência | em cada leva, um subagente por módulo escreve o JSON do módulo, seguindo um guia de estilo e o módulo 8 de política como referência; eu edito, valido e reviso a coerência entre os módulos antes do commit | queda de qualidade numa leva: reescrever os temas apontados |

## Módulos e responsabilidades

| Módulo | Mudança |
|---|---|
| `src/core/types.ts` | `AreaMeta.subtemas?: AreaMeta[]` |
| `src/core/content.ts` | `leaves()` (áreas e subtemas com currículo), `area(slug)` e `isAvailable(slug)` também para subtemas, `parentOf(slug)` |
| `src/sections/atlas/paths.ts` (novo) | `areaPath(slug)` e `itemPath(key)` com o prefixo do agrupador |
| `AtlasLayout.tsx` | resolve `:a/:b/:c` com as regras da RN02; agrupador sem subtema renderiza a página `Grupo` |
| `pages/Grupo.tsx` (novo) | lista de subtemas |
| `pages/Mapa.tsx` | cartão do agrupador com progresso somado; "Continuar" com caminho completo |
| `components/AtlasNav.tsx` | `optgroup`, busca em todas as folhas, lista de áreas com subtemas |
| `model.ts`, `parts.tsx`, `Capa.tsx` | links via `itemPath` / `areaPath` |
| `scripts/validate.mjs` | regras dos agrupadores e unicidade global |
| `public/content/areas.json` | Tecnologia agrupadora, com o subtema e três trilhas |
| `public/content/arquitetura-lideranca-tecnica/curriculum.json` | conteúdo, por levas |
| `docs/conteudo.md` | formato com subtemas; tabela de áreas |

## Ordem

1. **T1 (estrutura).** Testes S01–S10 e S14 em vermelho, depois a
   implementação. Entram o manifesto com o subtema e um currículo inicial com
   a leva 1.
2. **T2 (leva 1):** Liderança técnica, m1–m3, cerca de 30 temas e 3 oficinas.
   Inclui o teste de conteúdo (S11, S13) e o `validate`. Commit e **revisão do
   autor**.
3. **T3 (leva 2):** Engenharia e arquitetura, m4–m6. Commit e revisão.
4. **T4 (leva 3):** IA aplicada e SDD, m7–m9, com a oficina final do plano de
   12 meses. Commit e revisão.
5. **T5:** `docs/conteudo.md`, capturas e README (lista de áreas); suíte
   completa.

## Validação disponível

`npm run typecheck`, `npm run lint`, `npm test`, `npm run validate`,
`npm run build`, `npm run size`, `npm run e2e` e o CI do ramo.

## Riscos

| Risco | Mitigação |
|---|---|
| Texto raso ou repetitivo entre módulos | o teste de conteúdo garante os mínimos; o guia de estilo pede explicação autossuficiente; revisão do autor por leva |
| Afirmações técnicas imprecisas | escrever sobre o que é consolidado; indicar quando um número ou prática é contestado (bloco de debate); revisão por leva |
| Cópia do guia | o guia dá só tópico e direção; os subagentes recebem o tópico e a dica, não o texto para parafrasear, e o texto é escrito do zero |
| Quebrar política | teste explícito S03/S04 e a suíte atual |
| JSON grande (cerca de 85 temas, ~300 KB) | já é carregado sob demanda e fica fora do precache, então não afeta a primeira tela |
