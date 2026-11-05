# Sincronização offline-first

O objetivo é simples de dizer: **nenhuma marcação ou anotação se perde**, com o
aparelho online, offline ou alternando entre os dois, e com celular e PC
editando ao mesmo tempo.

## Modelo de dados

| Onde | Chave | Conteúdo |
|---|---|---|
| `localStorage` `atlas-v3` | — | `marks`, `notes` (com `base`), `lastAt`, `resetAt`, `totals`, `size`, `theme` |
| `localStorage` `atlas-v3-queue` | `p\|item\|marca`, `n\|item`, `f` | operações pendentes, uma por linha remota |
| `progress` | `(user_id, item_id, mark)` | `area`, `done`, `updated_at` |
| `notes` | `(user_id, item_id)` | `area`, `body`, `updated_at` |
| `prefs` | `user_id` | `last_at` (posição de "continuar"), `updated_at` |

- `item_id` é sempre `área/id`, por exemplo `politica/m8e3`.
- `updated_at` é o horário da edição no aparelho, não o horário de chegada ao
  servidor.
- Desmarcar grava `done = false`; nunca apaga a linha.
- Tamanho do texto e tema nunca saem do aparelho.

## Regras

1. **Escrita local primeiro.** `store.setMark` e `store.setNote` gravam no
   `localStorage` antes de retornar e só então avisam a interface e a
   sincronização.
2. **Uma linha por coisa editada.** Celular marcando um vídeo e PC escrevendo
   uma anotação mexem em linhas diferentes e nunca conflitam.
3. **Quando enviar:**
   - marcação vai imediatamente;
   - anotação e posição de "continuar" vão 800 ms depois da última mudança;
   - a fila coalesce várias edições da mesma linha e mantém só a mais recente.
4. **Vence o mais recente**, nas duas pontas:
   - **no servidor:** o trigger `descarta_escrita_antiga` (`BEFORE UPDATE`)
     retorna `NULL` quando `new.updated_at < old.updated_at`. A linha
     descartada não volta na resposta do upsert, e o cliente, ao notar a
     ausência, faz uma busca para receber a versão mais nova;
   - **no cliente:** a mescla compara os horários entrada a entrada
     (`core/merge.ts`).
5. **Anotação divergente não se perde.** Cada anotação guarda a `base`, que é a
   última versão confirmada pelo servidor. Se os dois lados mudaram desde a
   base, vence o mais recente e o texto do outro é anexado com o marcador
   `— versão de outro aparelho (dd/mm/aaaa hh:mm) —`.
6. **Quando buscar:**
   - ao abrir o app;
   - ao voltar para a aba (no máximo uma vez a cada 15 s);
   - ao reconectar;
   - 30 s depois de uma falha de rede ou do servidor.

   A busca vem antes do envio da fila, para a mescla acontecer com a visão mais
   atual.
7. **Zerar vale para todos os aparelhos.** `resetAt` marca o momento do Zerar.
   Na mescla, uma linha remota desconhecida e anterior a ele conta como
   desmarcada ou vazia, e é sobrescrita.
8. **Erros:**
   - rede (status 0), sessão (401), limite (408/429) e servidor (5xx)
     mantêm a operação na fila;
   - os demais 4xx descartam a operação, que repetir não resolveria, e
     registram o descarte no console sem o conteúdo;
   - num lote, um item inválido é isolado e não derruba os outros.
9. **Sair no meio de um envio** descarta o resultado: o envio guarda o `uid` do
   início e não aplica nada se a sessão mudou.

## Estados do indicador

| Estado | Quando |
|---|---|
| Não sincronizado | sem sessão (ou sem configuração) |
| Sincronizando… | há envio ou busca em andamento, ou fila não vazia |
| Sincronizado | fila vazia e nada em andamento |
| Offline | navegador sem rede, ou a última tentativa falhou por rede |

O indicador e o painel de conta só aparecem em aparelho onde alguém já entrou
(chave `atlas-conta-vista`). Visitantes do site não veem nada de login.

## Login

- `signInWithOtp` envia um e-mail com o **link** e o **código de 6
  dígitos**, usando `shouldCreateUser: false`: só a conta criada no painel
  existe.
- O link volta para a página de onde o login foi pedido (PKCE, `?code=`), e o
  parâmetro é removido do endereço com `replaceState`.
- O código resolve dois casos em que o link falha: o atalho do iPhone na tela
  inicial e o pedido feito num aparelho com o e-mail aberto em outro.
- "Sair deste aparelho" (`signOut({ scope: "local" })`) mantém os dados
  locais.

## Limitações conhecidas

- **Mesma anotação editada ao mesmo tempo em dois aparelhos online:** a versão
  mais recente vence sem preservar a outra. Com edição offline, ou em momentos
  diferentes, as duas versões são preservadas.
- **Relógio do aparelho:** "vence o mais recente" usa o horário do aparelho.
  Um relógio muito errado faria esse aparelho sempre vencer, ou sempre perder.
- **iOS apaga dados de sites pouco usados** (7 dias sem abrir). O que já subiu
  volta no próximo login; o que estava só na fila se perde.

## Onde está testado

- `tests/core/sync.test.ts`: 18 cenários com dois aparelhos sobre um backend
  falso, que reproduz chave primária, RLS, o trigger e o formato de horário do
  Postgres.
- `tests/core/merge.test.ts`, `queue.test.ts` e `store.test.ts`: as regras
  isoladas.
- `tests/ui/upgrade.test.tsx`: aparelho com o estado e a fila do app antigo.
- `tests/db/`: migration, RLS e trigger num PostgreSQL 16 real.
