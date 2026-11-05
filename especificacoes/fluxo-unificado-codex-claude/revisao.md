# Revisão — fluxo unificado para Codex e Claude

## Veredito

**Aprovada com lacunas.** Os cenários CT01–CT08 estão cobertos pelas
instruções, pelos testes estruturais e pelas avaliações comportamentais
executadas. Não houve teste de descoberta real em uma instalação Claude CLI e o
validador auxiliar `quick_validate.py` não pôde executar por falta de PyYAML.

## Evidência por cenário

| Cenário | Teste | Código ou artefato | Evidência | Resultado |
|---|---|---|---|---|
| CT01 | Avaliação isolada de `refinar` | `.agents/skills/refinar/SKILL.md` | Sequência descoberta → visão → planejamento → gate observada sem nova invocação manual. | Passou |
| CT02 | Avaliação isolada de `descobrir` | `.agents/skills/descobrir/SKILL.md` | **Adiar** encerrou o fluxo; modo embutido retornou ao chamador sem recursão. | Passou |
| CT03 | Avaliação isolada de `refinar` | `.agents/skills/refinar/SKILL.md` | Pergunta bloqueante produziu **Em esclarecimento** e impediu planejamento. | Passou |
| CT04 | Avaliação isolada de `planejar` | `.agents/skills/planejar/SKILL.md` | Plano completo, testes verdes e zero gaps não substituíram aprovação humana explícita. | Passou |
| CT05 | Avaliação isolada e política | `.agents/skills/prototipar/` e adaptador Claude | UI sem pedido não executou protótipo, não registrou dispensa e não bloqueou implementação. | Passou |
| CT06 | Teste PowerShell | `tests/validar-nucleo-sdd.ps1` | Catálogos comparados com exatamente 11 nomes em cada cliente. | Passou |
| CT07 | Teste PowerShell e avaliação de adaptadores | `.claude/skills/*/SKILL.md` | Caminho canônico, limite de tamanho, frontmatter delimitado, `name`, `description` e política explícita verificados. | Passou |
| CT08 | Teste PowerShell | `CLAUDE.md` | Conteúdo restrito a `@AGENTS.md`. | Passou |

## Comandos executados

| Comando | Código de saída | Resultado |
|---|---:|---|
| `pwsh -NoProfile -File tests/validar-nucleo-sdd.ps1` no baseline | 0 | 11 skills canônicas existentes válidas. |
| `pwsh -NoProfile -File tests/validar-nucleo-sdd.ps1` após escrever CT05–CT08 | 1 | RED esperado no fluxo antigo de `AGENTS.md`. |
| Mesmo comando após fluxo canônico | 1 | RED parcial esperado: `CLAUDE.md ausente`. |
| Mesmo comando após adaptadores | 0 | 11 skills canônicas e 11 comandos Claude validados. |
| Mesmo comando com parser ainda ausente | 1 | RED esperado: `Get-SkillFrontmatter` inexistente. |
| Mesmo comando após parser | 0 | GREEN, inclusive casos negativos de frontmatter. |
| `rg -n -uu "prototipar.*implementar\|descobrir \(opcional\).*refinar.*planejar" ...` | 1 | Nenhum fluxo antigo encontrado. |
| `git diff --check` | 0 | Nenhum erro de whitespace; apenas avisos de conversão LF/CRLF do Git. |
| `quick_validate.py` nas skills | 1 | Não executado: runtime Python disponível sem módulo `yaml`. |

## Achados

| Achado | Severidade | Evidência | Consequência | Correção | Teste de confirmação |
|---|---|---|---|---|---|
| Validação aceitava metadado Claude fora do frontmatter | Importante | Revisor removeu delimitadores em memória e a suíte anterior ainda passou. | Uma regressão poderia tornar `prototipar` implícito sem falha de teste. | Criado parser do bloco inicial e checks restritos ao frontmatter. | RED por função ausente; GREEN com casos inválidos rejeitados e suíte completa. |
| `quick_validate.py` indisponível | Lacuna | `ModuleNotFoundError: No module named 'yaml'`. | Validador auxiliar não forneceu segunda evidência. | Mantida validação estrutural PowerShell do projeto; nenhuma dependência instalada fora do escopo. | Suíte do projeto e checagem dos 11 frontmatters passaram. |
| Claude CLI não exercitado | Lacuna | Nenhuma sessão Claude CLI disponível na execução. | Descoberta e invocação nativas não foram comprovadas ponta a ponta. | Validar `/refinar` e `/prototipar` em um checkout consumidor quando o Claude estiver disponível. | Pendente. |

## Riscos aplicáveis

- Entrada e permissões: não há nova superfície de dados ou autorização.
- Dados sensíveis e logs: não aplicáveis; somente instruções locais.
- Concorrência, reprocessamento, migração e integração externa: não
  aplicáveis à alteração.
- Compatibilidade: arquivos regulares e caminhos relativos substituem symlinks,
  preservando checkouts Windows com `core.symlinks=false`.

## Decisão

Entregar as alterações sem commit nem push, conforme solicitado. As lacunas
de ferramenta não invalidam os testes estruturais e comportamentais executados,
mas permanecem declaradas para uma validação futura em Claude CLI.
