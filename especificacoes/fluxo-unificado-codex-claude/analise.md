# Análise — fluxo unificado para Codex e Claude

## Evidências observadas

| Tema | Evidência | Estado atual | Divergência desejada |
|---|---|---|---|
| Fluxo principal | `AGENTS.md`, `README.md` e `GUIA-DE-USO.md` | Exibem `descobrir` como opcional, `planejar` como invocação separada e `prototipar` no caminho principal. | `refinar` deve incorporar descoberta e planejamento; somente prototipação fica fora do fluxo obrigatório. |
| Orquestração | `.agents/skills/refinar/SKILL.md` | Termina declarando **Pronta para planejar** e exige nova invocação. | Continuar automaticamente para planejamento quando não houver bloqueio. |
| Descoberta | `.agents/skills/descobrir/SKILL.md` | A decisão **Construir** libera `refinar`. | Suportar retorno ao refinamento chamador sem criar ciclo de invocação. |
| Protótipo | `.agents/skills/prototipar/SKILL.md` | Manda avaliar toda mudança e registrar dispensa quando não houver interface. | Executar somente por pedido explícito; ausência não gera tarefa nem bloqueio. |
| Skills Codex | `.agents/skills/*/SKILL.md` | Existem 11 skills canônicas, todas validadas por `tests/validar-nucleo-sdd.ps1`. | Preservar nomes e instruções como fonte única. |
| Claude | árvore versionada do repositório | Não existem `CLAUDE.md` ou `.claude/skills/`. | Adicionar contexto e os 11 comandos equivalentes. |
| Portabilidade | `git config --get core.symlinks` | Retorna `false` neste checkout Windows. | Evitar symlinks versionados como mecanismo obrigatório. |
| Validação | `tests/validar-nucleo-sdd.ps1` | Confere somente `AGENTS.md` e `.agents/skills/`; baseline passa com 11 skills. | Conferir fluxo, contexto Claude, paridade de nomes e apontamento para fonte canônica. |
| Contexto SDD | raiz do repositório | Não existe `.sdd/`; somente documentação e código do próprio framework estão disponíveis. | Usar as evidências locais sem inventar stack ou decisões ausentes. |

## Dependências e limites

- Codex descobre as skills existentes em `.agents/skills/`; mover esses arquivos
  criaria migração desnecessária.
- Claude Code descobre skills de projeto em `.claude/skills/{nome}/SKILL.md` e
  permite invocá-las como `/nome`.
- Claude Code aceita `@AGENTS.md` em `CLAUDE.md`; essa importação é mais
  portável que symlink no Windows.
- Um adaptador Claude precisa conter apenas metadados mínimos e uma instrução
  inequívoca para ler integralmente a skill canônica correspondente.
- Não há aplicação, persistência, concorrência, dado pessoal ou autorização
  externa afetados por esta mudança.

## Direção técnica recomendada

1. Preservar `.agents/skills/{nome}/SKILL.md` como fonte canônica.
2. Criar `.claude/skills/{nome}/SKILL.md` como adaptador fino para o arquivo
   canônico, sem copiar seu procedimento.
3. Criar `CLAUDE.md` com a importação `@AGENTS.md`.
4. Atualizar as skills `descobrir`, `refinar`, `planejar` e `prototipar` para
   representar a nova orquestração e seu gate.
5. Atualizar documentação e validação estrutural com os mesmos invariantes.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação | Decisão necessária |
|---|---|---|---|---|
| Recursão `refinar` ↔ `descobrir` | Média | Alto | Declarar modos embutido e standalone; no modo embutido, descoberta retorna decisão ao chamador. | Confirmada na visão por RN10. |
| Claude não carregar a instrução canônica | Baixa | Alto | Adaptador manda ler o caminho relativo completo e teste verifica existência e correspondência. | Nenhuma. |
| Divergência futura entre catálogos | Média | Médio | Teste compara os nomes de `.agents/skills` e `.claude/skills`. | Nenhuma. |
| Gate ser confundido com teste automatizado apenas | Média | Alto | Definir gate como verificação de evidências mais aprovação humana explícita. | Confirmada por RN05 e AC04. |
| Protótipo voltar a ser inferido por presença de UI | Média | Médio | Skill `prototipar` declara gatilho exclusivamente explícito e teste cobre ausência no fluxo. | Nenhuma. |

## Perguntas

Não há pergunta técnica ou de negócio pendente para planejamento.
