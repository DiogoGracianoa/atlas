# Decisão — Acesso obrigatório por login

Data: 2026-11-06. Modo: descoberta embutida em `$refinar`.

## Construir

O pedido declara o resultado desejado: impedir acesso sem login e redirecionar
para a tela de entrada. A hipótese e a métrica estão em `hipotese.md`.

Alternativas: manter acesso anônimo não atende ao pedido; exigir login atende
ao bloqueio das telas; tornar os arquivos privados também exige esclarecer o
escopo. A escolha técnica depende dessa resposta.

A descoberta libera a criação da visão. Planejamento e implementação aguardam
o esclarecimento registrado em `visao.md` e o gate aplicável. Nenhum código foi
alterado e nenhum serviço externo foi modificado.

## Extensão 2026-11-06 — escopo confirmado

O solicitante confirmou proteger também os materiais e aceitou exigir conexão
para abri-los. As respostas estão preservadas na extensão de `visao.md`.
A decisão **Construir** permanece; o planejamento foi concluído e aguarda
aprovação explícita do plano antes de código. A solução proposta entrega os
JSONs por função autenticada, fora da distribuição estática. Não houve mudança
de produto nem ação externa.
