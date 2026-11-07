# Impacto

| Projeto | Papel | Mudança | Dependência e ordem | Tipo |
|---|---|---|---|---|
| Atlas na raiz | Interface e camada de autenticação | Entrada por senha e gestão autenticada, mantendo código | Supabase Auth existente; testes precedem implementação | Código e testes |
| Supabase implantado | Identidade e política de senha | Validar configuração de provedor e política antes do teste real | Após implementação; eventual ajuste externo requer confirmação | Validação; alteração somente se autorizada |
| Vercel | Hospedagem | Publicação posterior | Após revisão e confirmação específica | Apenas validação posterior |
