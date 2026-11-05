# Especificação — fluxo unificado para Codex e Claude

## Cenários

### CT01 — Refinar orquestra o fluxo até o gate

- Origem: RN01, RN02, RN03, RN04, RN05; AC01.
- Pré-condição: detalhamento de uma necessidade fornecido a `refinar`.
- Entrada: texto livre com fatos, restrições e resultado desejado.
- Ação: executar descoberta em modo embutido; diante de **Construir**,
  produzir a visão; sem pergunta bloqueante, aplicar o planejamento.
- Resultado: artefatos de descoberta, visão e planejamento produzidos; gate de
  verificação apresentado; nenhuma implementação iniciada.
- Falha esperada: ausência de evidência para **Construir** ou pergunta
  bloqueante interrompe o fluxo na fase correspondente.
- Efeito colateral: cria ou atualiza artefatos em `.discovery/{slug}/` e
  `especificacoes/{slug}/`.
- Nível de teste: estrutural e inspeção comportamental da skill.

### CT02 — Descoberta embutida encerra decisões negativas

- Origem: RN02, RN10; AC02.
- Pré-condição: descoberta executada por `refinar`.
- Entrada: evidência que leva a **Adiar** ou **Descartar**.
- Ação: registrar a decisão e retornar ao chamador.
- Resultado: fluxo encerrado sem visão nem planejamento e sem reinvocar
  `refinar`.
- Falha esperada: iniciar refinamento ou produzir plano após decisão diferente
  de **Construir**.
- Efeito colateral: preserva somente os artefatos de descoberta.
- Nível de teste: inspeção comportamental da skill.

### CT03 — Pergunta funcional bloqueia planejamento

- Origem: RN03; AC03.
- Pré-condição: descoberta decidiu **Construir**.
- Entrada: necessidade com regra, estado ou resultado ambíguo.
- Ação: registrar pergunta bloqueante em `visao.md`.
- Resultado: estado **Em esclarecimento**, sem aplicar `planejar`.
- Falha esperada: inventar regra ou criar plano dependente da resposta.
- Efeito colateral: atualiza somente a visão e seus registros de pergunta.
- Nível de teste: inspeção comportamental da skill.

### CT04 — Gate exige evidência e aprovação

- Origem: RN05; AC04.
- Pré-condição: artefatos de planejamento produzidos.
- Entrada: visão, especificação, plano, tarefas, impacto, contratos
  aplicáveis, matriz de cobertura, gaps e comandos de validação.
- Ação: verificar completude, consistência e bloqueios; apresentar o resumo e
  solicitar aprovação explícita.
- Resultado: `implementar` permanece bloqueado até a aprovação.
- Falha esperada: tratar sucesso de teste estrutural ou ausência de gaps como
  autorização implícita.
- Efeito colateral: nenhum código alterado pelo gate.
- Nível de teste: estrutural e inspeção comportamental da skill.

### CT05 — Prototipar somente sob solicitação

- Origem: RN06; AC05.
- Pré-condição: tarefa com ou sem interface.
- Entrada: fluxo normal sem pedido explícito de prototipação.
- Ação: prosseguir sem executar `prototipar` e sem registrar dispensa.
- Resultado: ausência de protótipo não bloqueia o gate nem a implementação.
- Falha esperada: inferir prototipação a partir da existência de interface.
- Efeito colateral: nenhum arquivo em `prototipo/`.
- Nível de teste: estrutural e inspeção comportamental da skill.

### CT06 — Catálogos Codex e Claude têm paridade

- Origem: RN07; AC06.
- Pré-condição: checkout completo do framework.
- Entrada: diretórios `.agents/skills/` e `.claude/skills/`.
- Ação: enumerar nomes de skill nos dois catálogos.
- Resultado: ambos contêm exatamente os mesmos 11 nomes.
- Falha esperada: nome ausente, excedente ou divergente.
- Efeito colateral: nenhum.
- Nível de teste: teste PowerShell automatizado.

### CT07 — Adaptador Claude aponta para a fonte canônica

- Origem: RN08; AC07.
- Pré-condição: skill canônica existente em `.agents/skills/{nome}/SKILL.md`.
- Entrada: adaptador `.claude/skills/{nome}/SKILL.md`.
- Ação: validar frontmatter, caminho relativo e ausência de procedimento
  duplicado.
- Resultado: adaptador instrui a leitura integral do único arquivo canônico.
- Falha esperada: caminho inexistente, nome divergente ou corpo canônico copiado.
- Efeito colateral: nenhum.
- Nível de teste: teste PowerShell automatizado.

### CT08 — Claude importa as regras compartilhadas

- Origem: RN09; AC08.
- Pré-condição: `AGENTS.md` presente na raiz.
- Entrada: `CLAUDE.md`.
- Ação: validar a importação `@AGENTS.md`.
- Resultado: Claude recebe as mesmas regras sem cópia do conteúdo.
- Falha esperada: ausência da importação ou duplicação das regras.
- Efeito colateral: nenhum.
- Nível de teste: teste PowerShell automatizado.

## Matriz de cobertura

| RN | AC | Cenário | Teste |
|---|---|---|---|
| RN01 | AC01 | CT01 | inspeção da skill `refinar`; validação estrutural |
| RN02 | AC01, AC02 | CT01, CT02 | inspeção das skills `refinar` e `descobrir` |
| RN03 | AC01, AC03 | CT01, CT03 | inspeção da skill `refinar` |
| RN04 | AC01 | CT01 | inspeção da skill `refinar` |
| RN05 | AC01, AC04 | CT01, CT04 | inspeção da skill `planejar`; validação estrutural |
| RN06 | AC05 | CT05 | inspeção da skill `prototipar`; validação estrutural |
| RN07 | AC06 | CT06 | `tests/validar-nucleo-sdd.ps1` |
| RN08 | AC07 | CT07 | `tests/validar-nucleo-sdd.ps1` |
| RN09 | AC08 | CT08 | `tests/validar-nucleo-sdd.ps1` |
| RN10 | AC01, AC02 | CT01, CT02 | inspeção das skills `refinar` e `descobrir` |

Não há gap de cobertura conhecido antes da implementação.
