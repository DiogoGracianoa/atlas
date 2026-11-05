# ADR-0007: Offline com service worker próprio sobre Workbox

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

O site precisa abrir e funcionar offline depois da primeira visita (RN06, RN10). Com build, os arquivos ganham hash no nome, e a lista escrita à mão no service worker antigo deixa de servir. Os aparelhos já em uso têm um service worker antigo em `/sw.js`, com o cache `atlas-v1`.

## Alternativas

- **Service worker escrito à mão:** exigiria gerar a lista de precache e tratar as versões manualmente.
- **`generateSW` do plugin:** gera tudo, mas com menos controle sobre as regras do conteúdo e a limpeza do cache antigo.

## Decisão

`vite-plugin-pwa` com `injectManifest`. O SW próprio fica em `src/sw.ts`, e as regras puras e testadas em `src/sw-rules.ts` (contrato KW1):

- precache dos arquivos do build;
- navegação servida pelo `index.html`;
- `/content/*` com rede primeiro (3 s), de modo que só as áreas abertas entram no cache;
- Supabase nunca em cache;
- publicado em `/sw.js`, o mesmo caminho do antigo, com `skipWaiting` e `clientsClaim`;
- apaga `atlas-v1` na ativação.

## Consequências

- Um deploy novo assume no próximo carregamento.
- Os testes de ponta a ponta cobrem a navegação offline, a área nunca aberta e a remoção do cache antigo.

## Gatilho de revisão

Necessidade de sincronização em segundo plano (Background Sync) ou de notificações.
