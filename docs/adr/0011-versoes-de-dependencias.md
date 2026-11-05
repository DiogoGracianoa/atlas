# ADR-0011: Versões exatas e publicadas há pelo menos 14 dias

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

Na época da migração, as versões mais novas eram muito recentes (Vite 8, React Router 8, TypeScript 7), e nem todos os peers acompanhavam.

## Alternativas

- **Faixas com `^`:** atualizam sozinhas e tornam o build não reprodutível.
- **Sempre a versão mais nova:** traz risco de incompatibilidade e de pacote comprometido recém-publicado.

## Decisão

Versões exatas no `package.json`, todas publicadas há pelo menos 14 dias, escolhidas pela compatibilidade de peers, e `npm ci` no CI. Exemplos:

- TypeScript 6.0.3 em vez do 7, porque o `typescript-eslint` 8.72 exige `<6.1`;
- ESLint 10 com o fork mantido `eslint-plugin-jsx-a11y-x`, porque o plugin original só aceita até o ESLint 9, que saiu de suporte.

## Consequências

- Atualizar é uma decisão explícita.
- O lockfile foi gerado com o npm 11, porque o `npm install` do npm 10.9 falha ao resolver peers opcionais. O `npm ci` do npm 10 instala normalmente.

## Gatilho de revisão

Alerta de segurança numa dependência ou fim de suporte de uma versão usada.
