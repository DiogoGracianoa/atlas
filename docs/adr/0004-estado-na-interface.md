# ADR-0004: Núcleo sem React exposto por useSyncExternalStore

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

O estado relevante (marcações, anotações, fila, sessão) já vivia num núcleo testado e independente de framework, que grava no `localStorage` e emite eventos. Não há estado de servidor do tipo "buscar e guardar em cache" que justifique uma biblioteca de dados.

## Alternativas

- **Redux ou Zustand:** duplicariam o estado que o store já guarda e exigiriam portar a sincronização para dentro da biblioteca.
- **Context + reducer:** espalharia a lógica de sincronização pelos componentes.
- **TanStack Query:** pensada para dados de servidor; aqui o servidor é uma réplica, e a fonte da verdade é local.

## Decisão

O núcleo (`src/core`) continua sem React, com as dependências injetadas: armazenamento, relógio, temporizadores e carregador do Supabase. A interface assina um contador de versão por serviço com `useSyncExternalStore` (`useAppState`, `useSyncState`).

## Consequências

- Os cenários de sincronização entre dois aparelhos rodam em Node, sem navegador e com relógio controlado.
- O store muta o estado no lugar. Os componentes leem `store.state` e redesenham pela versão, então não se deve guardar referências antigas do estado em memo.

## Gatilho de revisão

Estado de interface complexo, como formulários grandes nos dossiês, que o store não modele bem.
