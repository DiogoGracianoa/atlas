# ADR-0010: Conteúdo como JSON estático em public/content

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

O conteúdo precisa ser carregado sob demanda e ficar em cache por área, e área nova não pode exigir código (RN09). Importar o JSON no bundle faria cada área nova aumentar o JS inicial.

## Alternativas

- **Importar os currículos no bundle:** um build por mudança de conteúdo e um JS inicial maior.
- **Manter `content/` na raiz com um plugin de cópia:** funciona, mas é configuração a mais.

## Decisão

`public/content/` (movido com `git mv`, sem mudar o formato), servido em `/content/...` como antes e buscado com `fetch` relativo à raiz do site.

## Consequências

- `validate.mjs` e `check-extract.mjs` passaram a ler de `public/`.
- O service worker trata `/content/*` com rede primeiro.
- Os módulos originais de política continuam byte a byte iguais, conferidos por teste.

## Gatilho de revisão

Conteúdo grande o bastante para exigir paginação ou busca no servidor.
