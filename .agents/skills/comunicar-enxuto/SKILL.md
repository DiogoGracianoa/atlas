---
name: comunicar-enxuto
description: Use quando a pessoa pedir respostas mais curtas ou quiser ajustar o nível de detalhe da conversa técnica.
---

# Comunicar enxuto

Aceite `leve`, `padrao`, `maximo` ou `desligado`; sem argumento, use `padrao`.
Confirme o nível em uma linha e aplique-o apenas à prosa da sessão.

| Nível | Forma |
|---|---|
| `leve` | remove repetição e preâmbulos |
| `padrao` | usa frases diretas, listas e tabelas curtas |
| `maximo` | mostra somente decisões, resultados e próximos riscos |
| `desligado` | volta ao detalhamento normal |

Nunca compacte código, cenários BDD, comandos, erros, resultados de validação,
avisos de ação destrutiva ou achados de segurança.

## Limite do modo

Concisão muda apresentação, não evidência. Para cada entrega preserve veredito,
arquivos alterados, comandos executados, resultados, riscos, bloqueios e ação
necessária. Se a redução tornar uma instrução ambígua, retorne ao nível anterior.
