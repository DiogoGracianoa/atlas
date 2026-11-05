# Contratos de artefatos do Núcleo SDD

## Descoberta

`refinar` começa aplicando a descoberta em modo embutido. Os arquivos
`.discovery/{slug}/problema.md`, `hipotese.md` e `decisao.md` preservam a dor,
a hipótese, a métrica e a decisão **Construir**, **Adiar** ou **Descartar**.
Somente **Construir** libera a criação de `visao.md`.

## Visão funcional

`visao.md` responde o que muda e por quê. Cada RN tem identificador contínuo,
condição, comportamento e consequência. Cada AC usa BDD com dados concretos.
Perguntas abertas registram origem, impacto, responsável pela resposta e se são
bloqueantes. Extensões são datadas; nunca reenumere nem apague uma decisão.

## Análise e especificação

`analise.md` separa evidência observada, inferência, risco e pergunta. Cite
módulo, arquivo ou documento de origem para toda conclusão técnica.
`especificacao.md` descreve comportamento verificável: origem, pré-condição,
dados, ação, resultado, falha, efeito colateral e nível de teste. Sua matriz de
cobertura fecha `RN → AC → cenário → teste`; ausência recebe estado `gap` com
motivo e dono.

## Plano e tarefas

`plano.md` contém objetivos técnicos, responsabilidades por módulo/projeto,
ordem, contratos, decisões, riscos e comandos de validação. `tarefas.md` é uma
lista ordenada em que cada item informa cenário, arquivos prováveis, teste RED,
mudança GREEN, refatoração permitida e condição objetiva de término.

O planejamento termina em um gate que apresenta cobertura, contratos
aplicáveis, riscos, gaps e validações disponíveis. Artefatos completos não
substituem aprovação explícita antes de `implementar`.

## Impacto e contratos

`impacto.md` tem uma linha por projeto: papel atual, mudança, motivo,
dependências, ordem e se altera código ou apenas valida. `contratos.md` existe
somente na fronteira entre componentes e declara versão, operação/evento,
entrada, saída, invariantes, erros, autenticação/autorização, compatibilidade,
idempotência e dono da evolução.

## Protótipo e revisão

Quando solicitado explicitamente, `prototipo/` mapeia cenário para tela e
estado, incluindo vazio, carregamento, erro e bloqueio quando existirem. Ele
não integra o fluxo obrigatório. `revisao.md` guarda o veredito e uma tabela com
achado, severidade, evidência, consequência, correção e teste que confirma a
correção. Teste, lint, tipo, build e auditoria que não rodaram são lacunas
declaradas.
