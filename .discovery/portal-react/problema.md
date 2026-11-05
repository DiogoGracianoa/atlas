# Problema — Portal Atlas em React

Data: 2026-11-05

## Público

- **Autor (uso diário):** estuda pelo Atlas no celular e no PC, com progresso
  sincronizado. Quer acrescentar seções além do atlas de estudos, como dossiês
  sobre temas, pessoas e tecnologias.
- **Quem avalia o portfólio:** recrutadores, tech leads e revisores técnicos que
  abrem o repositório e o site sem contexto prévio.

## Situação atual (observada no código)

- Interface em JavaScript puro, sem build: `assets/app.js` tem 870 linhas que
  montam HTML em strings (`innerHTML` em 14 pontos) e acumulam navegação,
  renderização, preferências, backup, impressão e a interface de sincronização.
- A lógica de domínio já é modular e testada: `assets/lib/{store,merge,queue,
  routes,content,backup}.js` e `assets/sync.js`, com 131 testes em `node --test`.
- O site só conhece uma seção (o atlas). As rotas `#/area/item` não têm prefixo
  de seção, e a tela inicial é o mapa de áreas.
- A documentação (README em português) é um guia operacional. Ela não apresenta
  a arquitetura, as decisões nem o raciocínio do projeto para quem chega de fora.

## Dor

1. Toda tela nova, seja um dossiê, um quiz ou um editor, teria de crescer dentro
   do mesmo `app.js`, misturando estado, eventos e marcação. O custo e o risco de
   regressão aumentam a cada recurso.
2. Já existe uma gambiarra para não perder o foco ao redesenhar a tela durante a
   digitação (`rerenderKeepingPlace`). É sintoma da renderização manual.
3. Como peça de portfólio, o projeto não se explica: falta visão de arquitetura,
   falta registro das decisões com as alternativas consideradas, e a pilha sem
   build e sem tipos esconde a qualidade que existe na lógica de sincronização.

## Restrições

- Não perder dados de quem já usa: `localStorage` v3, fila de envio e linhas no
  Supabase.
- Supabase Free, Vercel estático, sem funções serverless e sem serviço pago.
- iOS Safari e Chrome Android.
- Funcionar offline continua obrigatório.
- A chave `service_role` nunca entra no repositório nem no bundle.
