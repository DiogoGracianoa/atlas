# ADR-0001: React + TypeScript + Vite como site estático

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

O Atlas era um único HTML com JavaScript sem build, e um `app.js` de 870 linhas montava a interface em strings com `innerHTML`. O autor vai crescer o portal com novas seções (dossiês) e quer o projeto no portfólio. A lógica de domínio (store, mescla, fila, sincronização) já era modular e testada; o problema estava concentrado na interface.

## Alternativas

- **Dividir `app.js` em módulos sem framework:** resolve a organização com custo baixo, mas mantém a renderização manual, com o foco e o redesenho controlados à mão, e não atende o objetivo de portfólio.
- **Preact + htm por CDN, sem build:** tem modelo de componentes e continua sem build, mas sem TypeScript real e com ferramentas de teste mais fracas.
- **Next.js:** traz SSR e funções que o site não precisa, além de mais acoplamento à Vercel e mais complexidade para um site offline-first.

## Decisão

React 19 com TypeScript estrito, build com Vite, publicado como site estático. Nenhum código de servidor próprio.

## Consequências

- Passa a existir build (`npm run build`) e `node_modules`. A Vercel usa o preset Vite.
- Componentes declarativos eliminam a gambiarra de redesenho que preservava o foco nas anotações.
- Os tipos cobrem o estado local, o currículo, as linhas do Supabase e a fronteira com o supabase-js.

## Gatilho de revisão

Uma seção que precise de SEO por página ou de conteúdo gerado no servidor.
