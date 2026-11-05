---
name: planejar
description: Use quando uma visão funcional sem bloqueios de negócio precisa se transformar em especificação e plano técnico verificável.
---

# Planejar

Exija `visao.md` sem pergunta bloqueante. Leia contexto e análise relevantes,
então produza somente os artefatos necessários em `especificacoes/{slug}/`:
`especificacao.md`, `plano.md`, `tarefas.md`, `impacto.md`, e, quando houver
fronteira real, `contratos.md`; use `fluxo.mermaid` apenas para fluxo complexo.

Cada cenário técnico aponta para a RN ou critério que cobre. O plano identifica
projetos e módulos, ordem de execução, validações reais, riscos e decisões.
Tarefas devem ser pequenas, ordenadas e testáveis.

## Fases de planejamento

1. **Gate de entrada:** releia `visao.md`; pare diante de pergunta bloqueante,
   RN sem AC ou AC sem resultado observável.
2. **Delimitação:** liste o que muda, o que não muda, projetos afetados e os
   que apenas validam. Não atribua mudança a projeto sem evidência no código,
   contrato ou responsabilidade documentada.
3. **Especificação técnica:** para cada comportamento, defina cenário com
   origem, pré-condições, dados, ação, resultado, erro e fronteira. Inclua
   cenário técnico apenas para risco comprovado e marque-o como tal.
4. **Contratos:** quando uma fronteira for atravessada, registre operação,
   versão, entrada, saída, invariantes, erros, compatibilidade, idempotência e
   dono. Se não houver fronteira, não crie contrato decorativo.
5. **Plano e tarefas:** ordene dependências; cada tarefa aponta cenário,
   arquivos/módulos, teste inicial, mudança mínima e verificação final.

## Checagem de saída

Apresente contagem de RNs, ACs, cenários, contratos e gaps. A matriz de
cobertura deve apontar cada RN e AC para cenário e nível de teste. Se houver
decisão arquitetural com alternativas relevantes, registre-a antes de pedir
aprovação; não a enterre na tarefa.

## Gate de implementação

Antes de liberar `implementar`, verifique e apresente:

- visão sem pergunta bloqueante;
- especificação, plano, tarefas e impacto consistentes;
- contratos presentes somente quando aplicáveis;
- matriz RN → AC → cenário → teste sem gap oculto;
- comandos de validação realmente disponíveis;
- decisões, riscos, lacunas e verificações ainda não executadas.

Depois dessa evidência, pare e aguarde aprovação humana explícita. Artefatos
completos, testes verdes ou ausência de gaps não equivalem a aprovação. Esta
skill nunca inicia `implementar` automaticamente.
