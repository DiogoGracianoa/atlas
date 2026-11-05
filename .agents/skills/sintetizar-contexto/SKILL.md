---
name: sintetizar-contexto
description: Use quando as memórias SDD ficaram extensas ou redundantes e precisam ser compactadas sem perder fatos ou decisões.
---

# Sintetizar contexto

Selecione arquivos em `.sdd/memoria/`. Antes de reescrever, inventarie entidades,
fluxos, limites, decisões, números, links e termos de domínio. Compacte apenas
forma: remova repetição, troque prosa por listas ou tabelas e agrupe fatos.

Mostre o diff e as medidas antes/depois. Se houver redução acima de 40%, peça
confirmação antes de gravar. Nunca remova um item inventariado; se o arquivo já
for conciso, informe que não houve alteração útil.

## Integridade

Use uma matriz de preservação `fato | origem | presente após síntese`. Números,
nomes, relações, decisões, datas, links e exceções são fatos atômicos. Se um
fato não couber em forma curta, mantenha-o; economia de tokens nunca justifica
perda de contexto operacional.
