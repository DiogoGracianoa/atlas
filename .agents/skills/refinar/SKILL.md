---
name: refinar
description: Use quando uma necessidade precisa percorrer descoberta, visão funcional e planejamento antes do gate de implementação.
---

# Refinar

Receba a necessidade sob `Detalhamento:`. Esta é a entrada obrigatória do fluxo:
execute primeiro `descobrir` em modo embutido. Use o título e o slug obtidos na
descoberta para os demais artefatos.

Se a decisão for **Adiar** ou **Descartar**, encerre sem criar visão ou plano.
Somente **Construir** inicia o refinamento: crie
`especificacoes/{slug}/visao.md`.

O arquivo contém: objetivo, persona e benefício quando aplicável, regras de
negócio `RN01...`, critérios de aceite em BDD, escopo, não escopo, exemplos,
rastreabilidade RN↔cenário, projetos potencialmente impactados e `## Perguntas
em aberto`.

Uma regra ausente ou ambígua vira pergunta objetiva. Marque `(bloqueante)` se a
resposta muda uma RN ou critério; nesse caso não libere `$planejar`. Ao receber
uma resposta posterior, acrescente extensão datada e preserve a decisão
anterior. Não escolha arquitetura nem invente regra para fechar uma lacuna.

## Procedimento obrigatório

### 1. Qualificar a entrada

Antes de escrever, separe fatos fornecidos, exemplos, decisões já tomadas,
restrições, termos de domínio e hipóteses. Confirme título orientado a resultado
e identifique se o pedido contém mais de uma entrega independente. Se contiver,
proponha cortes verticais por valor; não esconda uma sequência de produtos sob
um único slug.

### 2. Construir a visão

Escreva RNs numeradas, atômicas e falsificáveis: cada uma declara condição,
comportamento e consequência. Para toda RN verificável, crie ao menos um AC
observável em BDD, cobrindo caminho principal, recusa e limite quando aplicável.
Exemplos concretos definem datas, valores, estados e permissões; não use “se
válido” sem explicar o que é válido.

### 3. Fechar a rastreabilidade

Use a tabela `RN | ACs | Cenários previstos | Estado`. RN sem AC e AC sem RN
são gaps explícitos. Cenário técnico ainda não é criado aqui; registre somente
o comportamento esperado pelo negócio.

### 4. Executar o gate

Se faltarem objetivo, escopo, RNs, ACs, rastreabilidade ou resposta para
pergunta bloqueante, declare **Em esclarecimento**, liste perguntas na ordem em
que destravam o trabalho e pare.

Quando a visão estiver pronta, aplique `planejar` automaticamente no mesmo
fluxo; não pare apenas para pedir uma nova invocação. Depois do planejamento,
pare no gate de implementação definido por `planejar` e aguarde aprovação
explícita. Nunca inicie `implementar` automaticamente.

## Erros proibidos

- Transformar limitação atual do código em regra de negócio sem confirmação.
- Escolher API, banco, componente ou padrão de implementação.
- Apagar decisão antiga; use extensão datada com o que mudou e por quê.
