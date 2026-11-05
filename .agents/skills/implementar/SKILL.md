---
name: implementar
description: Use quando uma especificação e um plano aprovados precisam ser convertidos em código e testes no projeto afetado.
---

# Implementar

Antes de editar, leia `visao.md`, `especificacao.md`, `plano.md`, contratos,
impacto e `.sdd/` do projeto alvo. Para cada cenário: escreva teste que falha,
execute-o, faça a menor alteração que o deixa verde, execute a suíte disponível
e refatore sem mudar comportamento.

Não implemente sem especificação aprovada. Se o código revelar ambiguidade de
negócio, registre pergunta em `visao.md` e pare; se revelar decisão técnica,
registre-a em `memoria/DECISOES.md` ou na convenção equivalente. Atualize os
artefatos que a implementação comprovadamente alterou e reporte comandos e
resultados de validação.

## Execução por cenário

1. Localize no plano o cenário, origem, arquivos e comando de teste. Releia o
   contrato se houver fronteira externa.
2. Escreva um teste de comportamento que falhe pelo motivo esperado. Falha por
   importação, fixture quebrada ou ambiente ausente não conta como RED.
3. Faça somente a mudança necessária para o teste passar. Não antecipar
   abstrações, campos, endpoints ou regras que o cenário não exige.
4. Rode o teste do cenário e a suíte aplicável. Refatore apenas com tudo verde.
5. Atualize a matriz cenário→teste e registre decisão técnica, incompatibilidade
   ou limitação descoberta. Contrato compartilhado nunca é alterado em silêncio.

## Sensor de coerência

Ao terminar, compare visão, especificação, contratos, testes e código. Declare
um por um: cenários cobertos, cenários pendentes, contratos respeitados,
decisões adicionadas e verificações não executadas. “Código pronto” sem essa
comparação é estado incompleto.

## Interrupções corretas

Pare e devolva ao refinamento se uma regra, estado, prazo, prioridade ou efeito
de negócio não estiver definido. Pare e peça confirmação antes de ação externa,
migração irreversível ou mudança incompatível.
