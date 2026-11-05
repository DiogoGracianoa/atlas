# Fluxo unificado para Codex e Claude — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** entregar o fluxo `refinar (descoberta → visão → planejamento) → gate
→ implementar → revisar` e disponibilizar o mesmo catálogo de comandos no
Codex e no Claude com instruções canônicas únicas.

**Architecture:** `.agents/skills/` permanece como fonte canônica. O Claude
recebe adaptadores finos em `.claude/skills/` e carrega as regras globais por
`CLAUDE.md`; o teste PowerShell impede divergência entre catálogos e fluxo.

**Tech Stack:** Markdown, Agent Skills, PowerShell 7 e Git.

**Spec:** `especificacoes/fluxo-unificado-codex-claude/visao.md`

## Global Constraints

- Exatamente 11 skills canônicas e 11 adaptadores Claude.
- Nenhum symlink: o checkout alvo inclui Windows com `core.symlinks=false`.
- Uma única instrução completa por comando, em `.agents/skills/{nome}/SKILL.md`.
- `prototipar` somente mediante solicitação explícita.
- `implementar` somente após gate verificado e aprovação explícita.
- Nenhuma publicação, instalação externa, push ou mudança de serviço.

## Review Focus

- Decisão **Adiar** ou **Descartar** na descoberta embutida deve encerrar sem
  visão ou plano; exercitada na Task 2 por cenário comportamental.
- Pergunta bloqueante deve impedir o planejamento automático; exercitada na
  Task 2 por cenário comportamental.
- Interface no escopo não autoriza prototipação implícita; exercitada nas Tasks
  1 e 2.
- Aprovação não pode ser inferida de artefatos completos; exercitada na Task 2.
- Novo comando canônico sem adaptador Claude deve falhar na validação;
  exercitada na Task 1.

---

### Task 1: Fixar o contrato estrutural em teste

**Files:**

- Modify: `tests/validar-nucleo-sdd.ps1`
- Test: `tests/validar-nucleo-sdd.ps1`

**Interfaces:**

- Consumes: catálogo canônico em `.agents/skills/` e regras RN05–RN09.
- Produces: validação de `CLAUDE.md`, catálogo `.claude/skills/`, paridade de
  nomes, apontamentos canônicos e invariantes do fluxo.

- [x] **Step 1: adicionar asserções CT05–CT08 ao script**

  O teste deve exigir `CLAUDE.md` com `@AGENTS.md`, 11 diretórios Claude com
  nomes idênticos aos canônicos, um adaptador curto apontando para
  `.agents/skills/{nome}/SKILL.md`, prototipação fora do fluxo e as marcas de
  descoberta embutida, planejamento automático e gate.

- [x] **Step 2: executar o teste RED**

  Run: `pwsh -NoProfile -File tests/validar-nucleo-sdd.ps1`

  Expected: `FAIL` por `CLAUDE.md` ou `.claude/skills` ausente, não por erro de
  sintaxe PowerShell.

- [x] **Step 3: preservar o teste vermelho para orientar as Tasks 2 e 3**

  Condição de término: a falha observada corresponde a uma capacidade ausente
  da especificação.

### Task 2: Atualizar o fluxo canônico e a política de protótipo

**Files:**

- Modify: `AGENTS.md`
- Modify: `.agents/skills/descobrir/SKILL.md`
- Modify: `.agents/skills/refinar/SKILL.md`
- Modify: `.agents/skills/planejar/SKILL.md`
- Modify: `.agents/skills/prototipar/SKILL.md`
- Create: `.agents/skills/prototipar/agents/openai.yaml`
- Test: cenários comportamentais CT01–CT05 e teste estrutural da Task 1.

**Interfaces:**

- Consumes: decisões **Construir**, **Adiar**, **Descartar** e artefatos definidos
  na visão.
- Produces: modos standalone/embutido de `descobrir`, orquestração automática em
  `refinar`, gate final em `planejar` e invocação explícita de `prototipar`.

- [x] **Step 1: executar cenários sem a nova orientação e registrar o RED**

  Usar contextos isolados para: necessidade pronta, decisão **Adiar**, pergunta
  bloqueante, tarefa de UI sem pedido de protótipo e plano completo sem
  aprovação. Registrar se o agente para ou avança e a justificativa observada.

- [x] **Step 2: alterar minimamente as quatro skills e `AGENTS.md`**

  Implementar os contratos descritos em `plano.md`, mantendo frontmatter
  discriminante. Configurar `allow_implicit_invocation: false` apenas para
  `prototipar` no Codex.

- [x] **Step 3: repetir os cenários e verificar GREEN**

  Expected: descoberta retorna sem recursão; bloqueios param; planejamento
  ocorre automaticamente somente após visão pronta; gate sempre aguarda
  aprovação; protótipo nunca é inferido.

- [x] **Step 4: executar a validação estrutural parcial**

  Run: `pwsh -NoProfile -File tests/validar-nucleo-sdd.ps1`

  Expected: asserções de fluxo passam; teste ainda falha somente pela integração
  Claude ausente.

### Task 3: Adicionar a integração Claude sem duplicar instruções

**Files:**

- Create: `CLAUDE.md`
- Create: `.claude/skills/{nome}/SKILL.md` para os 11 nomes canônicos.
- Test: `tests/validar-nucleo-sdd.ps1`

**Interfaces:**

- Consumes: `AGENTS.md` e `.agents/skills/{nome}/SKILL.md`.
- Produces: contexto compartilhado Claude e comandos `/nome` que mandam ler e
  seguir integralmente a fonte canônica.

- [x] **Step 1: criar `CLAUDE.md` como importação única**

  Conteúdo funcional: `@AGENTS.md`, sem copiar regras globais.

- [x] **Step 2: criar os 11 adaptadores Claude**

  Cada adaptador tem `name`, descrição curta de roteamento e instrução para ler
  `../../../.agents/skills/{nome}/SKILL.md` por inteiro antes de agir. Somente
  `prototipar` recebe `disable-model-invocation: true`.

- [x] **Step 3: executar o teste GREEN**

  Run: `pwsh -NoProfile -File tests/validar-nucleo-sdd.ps1`

  Expected: `PASS`, com mensagem de 11 skills canônicas e 11 comandos Claude.

### Task 4: Sincronizar documentação e fechar a verificação

**Files:**

- Modify: `README.md`
- Modify: `GUIA-DE-USO.md`
- Modify: `docs/guia-de-artefatos.md`
- Update: `especificacoes/fluxo-unificado-codex-claude/especificacao.md`
- Create: `especificacoes/fluxo-unificado-codex-claude/revisao.md`
- Test: todos os cenários CT01–CT08.

**Interfaces:**

- Consumes: fluxo e catálogos implementados nas Tasks 2 e 3.
- Produces: orientação de instalação/uso e evidência final rastreável.

- [x] **Step 1: atualizar instalação e fluxo nos guias**

  Documentar cópia de `AGENTS.md`, `CLAUDE.md`, `.agents/skills/`,
  `.claude/skills/` e `docs/`; mostrar o fluxo novo e `prototipar` como comando
  independente sob demanda.

- [x] **Step 2: procurar resíduos do fluxo antigo**

  Run: `rg -n -uu "prototipar.*implementar|descobrir \(opcional\).*refinar.*planejar" AGENTS.md README.md GUIA-DE-USO.md .agents docs`

  Expected: nenhum resultado que apresente essas sequências como fluxo vigente.

- [x] **Step 3: executar todas as verificações**

  Run: `pwsh -NoProfile -File tests/validar-nucleo-sdd.ps1`

  Expected: `PASS`.

  Run: `git diff --check`

  Expected: código de saída `0`, sem erro de whitespace.

- [x] **Step 4: sincronizar matriz e registrar revisão**

  Relacionar CT01–CT08 à evidência executada, declarar lacunas e emitir
  veredito conforme a skill `revisar`.

  Condição de término: documentação, skills, adaptadores, testes e artefatos
  descrevem o mesmo fluxo, sem verificação disponível omitida.
