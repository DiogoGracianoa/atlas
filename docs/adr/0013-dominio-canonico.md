# ADR-0013: Nome Letrume e domínio canônico com redirecionamento após envio

Status: aceita · Data: 2026-11-11.
Origem: [plano aprovado](../../especificacoes/renomeacao-letrume/plano.md).

## Contexto

O portal passou a se chamar **Letrume** e ganhou o domínio `letrume.com.br`.
O navegador separa sessão e `localStorage` por origem: o endereço antigo da
Vercel e o domínio novo não compartilham sessão, marcações locais nem a fila de
envio. Um aparelho com marcações ou anotações ainda não enviadas perderia esses
dados se fosse levado ao domínio novo antes de sincronizar.

## Alternativas

- **Redirecionamento 301 na Vercel:** simples, mas o navegador nunca mais roda
  o app no endereço antigo, e a fila presa nele se perde.
- **Dois endereços em paralelo, sem redirecionar:** sem perda, mas o autor
  continua usando o endereço antigo sem perceber, e os links de e-mail se
  dividem.
- **Redirecionar no próprio app, depois de esvaziar a fila:** o app no endereço
  antigo sincroniza e só então troca de origem.

## Decisão

Redirecionar no app (`src/core/origem.ts`, contrato KO1). Com
`VITE_ORIGEM_CANONICA` preenchida e a origem atual diferente dela, o app espera
a fila esvaziar (com sessão: estado "sincronizado"; sem sessão: fila vazia),
online, e chama `location.replace` com o mesmo caminho, busca e âncora. Offline
ou com envio falhando, permanece.

As chaves locais (`atlas-v3`, `atlas-v3-queue`, `atlas-conta-vista`) **não**
mudam com o nome. O campo `app` do backup passa a "Letrume", na mesma versão 3,
e a importação continua aceitando arquivos "Atlas de Estudos". A seção de
trilhas continua "Atlas de estudos", com as rotas `/atlas/...`.

## Consequências

- No domínio novo é preciso entrar de novo (a sessão é por origem); as
  marcações vêm do servidor.
- Um app instalado a partir do endereço antigo é outro app; reinstalar pelo
  domínio novo.
- Os dois domínios precisam servir o mesmo deploy enquanto houver aparelhos no
  endereço antigo: **não** configurar redirecionamento de domínio na Vercel.
- Sem a variável (desenvolvimento, previews), nada muda.

## Gatilho de revisão

Quando nenhum aparelho usar mais o endereço antigo, trocar o redirecionamento
do app por um 301 na Vercel e remover a variável.
