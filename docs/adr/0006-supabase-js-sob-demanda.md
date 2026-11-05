# ADR-0006: supabase-js do npm, carregado sob demanda

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

Antes, o supabase-js vinha do jsDelivr com versão fixa na URL ("nunca latest"), importado dinamicamente. Com build, o pacote pode vir do npm, mas o cliente ainda é grande (~57 KB gzip) e não pode atrasar a primeira tela (RN13).

## Alternativas

- **Continuar no CDN:** evita o build, mas não há mais motivo, e o service worker precisaria de uma regra para o CDN.
- **Import estático:** mais simples, mas colocaria o cliente no JS inicial.

## Decisão

Pacote `@supabase/supabase-js` em versão exata (2.118.0, a mesma de antes), importado com `import()` em `createSync`. O Vite coloca o cliente num chunk separado. A fronteira com o cliente é uma interface mínima (`SupabaseLike`), com um único cast no carregador.

## Consequências

- A regra "versão fixa" passa a valer para o `package-lock.json`.
- `scripts/size-budget.mjs` falha se o cliente entrar no carregamento inicial.
- Os testes injetam um cliente falso pelo mesmo carregador.

## Gatilho de revisão

Atualização do supabase-js: só com a suíte de sincronização verde.
