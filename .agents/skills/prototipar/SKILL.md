---
name: prototipar
description: Use somente quando a pessoa solicitar explicitamente um protótipo para validar visualmente cenários aprovados.
---

# Prototipar

Execute esta skill somente diante de solicitação explícita de prototipação.
A existência de telas, campos ou interação visível não autoriza inferir o pedido;
a ausência de protótipo não exige registro e não bloqueia `implementar`.

Quando solicitada, leia `especificacao.md`, derive um mapa
cenário→tela→estado, apresente-o para aprovação e crie
`prototipo/index.html` local, acessível e de arquivo único. Mostre estados com
dados fictícios, navegação simples e um checklist BDD↔estado; não integre
serviços nem substitua o produto final.

## Critério visual

O mapa inclui estado inicial, carregamento, sucesso, vazio, erro e bloqueio
quando cada um existir no cenário. Antes de gerar, confirme telas e estados;
depois, relacione cada tabulação ao cenário que demonstra. O HTML usa dados
fictícios, foco visível, idioma definido, contraste e navegação por teclado.
Protótipo aprovado é snapshot: alteração posterior pede variante ou confirmação.
