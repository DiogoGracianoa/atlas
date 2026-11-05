# Plano técnico — fluxo unificado para Codex e Claude

## Objetivos técnicos

- Tornar `refinar` o orquestrador explícito de descoberta, visão e planejamento.
- Impedir recursão entre `descobrir` e `refinar`.
- Formalizar o gate de verificação e aprovação antes de `implementar`.
- Remover `prototipar` do caminho automático.
- Expor no Claude o catálogo Codex com adaptadores finos e verificáveis.

## Estrutura e responsabilidades

| Arquivo ou módulo | Responsabilidade |
|---|---|
| `AGENTS.md` | Contrato global e fluxo obrigatório. |
| `.agents/skills/descobrir/SKILL.md` | Descoberta standalone ou embutida, com retorno sem recursão. |
| `.agents/skills/refinar/SKILL.md` | Orquestrar descoberta, visão, planejamento e parada no gate. |
| `.agents/skills/planejar/SKILL.md` | Produzir artefatos, verificar o gate e aguardar aprovação. |
| `.agents/skills/prototipar/SKILL.md` | Executar prototipação apenas sob pedido explícito. |
| `.agents/skills/prototipar/agents/openai.yaml` | Impedir invocação implícita de `prototipar` no Codex. |
| `.claude/skills/{nome}/SKILL.md` | Expor `/nome` e encaminhar para a skill canônica. |
| `CLAUDE.md` | Importar `AGENTS.md` como regra compartilhada. |
| `README.md` e `GUIA-DE-USO.md` | Instalação e uso nos dois clientes. |
| `docs/guia-de-artefatos.md` | Registrar descoberta embutida, gate e protótipo opcional. |
| `tests/validar-nucleo-sdd.ps1` | Fixar invariantes estruturais e de compatibilidade. |

## Contratos internos

- Modo standalone de `descobrir`: registra **Construir**, **Adiar** ou
  **Descartar** e orienta a entrada por `refinar` quando aplicável.
- Modo embutido de `descobrir`: devolve a decisão ao `refinar`; não invoca
  nenhuma skill subsequente.
- `refinar`: só aplica `planejar` depois de **Construir** e de um gate funcional
  sem perguntas bloqueantes.
- `planejar`: termina no gate de implementação e exige aprovação humana
  explícita; nunca chama `implementar` automaticamente.
- Adaptador Claude: nome igual ao diretório, frontmatter válido, corpo curto e
  referência ao caminho canônico correspondente.
- `CLAUDE.md`: importa `@AGENTS.md`; não replica o contrato global.

Não existe fronteira de execução entre serviços ou componentes; por isso
`contratos.md` não é necessário.

## Ordem de implementação

1. Ampliar o teste estrutural e observar falha por ausência do novo fluxo e da
   integração Claude.
2. Atualizar regras e quatro skills canônicas; validar o comportamento textual
   com cenários de pressão antes e depois da mudança.
3. Criar `CLAUDE.md`, política Codex de prototipação e adaptadores Claude.
4. Atualizar documentação de instalação, fluxo e artefatos.
5. Executar teste estrutural, busca de divergências, validação das skills e
   revisão final contra a matriz CT01–CT08.

## Validações

```powershell
pwsh -NoProfile -File tests/validar-nucleo-sdd.ps1
```

Resultado esperado: código de saída `0`, 11 skills canônicas, 11 adaptadores
Claude, paridade de nomes, caminhos canônicos válidos e fluxo atualizado.

Também executar:

```powershell
rg -n -uu "prototipar.*implementar|descobrir \(opcional\).*refinar.*planejar" AGENTS.md README.md GUIA-DE-USO.md .agents docs
git diff --check
```

Resultado esperado: a busca não encontra o fluxo antigo e `git diff --check`
não relata erro.

## Riscos e controles

| Risco | Controle |
|---|---|
| Recursão entre skills | Modos standalone/embutido explícitos e cenário CT02. |
| Planejamento pular o gate | `planejar` termina obrigatoriamente aguardando aprovação; CT04. |
| Protótipo implícito | Texto canônico, política Codex, metadado Claude e CT05. |
| Catálogos divergirem | Comparação automatizada de nomes; CT06. |
| Instrução duplicada | Limite estrutural dos adaptadores e CT07. |
| Compatibilidade Windows | Importação e adaptadores em arquivos regulares; nenhum symlink. |

## Gate de implementação

- Visão: pronta, sem pergunta bloqueante.
- Especificação: 10 RNs, 8 ACs e 8 cenários.
- Cobertura: todas as RNs e ACs ligadas a cenário e teste planejado.
- Impacto: cinco superfícies locais identificadas; nenhum projeto externo.
- Contratos externos: não aplicáveis.
- Comando de validação: observado e executável no baseline.
- Gaps conhecidos: nenhum.
- Status: aguardando aprovação explícita para implementar.
