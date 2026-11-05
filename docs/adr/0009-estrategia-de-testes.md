# ADR-0009: Vitest, Testing Library, Playwright e axe

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

A base antiga tinha 131 testes em `node --test`, sem dependências. A migração exige testar componentes, rotas reais, offline e acessibilidade sem perder os cenários de sincronização.

## Alternativas

- **Manter `node --test` para tudo:** não renderiza componentes.
- **Jest:** mais lento e com mais configuração com Vite e ESM.
- **Cypress:** pesado para o CI e com suporte a service worker mais limitado.

## Decisão

Vitest com dois projetos: `core` (Node) e `ui` (jsdom + Testing Library + axe-core). Playwright só com Chromium, contra o build de produção. Os testes antigos foram portados mantendo as asserções (`node:assert`), com a contagem por arquivo conferida.

## Consequências

- O CI tem três jobs: `qualidade`, `e2e` e `banco`.
- O job de e2e baixa o Chromium.
- Os cenários do app apontam para testes nomeados na especificação.

## Gatilho de revisão

Teste instável no e2e: isolar e corrigir, nunca apagar.
