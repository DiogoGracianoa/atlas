# Fluxo unificado para Codex e Claude

## Resultado esperado

Permitir que uma necessidade entre pelo comando `refinar` e percorra descoberta,
refinamento e planejamento sem novas invocações manuais, parando em um gate de
verificação e aprovação antes da implementação. Disponibilizar os mesmos
comandos no Codex e no Claude sem duplicar suas instruções canônicas.

## Escopo e não escopo

### Escopo

- Incorporar a descoberta ao fluxo iniciado por `refinar`.
- Acionar o planejamento automaticamente após um refinamento sem bloqueios.
- Tornar explícito o gate entre planejamento e implementação.
- Manter a prototipação disponível somente quando solicitada.
- Expor no Claude todos os comandos existentes no Codex.
- Manter uma única instrução canônica por comando.
- Adicionar `CLAUDE.md` sem duplicar as regras de `AGENTS.md`.

### Não escopo

- Remover comandos existentes.
- Publicar o framework ou alterar instalações externas do Codex ou Claude.
- Criar integração com ferramentas externas de gestão.
- Tornar prototipação automática para mudanças com interface.

## Regras de negócio

- RN01 (entrada obrigatória): uma tarefa de construção entra no fluxo
  obrigatório por `refinar`.
- RN02 (descoberta embutida): `refinar` executa primeiro a descoberta. A decisão
  **Construir** permite continuar; **Adiar** ou **Descartar** encerram o fluxo
  antes da visão e do planejamento.
- RN03 (refinamento): após **Construir**, `refinar` produz a visão funcional e
  interrompe o fluxo se existir pergunta bloqueante.
- RN04 (planejamento automático): uma visão pronta aciona `planejar`
  automaticamente, sem exigir nova invocação da pessoa usuária.
- RN05 (gate obrigatório): concluído o planejamento, o fluxo verifica visão,
  especificação, plano, tarefas, impacto, contratos aplicáveis,
  rastreabilidade, lacunas e comandos de validação. A implementação só pode
  começar depois de aprovação explícita.
- RN06 (prototipação sob demanda): `prototipar` não integra o fluxo
  obrigatório e somente é executado quando solicitado explicitamente.
- RN07 (comandos equivalentes): cada comando disponível no Codex também fica
  disponível no Claude com o mesmo nome e comportamento.
- RN08 (fonte única): a instrução completa de cada comando existe em um único
  arquivo canônico; integrações específicas apenas apontam para ele.
- RN09 (instruções compartilhadas): `CLAUDE.md` carrega `AGENTS.md` sem copiar
  seu conteúdo.
- RN10 (descoberta standalone): `descobrir` continua disponível isoladamente;
  no modo embutido, retorna a decisão ao `refinar` sem reinvocá-lo.

## Critérios de aceite

- AC01 — fluxo completo: Dado um detalhamento suficiente, quando `refinar` for
  acionado, então a descoberta decide **Construir**, a visão é criada, o
  planejamento é produzido automaticamente e o fluxo para no gate aguardando
  aprovação.
- AC02 — descoberta encerra trabalho: Dado que a descoberta decide **Adiar** ou
  **Descartar**, quando ela estiver embutida em `refinar`, então o fluxo termina
  sem criar planejamento.
- AC03 — bloqueio funcional: Dado que a visão possui pergunta bloqueante,
  quando o refinamento terminar, então o planejamento não é iniciado.
- AC04 — gate impede código: Dado que o planejamento foi concluído, quando não
  houver aprovação explícita, então `implementar` não é iniciado.
- AC05 — protótipo não automático: Dado qualquer tarefa com interface, quando
  `prototipar` não tiver sido solicitado, então nenhum protótipo é criado e sua
  ausência não bloqueia a implementação.
- AC06 — comandos no Claude: Dado o repositório instalado, quando o Claude
  descobrir skills de projeto, então os mesmos 11 nomes canônicos do Codex
  ficam disponíveis.
- AC07 — alteração em um lugar: Dado um comando existente, quando sua instrução
  canônica for alterada, então nenhum segundo corpo de instrução equivalente
  precisa ser atualizado para Codex ou Claude.
- AC08 — contexto do Claude: Dado o início de uma sessão Claude no repositório,
  quando `CLAUDE.md` for carregado, então as regras de `AGENTS.md` são
  importadas como fonte única.

## Exemplos e limites

- `refinar Detalhamento: ...` executa descoberta, visão e planejamento e termina
  apresentando a evidência do gate.
- Uma resposta **Adiar** durante a descoberta preserva seus artefatos e não cria
  `especificacao.md`, `plano.md` ou `tarefas.md`.
- Um pedido separado por protótipo pode executar `prototipar` antes ou depois do
  gate, sem torná-lo requisito para `implementar`.
- Adaptadores específicos podem repetir somente metadados mínimos de descoberta;
  o procedimento do comando não pode ser copiado para eles.

## Rastreabilidade

| RN | ACs | Situação |
|---|---|---|
| RN01 | AC01 | Coberta |
| RN02 | AC01, AC02 | Coberta |
| RN03 | AC01, AC03 | Coberta |
| RN04 | AC01 | Coberta |
| RN05 | AC01, AC04 | Coberta |
| RN06 | AC05 | Coberta |
| RN07 | AC06 | Coberta |
| RN08 | AC07 | Coberta |
| RN09 | AC08 | Coberta |
| RN10 | AC01, AC02 | Coberta |

## Projetos potencialmente impactados

- Raiz do Núcleo SDD: regras, documentação e validação estrutural.
- Skills canônicas em `.agents/skills/`.
- Adaptadores de comandos Claude em `.claude/skills/`.

## Perguntas em aberto

Nenhuma pergunta bloqueante.

## Gate de refinamento

**Pronta para planejar.** Há objetivo, escopo, regras, critérios,
rastreabilidade e nenhuma pergunta bloqueante.
