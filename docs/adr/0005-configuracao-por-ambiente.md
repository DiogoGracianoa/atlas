# ADR-0005: Configuração do Supabase por variáveis de ambiente

Status: aceita · Data: 2026-11-05 · Origem: [plano da migração](../../especificacoes/portal-react/plano.md#decisões-arquiteturais)

## Contexto

Na versão sem build, a URL e a chave pública ficavam num `config.js` versionado. Com o repositório público no portfólio, fixar o projeto do autor no código é desnecessário, e o build agora permite injetar configuração.

## Alternativas

- **Manter `config.js` versionado:** é simples, mas cada clone apontaria para o projeto do autor.

## Decisão

`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, nas variáveis de ambiente da Vercel e em `.env.local` no desenvolvimento. O `.env.example` é versionado com os valores vazios. Variáveis vazias significam modo só local (contrato KC1).

## Consequências

- Mudar a configuração exige refazer o deploy, porque o Vite embute as variáveis no build.
- A chave pública continua no bundle, como deve ser; `npm run secrets` garante que nenhuma chave secreta entra.

## Gatilho de revisão

Necessidade de mais de um ambiente com o mesmo build (configuração em runtime).
