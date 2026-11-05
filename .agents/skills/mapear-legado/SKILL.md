---
name: mapear-legado
description: Use quando um workspace ou projeto existente precisa adotar o Núcleo SDD sem modificar seu comportamento.
---

# Mapear legado

Entenda antes de mudar. Inspecione documentação, configuração, árvore de código,
dependências e comandos de validação de cada alvo. Em `projects/`, faça um mapa
separado por diretório e use a raiz apenas para fronteiras compartilhadas.

Registre em `.sdd/`: objetivo e fronteiras em `PROJETO.md`; stack e comandos
observados em `STACK.md`; padrões, riscos e verificações em `PLAYBOOK.md`;
entidades e fluxos confirmados em `memoria/DOMINIO.md`; decisões existentes em
`memoria/DECISOES.md`. Diferencie evidência, hipótese e pergunta aberta.

Não refatore nem corrija durante o mapeamento. Apresente os pontos sem prova e
peça confirmação antes de registrá-los como fato.

## Método de inventário

Primeiro mostre tabela de estado: contexto, decisões, testes, documentação,
entrypoints e integrações. Depois siga evidência do ponto de entrada até dados
e saídas, registrando módulos, dependências e fronteiras. Artefato já completo
não é sobrescrito: apresente divergência e proponha complemento. Encerrar com
o que foi observado, inferido, ausente e o próximo risco a investigar.
