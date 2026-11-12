# Especificação: renomeação para Letrume

Origem: [visao.md](visao.md) com a extensão de 2026-11-11.

## Cenários

| ID | Origem | Pré-condição | Entrada / ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|
| S01 | RN01, AC01 | sessão válida | abrir `/` | `<title>` "Letrume"; marca do cabeçalho "Letrume" com rótulo "Letrume, página inicial"; `h1` da tela inicial "Letrume" | — | componente (`tests/ui/portal.test.tsx`) + e2e |
| S02 | RN01, AC01 | sem sessão | abrir `/entrar` | textos dizem "acessar o Letrume" | — | componente (`tests/ui/conta.test.tsx`) |
| S03 | RN01, RN10, AC12 | sessão válida | abrir `/` e `/atlas` | cartão "Atlas de estudos" e `h1` "Mapa do Atlas" continuam | — | componente (`acesso.test.tsx` já cobre o mapa) |
| S04 | RN01, AC02 | build | ler `manifest.webmanifest` gerado | `name` "Letrume", `short_name` "Letrume"; `id`, `start_url`, `scope` e cores iguais aos atuais | — | script (`tests/scripts/deploy.test.ts`) |
| S05 | RN01, AC03 | estado com marcas | `exportBackup` | `app` = "Letrume", `version` 3, demais campos iguais | — | unitário (`backup.test.ts`) |
| S06 | RN04, AC04 | backup v3 com `app: "Atlas de Estudos"` e backup v2 | `importBackup` | mescla igual à de hoje | arquivo com `app` desconhecido e formato válido também é aceito (o campo é informativo) | unitário |
| S07 | RN01 | manifesto | ler `tituloPdf` das áreas | prefixo "Letrume ·" em vez de "Atlas de Estudos ·" | — | teste de conteúdo (`tests/scripts/conteudo-privado.test.ts`) |
| S08 | RN03, AC05 | `localStorage` com `atlas-v3` e fila com 3 itens | carregar a versão nova | estado e fila intactos; chaves `atlas-v3` e da fila não mudam | — | unitário (`store.test.ts`, `queue.test.ts`) |
| S09 | RN05, AC06 | — | abrir `/atlas/politica/m2e1` e `#/politica/m1e1` | mesma página de antes | — | e2e (já existente, roda de novo) |
| S10 | RN09, AC11 | ícone aprovado | build | `icon.svg`, `icon-192/512`, `maskable-512`, `apple-touch-icon` gerados do SVG novo por `npm run icons`; `index.html` aponta para eles | — | script (`guardas` ou `deploy.test.ts`: hash do SVG ≠ globo) |
| S11 | RN07, AC08 | origem ≠ `VITE_ORIGEM_CANONICA`, online, sessão, fila com 1 anotação | abrir o portal | a sincronização envia a fila; com fila vazia, `location.replace(canônica + caminho + busca + hash)` | erro de envio: não redireciona e tenta de novo no ciclo normal | unitário (`tests/core/origem.test.ts`) |
| S12 | RN07, AC09 | origem antiga, offline | abrir o portal | nenhum redirecionamento; o app funciona | — | unitário (`tests/core/origem.test.ts`) |
| S13 | técnico (risco: laço) | origem igual à canônica, ou variável vazia | abrir o portal | nunca redireciona | — | unitário |
| S14 | técnico (risco: perda) | origem antiga sem sessão | abrir o portal | redireciona só se a fila estiver vazia; com fila e sem sessão, permanece e pede login | — | unitário (`tests/core/origem.test.ts`) |
| S15 | RN02, RN06, RN08, AC07, AC10 | domínio configurado | pedir código; entrar em `letrume.com.br` | e-mail "Letrume" com link para o domínio; marcações baixadas | — | **verificação manual** pós-deploy (`docs/deploy.md`), pois depende de DNS e do painel do Supabase |

## Matriz de cobertura

| RN | AC | Cenários | Teste |
|---|---|---|---|
| RN01 | AC01, AC02, AC03 | S01, S02, S04, S05, S07 | portal, conta, deploy, backup, conteúdo |
| RN02 | AC07 | S15 | manual |
| RN03 | AC05 | S08 | store, queue |
| RN04 | AC04 | S06 | backup |
| RN05 | AC06 | S09 | e2e existente |
| RN06 | AC07, AC10 | S15 | manual |
| RN07 | AC08, AC09 | S11, S12, S14 | `tests/core/origem.test.ts` |
| RN08 | AC10 | S15 (+ pull já coberto em `sync.test.ts`) | manual + sync |
| RN09 | AC11 | S10 | script |
| RN10 | AC12 | S03 | componente |

Gap declarado: RN02, RN06 e RN08 em produção só têm verificação manual, porque
dependem de DNS, Vercel e Supabase configurados pelo autor.
