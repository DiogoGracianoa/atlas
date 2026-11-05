# Impacto — Atlas multiárea com progresso sincronizado

Não há `projects/`; o repositório é um projeto único.

| Projeto / sistema | Papel atual | Mudança | Motivo | Dependências | Ordem | Altera código ou valida |
|---|---|---|---|---|---|---|
| repositório `atlas` (raiz) | só README | recebe app, conteúdo, migration, scripts, testes, Actions, framework SDD | todas as RNs | — | 1–6 | altera |
| `exemplos/` | insumo local, fora do git | nenhuma; lida uma vez para extrair política e comparar render | RN01, RN20 | — | 1 | só valida (leitura) |
| Supabase (projeto do autor) | inexistente | autor cria projeto, roda migration, configura e-mail e auth | RN15, RN23, RN29 | README | após 5 | externo — feito pelo autor |
| Vercel | inexistente | autor conecta o repositório | deploy | `vercel.json` | após 5 | externo — feito pelo autor |
| GitHub Actions | inexistente | `validate.yml` (push) e `keepalive.yml` (diário) | RN18, RN19 | secrets do autor | 1, 2, 6 | altera |
