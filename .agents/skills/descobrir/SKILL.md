---
name: descobrir
description: Use quando existe um problema ou oportunidade cuja decisão de construir, adiar ou descartar ainda precisa ser fundamentada.
---

# Descobrir

Conduza a conversa de problema para decisão, não para implementação. Esta
skill pode ser usada isoladamente ou em modo embutido como primeira etapa de
`refinar`. Nos dois modos, crie `.discovery/{slug}/problema.md`, `hipotese.md` e
`decisao.md`.

Esclareça público, dor observável, resultado desejado, evidências, restrições e
como saber se a hipótese funcionou. Compare alternativas proporcionais ao
problema e registre uma decisão: **Construir**, **Adiar** ou **Descartar**.

Somente **Construir** libera `$refinar`; as demais decisões encerram o ciclo
com seus motivos e condição para reabertura. Não crie cenários técnicos, plano
ou código nesta skill.

## Modos de retorno

- **Standalone:** apresente a decisão. Se for **Construir**, oriente a pessoa a
  iniciar o fluxo obrigatório por `refinar`.
- **Modo embutido:** retorne a decisão ao `refinar` que chamou esta skill. Não
  invoque nem oriente nova invocação de `refinar`; o chamador continua somente
  diante de **Construir**.

## Roteiro de decisão

Pergunte uma coisa por vez: persona, situação atual, impacto, alternativa atual
e sinal mensurável de melhora. A hipótese usa “acreditamos que… para… e
saberemos quando…”. Liste suposições, maior risco e menor experimento. Decisão
**Construir** exige hipótese e métrica; **Adiar** define condição de retorno;
**Descartar** preserva motivo. Nunca transforme uma solução sugerida em problema
sem validar a dor que ela pretende resolver.
