---
name: revisar
description: Use quando uma implementação precisa ser avaliada contra sua especificação, testes, limites e riscos de segurança aplicáveis.
---

# Revisar

Leia os artefatos e o código alterado. Em `especificacoes/{slug}/revisao.md`,
relacione cenário→teste→comportamento; registre comandos executados e o
veredito. Verifique validação de entrada, autorização, tratamento de erros,
vazamento de dados, concorrência, dependências e observabilidade quando forem
aplicáveis à superfície alterada.

Classifique achados por impacto, com evidência e correção sugerida. Declare
lacunas em vez de supor cobertura. Não marque como aprovado se uma verificação
disponível falhar ou não tiver sido executada.

## Método de revisão

1. Monte a tabela `cenário | teste | código | evidência | resultado`. Cenário
   sem teste, teste sem cenário e comportamento sem origem são achados.
2. Revise entradas, autorização, transições de estado, erros, logs e dados
   sensíveis no ponto onde entram ou saem do sistema.
3. Avalie os riscos aplicáveis: injeção, acesso indevido, exposição de dados,
   concorrência, reprocessamento, falha parcial de integração, migração e
   compatibilidade. Não use checklist cego; declare por que cada risco se aplica
   ou não à mudança.
4. Execute testes, lint, tipo, build ou análise de dependências que o projeto
   disponibilizar. Registre comando, código de saída e resultado.

## Veredito

Classifique como **Aprovada**, **Aprovada com lacunas** ou **Reprovada**. Um
achado contém severidade, local, cenário afetado, evidência, consequência e
correção verificável. Lacuna sem evidência não é achado; verificação não rodada
é lacuna. Não proponha mudança funcional sem devolvê-la ao refinamento.
