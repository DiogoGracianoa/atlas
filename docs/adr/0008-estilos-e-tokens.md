# ADR-0008: CSS Modules, tokens testados e fontes auto-hospedadas

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

A migração liberou o redesenho, com limites: temas claro, escuro e automático, quatro tamanhos de texto, contraste AA, teclado e 320 px (RN12). As cores das tradições vêm do manifesto.

## Alternativas

- **Tailwind:** produtivo, mas as cores precisam ser testáveis como dados, e o projeto quer CSS legível no portfólio.
- **CSS-in-JS:** acrescenta runtime e peso ao bundle.

## Decisão

As cores ficam em `src/ui/tokens.ts`, de onde `theme.ts` gera as custom properties nos modos claro, escuro automático e escuro forçado. Os componentes usam CSS Modules. As fontes Literata (leitura) e Inter (interface) são auto-hospedadas via fontsource, só nos subconjuntos latinos.

## Consequências

- `tests/ui/tokens.test.ts` calcula o contraste WCAG de cada par e das cores de tradição do manifesto.
- O e2e roda o axe com contraste real nos dois temas.
- Nenhuma requisição a fontes de terceiros, e as fontes funcionam offline.

## Gatilho de revisão

Um design system compartilhado com outro projeto.
