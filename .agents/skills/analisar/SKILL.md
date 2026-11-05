---
name: analisar
description: Use quando uma mudança toca código desconhecido, múltiplos módulos, integrações ou riscos técnicos relevantes.
---

# Analisar

Leia a visão e o `.sdd/` do alvo. Busque no código pelos termos da necessidade;
não varra o repositório inteiro sem motivo. Crie
`especificacoes/{slug}/analise.md` com evidências para: módulos e dependências
afetados, conceitos de domínio, padrões existentes, direção técnica, riscos,
limites e perguntas.

Diferencie o que foi observado do que foi inferido. Se uma lacuna for de
negócio, registre-a em `visao.md` e pare o planejamento correspondente. Esta
skill investiga e recomenda; não altera código.

## Saída auditável

Para cada conclusão, cite arquivo/módulo e evidência. Diferencie comportamento
atual, comportamento desejado e divergência. Avalie limites, dados, permissões,
concorrência, desempenho, compatibilidade e dependências somente quando a área
os expuser. Termine com risco, probabilidade, impacto, mitigação e pergunta que
precisa de decisão; não converta risco em arquitetura decidida.
