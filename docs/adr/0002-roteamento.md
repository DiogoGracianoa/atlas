# ADR-0002: React Router com rotas limpas e redirecionamento dos links antigos

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

As rotas eram por hash (`#/politica/m1e1`). Com seções novas, o endereço precisa de um prefixo de seção, e o autor escolheu caminhos limpos. Links antigos salvos em favoritos e no histórico precisam continuar funcionando.

## Alternativas

- **Manter o roteador por hash próprio:** não exige configuração no servidor, mas os endereços ficam piores e o roteador continuaria sendo nosso.
- **Hash com prefixo de seção** (`#/atlas/...`): resolve o prefixo, mas mantém o `#`.

## Decisão

React Router no modo data (`createBrowserRouter`), com caminhos limpos: `/atlas/:area/:id`, depois `/dossies/...`. Endereços antigos com `#` são traduzidos por `legacyToPath` (função pura, `src/core/legacy.ts`) e aplicados com `history.replaceState` antes de o roteador montar, sem criar entrada extra no histórico. O `ScrollRestoration` volta ao topo em navegação nova e restaura a posição ao voltar.

## Consequências

- A Vercel precisa reescrever as rotas para `index.html`, e o service worker precisa servir qualquer navegação a partir do `index.html` guardado.
- As URLs de retorno do login passam a ser `https://SITE/**` no Supabase.
- Os testes de ponta a ponta cobrem recarga, links antigos e rolagem.

## Gatilho de revisão

Troca da hospedagem por outra que não suporte reescrita de rotas.
