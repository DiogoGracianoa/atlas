# Núcleo SDD

Use `$nome-da-skill` quando o pedido corresponder a um fluxo especializado. O Núcleo recebe requisitos como texto livre e transforma conversas em especificações verificáveis, sem depender de referências externas.

## Regras de trabalho

- Crie artefatos de solução em `especificacoes/{slug}/`, com `slug` legível derivado do título informado.
- Regra de negócio ambígua vira pergunta objetiva em `visao.md`; não assuma comportamento para desbloquear planejamento ou código.
- Leia `.sdd/` da raiz e do projeto alterado antes de decisões técnicas. A pasta `projects/` é opcional; quando existir, seus diretórios imediatos são projetos independentes.
- Implemente a partir de visão, especificação e plano aprovados. Escreva o teste de cada cenário antes da alteração de código e execute os comandos de validação realmente disponíveis.
- Confirme antes de publicar, alterar sistemas externos ou executar uma ação destrutiva. Não presuma stack, estrutura de branches ou ferramenta de gestão.

## Fluxo

`$refinar` (inclui descoberta e chama `$planejar` automaticamente) → gate de
verificação e aprovação → `$implementar` → `$revisar`.

`$prototipar` fica fora do fluxo obrigatório e somente é executado quando a
pessoa solicitar explicitamente. A existência de interface não autoriza sua
execução automática nem sua ausência bloqueia a implementação.

Consulte `docs/guia-de-artefatos.md` para o contrato dos arquivos produzidos.

## Protocolo operacional

Núcleo SDD é um método orientado a evidências. Um artefato só existe para
eliminar uma incerteza que poderia produzir código incorreto, retrabalho ou
divergência entre projetos.

1. Receba a necessidade em texto livre por `$refinar`. Execute `$descobrir` em
   modo embutido; somente **Construir** continua para a visão. Derive
   `especificacoes/{slug}/` de um título legível. Nunca exija identificador de
   ferramenta externa.
2. Lacuna de negócio não é suposição: registre pergunta em `visao.md`, marque
   `(bloqueante)` quando ela mudar uma RN, critério, estado ou resultado, e
   pare a fase dependente da resposta.
3. `projects/` é opcional. Quando existir, cada diretório imediato é um projeto
   autônomo, com stack, domínio e comandos próprios. A raiz descreve apenas
   fronteiras e decisões compartilhadas.
4. Ordem de leitura: visão → especificação/plano → `.sdd/` do alvo → código
   relevante. Contexto de outro projeto não é evidência local.
5. Sem bloqueio funcional, `$refinar` chama `$planejar` automaticamente. Código
   só começa depois do gate verificar visão, especificação, plano, tarefas,
   impacto, contratos aplicáveis, rastreabilidade, gaps e comandos disponíveis,
   seguido de aprovação explícita. Para cada cenário: teste vermelho, alteração
   mínima, teste verde e suíte disponível.
6. Não publique, altere serviços externos, destrua dados ou substitua artefato
   aprovado sem confirmação explícita.

## Contexto obrigatório

| Arquivo | Pergunta que responde |
|---|---|
| `CONSTITUICAO.md` | quais limites não podem ser violados? |
| `PROJETO.md` | qual problema, fronteira, convenção e validação local? |
| `STACK.md` | quais tecnologias, versões e comandos foram observados? |
| `PLAYBOOK.md` | quais padrões, riscos e controles valem para o alvo? |
| `memoria/DOMINIO.md` | quais entidades, estados, regras e fluxos existem? |
| `memoria/DECISOES.md` | qual decisão foi tomada, por quê e com qual consequência? |

Se um arquivo estiver ausente, leia código e documentação para suprir somente o
necessário; recomende `$inicializar` ou `$mapear-legado` para criar memória
duradoura. Não preencha lacunas com conteúdo inventado.

## Gates de transição

| Transição | Evidência mínima |
|---|---|
| descoberta embutida → refinamento | decisão **Construir**, hipótese e métrica de sucesso |
| refinamento → planejamento automático | RNs, BDD e rastreabilidade; nenhuma pergunta bloqueante |
| gate → implementação | cenários técnicos, impacto, contratos aplicáveis, cobertura, validações e aprovação explícita |
| implementação → revisão | testes executados, cenários sincronizados e decisões registradas |
| revisão → entrega | verificações disponíveis executadas; achados e lacunas declarados |

`visao.md` é o contrato funcional. `$refinar` o cria; depois, somente extensões
datadas preservam histórico. `$analisar` pode acrescentar perguntas, mas não
reescreve regras. `$refinar` aplica `$planejar` quando a visão passa no gate
funcional; `$planejar` deriva a solução técnica e para no gate de implementação.
`$implementar` atualiza especificação somente diante de cenário técnico ou
decisão confirmada; mudança funcional retorna a `$refinar`.

## Formato mínimo dos artefatos

### Visão

```markdown
# {Título}
## Resultado esperado
## Escopo e não escopo
## Regras de negócio
- RN01 (nome): regra verificável
## Critérios de aceite
- AC01 — nome: Dado ... Quando ... Então ...
## Exemplos e limites
## Rastreabilidade
| RN | ACs | Situação |
## Perguntas em aberto
- (bloqueante) pergunta — impacto
```

Cada cenário de `especificacao.md` declara origem (`RNxx`, `ACxx` ou
`técnico`), pré-condição, entrada, ação, resultado, falha esperada e nível de
teste. Feche com matriz `RN → AC → cenário → teste`; vazio é gap declarado.

`plano.md` identifica módulos, responsabilidade, contratos, ordem e validação.
`tarefas.md` cita arquivos prováveis, cenário, teste a escrever, efeito e
condição de término. `impacto.md` separa projetos que mudam dos que só
validam. `contratos.md` declara entrada, saída, invariantes, erros,
compatibilidade e dono. `revisao.md` registra evidência: cenário, comando,
resultado, achado, severidade, risco e decisão.

## Qualidade e segurança

- Teste comportamento observável, não detalhes internos.
- Valide dados no limite de entrada; autorize antes de acessar recursos; não
  exponha segredos, dados pessoais ou estado interno em resposta ou log.
- Avalie concorrência, idempotência, migração, compatibilidade e observabilidade
  quando o fluxo, persistência ou integração os tornar aplicáveis.
- Decisão arquitetural relevante registra contexto, alternativas, escolha,
  consequências e gatilho de revisão.
- Verificação disponível que não foi executada é lacuna, nunca aprovação.
