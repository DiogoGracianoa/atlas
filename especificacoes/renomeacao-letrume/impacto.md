# Impacto: renomeação para Letrume

| Projeto / sistema | Papel atual | Mudança | Motivo | Dependências | Ordem | Altera código? |
|---|---|---|---|---|---|---|
| Portal (raiz) | aplicação única | textos, manifesto PWA, ícone, backup, redirecionamento canônico, docs | RN01–RN10 | ícone aprovado (R1) | R2–R7 | sim |
| Conteúdo privado (`private/content/areas.json`) | manifesto das áreas | `tituloPdf` | RN01 | — | R2.5 | dados |
| Banco Supabase | progresso e anotações | nenhuma no schema | — | — | — | não |
| Supabase (painel) | auth e e-mails | *Site URL*, *Redirect URLs*, modelos de e-mail | RN02, RN06 | domínio ativo | R8 | configuração externa (autor) |
| Vercel | hospedagem | domínio `letrume.com.br` + variável `VITE_ORIGEM_CANONICA` | RN06, RN07 | DNS | R8 | configuração externa (autor) |
| registro.br | DNS | apontar para a Vercel | RN06 | — | R8 | configuração externa (autor) |
| GitHub (repositório, Actions) | CI e keepalive | nenhuma (renomear só com confirmação, P4) | — | — | — | não |
| Preparatório de concurso | corte paralelo | só valida: usa o nome vigente quando publicar | — | — | — | não |
