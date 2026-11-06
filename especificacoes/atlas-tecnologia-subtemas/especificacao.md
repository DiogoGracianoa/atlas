# Especificação: subtemas e atlas de arquitetura e liderança técnica

Base: `visao.md` (RN01–RN10, AC01–AC12).

**Níveis de teste:**
- **unit:** Vitest em Node, para o núcleo e os scripts;
- **comp:** Vitest com jsdom, o app real e um roteador em memória;
- **e2e:** Playwright contra o build;
- **script:** `validate`.

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| S01 | RN01, AC01 | manifesto com `tecnologia` agrupando `arquitetura-lideranca-tecnica` (disponível) e um subtema planejado | `/atlas/tecnologia` | renderizar | título da área; cartão do subtema com link; planejado "em breve" sem link | — | comp |
| S02 | RN02, AC02 | idem | `/atlas/tecnologia/arquitetura-lideranca-tecnica`, `…/m1e1` | navegar | capa do subtema; tema m1e1 | — | comp + e2e |
| S03 | RN02, AC03 | idem | `/atlas/tecnologia/xyz`, `/atlas/tecnologia/{planejado}`, `…/arquitetura-lideranca-tecnica/zzz`, `/atlas/politica/m1e1/extra` | navegar | agrupador com aviso; agrupador com aviso; capa do subtema; capa de política | nunca exceção | comp |
| S04 | RN03, AC04, AC05 | — | marcar `def` em `…/m1e1` | `store.setMark` | chave `arquitetura-lideranca-tecnica/m1e1:def`; linha com `area = arquitetura-lideranca-tecnica`; política segue igual | — | comp + unit |
| S05 | RN04, AC06 | marcações e `totals` do subtema | `/atlas` | renderizar | cartão Tecnologia com o progresso somado dos subtemas | sem total: contagem | comp |
| S06 | RN05, AC07 | `lastAt = arquitetura-lideranca-tecnica/m2e3` | `/atlas` | renderizar | "Continuar" com `href = /atlas/tecnologia/arquitetura-lideranca-tecnica/m2e3` | — | comp |
| S07 | RN05, AC07 | — | seletor do menu | renderizar | `<optgroup label="Tecnologia">` com o subtema; escolher leva ao endereço completo | — | comp |
| S08 | RN05, AC08 | — | busca "Conway" em todas as áreas | buscar | grupo "Resultados em Arquitetura e liderança técnica" | — | comp |
| S09 | RN03, RN10, AC09 | fixtures | slug de subtema repetido (inclusive igual ao de uma área); agrupador com `arquivo`; agrupador disponível sem subtema disponível; subtema disponível sem campos | `validate` | código 1 com o erro | — | script |
| S10 | RN10, AC12 | manifesto de teste com um segundo subtema | — | navegar | o subtema aparece e navega | — | comp |
| S11 | RN06, RN07, RN08, AC10 | currículo real do subtema | — | teste de conteúdo | todo tema: ≥ 5 parágrafos (o menor com ≥ 250 caracteres), ≥ 6 conceitos, ≥ 3 teses, ≥ 2 debates, ≥ 3 perguntas, ≥ 1 vídeo, livro ou ponte; tradição ∈ {lideranca, engenharia, ia}; toda oficina com exercício ≥ 400 caracteres | — | unit |
| S12 | RN07 | manifesto | cores das trilhas | `tokens.test.ts` (já cobre todas as tradições) | ≥ 4,5:1 nos dois temas | — | unit |
| S13 | RN09 | currículo | URLs | `validate` + teste de conteúdo | só `https://books.google.com/books?q=` e `https://www.youtube.com/results?search_query=` | — | unit |
| S14 | técnico | `content.ts` | `area("arquitetura-lideranca-tecnica")`, `parentOf(...)`, `leaves()` | chamar | subtema encontrado pelo slug; pai = `tecnologia`; folhas = áreas e subtemas com currículo | — | unit |

## Matriz

| RN | AC | Cenários | Testes |
|---|---|---|---|
| RN01 | AC01 | S01 | `tests/ui/atlas/subtemas.test.tsx` |
| RN02 | AC02, AC03 | S02, S03 | `tests/ui/atlas/subtemas.test.tsx`, `e2e/routes.spec.ts` |
| RN03 | AC04, AC05 | S04, S09 | `subtemas.test.tsx`, `tests/scripts/validate.test.ts` |
| RN04 | AC06 | S05 | `subtemas.test.tsx` |
| RN05 | AC07, AC08 | S06–S08 | `subtemas.test.tsx` |
| RN06–RN08 | AC10 | S11, S12 | `tests/scripts/conteudo-tecnologia.test.ts`, `tests/ui/tokens.test.ts` |
| RN09 | AC09, AC11 | S13, S09 | `conteudo-tecnologia.test.ts`, `validate.test.ts` |
| RN10 | AC12 | S10, S14 | `subtemas.test.tsx`, `tests/core/content.test.ts` |

**Totais:** 10 RNs, 12 ACs e 14 cenários (1 técnico). Não há gaps. O AC11
(revisão do autor por leva) é verificado por pessoa, não por teste.
