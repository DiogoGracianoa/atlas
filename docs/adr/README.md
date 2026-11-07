# Registro de decisões (ADR)

Cada arquivo registra uma decisão com **contexto, alternativas, decisão,
consequências e gatilho de revisão**. Decisão substituída não é apagada: o
arquivo novo cita o antigo.

| ADR | Decisão |
|---|---|
| [0001](0001-react-typescript-vite.md) | React + TypeScript + Vite como site estático |
| [0002](0002-roteamento.md) | React Router com rotas limpas e redirecionamento dos links antigos |
| [0003](0003-registro-de-secoes.md) | Registro de seções do portal |
| [0004](0004-estado-na-interface.md) | Núcleo sem React exposto por useSyncExternalStore |
| [0005](0005-configuracao-por-ambiente.md) | Configuração do Supabase por variáveis de ambiente |
| [0006](0006-supabase-js-sob-demanda.md) | supabase-js do npm, carregado sob demanda |
| [0007](0007-offline-com-workbox.md) | Offline com service worker próprio sobre Workbox |
| [0008](0008-estilos-e-tokens.md) | CSS Modules, tokens testados e fontes auto-hospedadas |
| [0009](0009-estrategia-de-testes.md) | Vitest, Testing Library, Playwright e axe |
| [0010](0010-conteudo-em-public.md) | Conteúdo como JSON estático em public/content |
| [0011](0011-versoes-de-dependencias.md) | Versões exatas e publicadas há pelo menos 14 dias |
| [0012](0012-acesso-e-conteudo-autenticados.md) | Login obrigatório e entrega autenticada de materiais, com conexão |
