# ADR-0003: Registro de seções do portal

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

O portal vai receber seções além do atlas, começando pelos dossiês. Cada seção nova não pode exigir mudanças no shell, no armazenamento nem na sincronização (RN08).

## Alternativas

- **Rotas fixas no `App`:** o shell importaria cada seção, e cada seção nova mexeria no núcleo.
- **Carregamento dinâmico por convenção de pastas** (`import.meta.glob`): funciona, mas é mágico demais para um registro de poucas entradas.

## Decisão

`src/sections/registry.ts` exporta a lista de seções (contrato KS1): slug, nome, resumo, status, rotas e um cartão opcional. O shell monta o portal e o roteador iterando essa lista. Seção planejada aparece como "em breve", sem link.

## Consequências

- Seção nova = pasta `src/sections/<slug>/` + uma entrada no registro.
- `tests/ui/secao-nova.test.tsx` monta uma seção fictícia com o shell, o armazenamento e a sincronização reais, sem stub, e prova a regra.

## Gatilho de revisão

Seções que precisem compartilhar estado próprio além do armazenamento comum.
