# Especificação — Atlas multiárea com progresso sincronizado

Base: `visao.md` (RN01–RN32, AC01–AC28). Níveis de teste:

- **unit** — `node --test tests/app/` (Node 22, sem dependências), módulos puros de `assets/lib/`.
- **script** — `node scripts/validate.mjs` e scripts de verificação de conteúdo.
- **db** — `tests/db/` contra PostgreSQL 16 em Docker com stub de `auth` (local e na Action).
- **browser** — verificação dirigida no navegador embutido contra `node scripts/serve.mjs`.
- **e2e-real** — dois aparelhos reais contra o projeto Supabase do autor; só possível depois do passo manual do README.

Convenções: `K(area,id,mark)` = chave de marcação `politica/m1e1:def`; horários em ISO 8601 UTC.

## Conteúdo e estrutura

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| C01 | RN01, AC01 | HTML original em `exemplos/` | bloco `atlas-data` | extrair para `content/politica/curriculum.json` | SHA-256 do bloco = SHA-256 do arquivo; `git diff --no-index` vazio | qualquer byte diferente reprova | script |
| C02 | RN01, AC02 | servidor local; original e novo abertos | os 36 itens | comparar texto do `#page` (exceto pager, anotações e prompt) item a item | 36/36 idênticos | divergência lista item e trecho | browser |
| C03 | RN22, AC18 | `areas.json` com `tradicoes` | tema `m3e1` (`marx`) | renderizar em claro e escuro | etiqueta "Marxismo", cor `#A4213A` / `#F2869C` | tradição ausente cai na primeira tradição da área e `validate` acusa | browser + script |
| C04 | RN02, AC03 | currículo fictício `historia` em fixture | entrada `disponivel` | carregar manifesto e navegar | área no mapa e navegável sem mudar `assets/` | — | unit (fixture) + browser |
| C05 | RN03, AC04 | `historia` planejada | `#/historia` | rotear | mapa; cartão cinza "em breve" sem link | — | unit + browser |
| C06 | RN05, AC11 | sessão nova | abrir `#/` | observar rede | só `content/areas.json`; currículo uma vez por sessão ao abrir a área | segunda busca na mesma sessão reprova | browser |
| C07 | RN06, AC12 | — | `#/`, `#/politica`, `#/politica/m1e1`, `#m1e1`, `#inicio`, `#/xyz` | `parseRoute` | mapa, capa, tema, tema (legado), mapa (legado), mapa | rota inválida nunca lança exceção | unit |
| C08 | RN04 | currículo carregado | IDs curtos | indexar | `politica/m1e1` … 36 IDs; oficina `politica/m1of` | — | unit |
| C09 | RN21, AC17 | política aberta | "Gramsci" | buscar | resultados da área + atalho "buscar em todas"; atalho carrega áreas disponíveis e agrupa por área | área sem rede no atalho mostra aviso e segue | browser |
| C10 | RN19, AC14 | fixtures inválidas | tema sem `check`; ID duplicado; URL `http://`; sem `book` e sem `bridge`; arquivo ausente; tradição inexistente (técnico) | `validate.mjs` | código 1 com `área/tema: campo` por erro | — | script |
| C11 | RN20, AC16 | clone sem `exemplos/` | — | rodar validate, testes e Action | passam | referência a `exemplos/` em `assets/`, `scripts/`, `.github/` reprova (grep na Action) | script |
| C12 | RN28, AC24 | `lastAt = politica/m2e3` | abrir sem hash | render do mapa | cartão "Continuar de onde parei" → `#/politica/m2e3` | sem `lastAt`, sem cartão | unit + browser |
| C13 | técnico | mapa | marcações locais de política; total da área conhecido | render do mapa | progresso `%` por área usando total em cache; sem total, "N marcos concluídos" | — | unit |

## Estado local

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| L01 | RN07, AC08 | deslogado | marcar `def` de `politica/m1e1` | `store.setMark` | `localStorage` atualizado com `{done:true, at}` e UI re-renderizada antes de qualquer `await` | `localStorage` indisponível: segue em memória (como hoje) | unit |
| L02 | RN07 | — | desmarcar | `store.setMark(false)` | `{done:false, at novo}` (não apaga a entrada) | — | unit |
| L03 | RN09 | nota aberta | digitação contínua | `store.setNote` | grava local a cada `input`; envio remoto só 800 ms após a última tecla | — | unit (timers falsos) |
| L04 | técnico | chave `atlas-estudos-v2` no mesmo origin | estado v2 | primeira carga | convertido para v3 com prefixo `politica/` e `at` = agora; chave v2 preservada | JSON corrompido: ignora | unit |
| L05 | RN27, AC23 | — | mudar tamanho/tema | `store.setPref` | só `localStorage`; nada entra na fila | — | unit |

## Backup

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| B01 | RN16, AC13 | estado com 2 áreas | — | exportar | arquivo v3 com marcações, anotações e `at` de todas as áreas | — | unit |
| B02 | RN26, AC22 | local `m1e1:def` 10:00 | backup v2 com `m1e2:def` | importar | ambos marcados; `m1e2:def.at` = momento da importação; operações vão para a fila | arquivo sem `done`/`notes` objeto: alerta e nada muda | unit |
| B03 | RN26 | local 10:05, backup v3 10:00 para a mesma chave | — | importar | local permanece | — | unit |
| B04 | RN26, RN31 | nota local "A", backup v2 com "B" | — | importar | "B" vence (horário da importação) e "A" é anexada com marcador | — | unit |

## Sincronização

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| S01 | RN10, AC10 | local `at` 10:00, remoto 10:05 | marcação | `mergeMark` | remoto vence; nada enfileirado | — | unit |
| S02 | RN10, RN14, AC09 | 5 locais, 3 remotas distintas | — | merge na carga | 8 no local; 5 enfileiradas para subir | — | unit |
| S03 | RN31, AC27 | `base`=X; local "A" 10:00; remoto "B" 10:05 | nota | `mergeNote` | "B\n\n— versão de outro aparelho (dd/mm/aaaa hh:mm) —\nA", `at` novo, enfileirada | textos iguais: sem marcador | unit |
| S04 | RN10 | local = `base`, remoto mudou | nota | `mergeNote` | remoto substitui sem marcador | — | unit |
| S05 | RN08 | duas mudanças em itens diferentes | marcação + nota | `toRows` | duas linhas independentes (`progress` e `notes`), cada uma com `area` e `item_id` | — | unit |
| S06 | RN11, AC07 | offline | 3 marcações | enfileirar e tentar | fila persistida com 3 operações; evento `online` → envio; fila vazia após sucesso | erro 4xx de validação: descarta operação e registra no console sem dados pessoais; erro de rede/5xx: mantém | unit (cliente falso) |
| S07 | técnico | fila com 2 operações na mesma chave | — | enfileirar | coalesce: só a mais recente | — | unit |
| S08 | RN12 | — | estados | `status` | `nao-sincronizado` (sem login), `sincronizando`, `sincronizado`, `offline` | — | unit + browser |
| S09 | RN24, AC20 | logado | `visibilitychange` visível; `online` | gatilhos | um `pull` por gatilho, com intervalo mínimo de 15 s entre `pull`s | — | unit |
| S10 | RN23, AC19 | upsert com `updated_at` mais antigo | — | resposta sem a linha (ignorada pelo trigger) | cliente marca a chave para revalidar no próximo `pull` | — | unit |
| S11 | RN25, AC21 | 10 marcações, 2 notas | confirmar Zerar | `store.resetAll` | todas `done:false`, notas `""`, `at` novo, tudo enfileirado em lote | cancelar não altera nada | unit |
| S12 | RN28 | — | abrir tema | `store.setLastAt` | `lastAt` local + linha `prefs.last_at` | — | unit |
| S13 | RN13 | deslogado | marcações | — | nada enviado; ao logar, merge S02 sobe tudo | — | unit |

## Banco

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| D01 | RN23, AC19 | linha 10:05 | upsert 10:00 | `insert … on conflict do update` | linha inalterada | — | db |
| D02 | RN23 | linha 10:00 | upsert 10:05 | idem | linha atualizada | — | db |
| D03 | técnico (RLS) | usuários U1 e U2 | U2 lê/escreve linha de U1 | `select`/`insert` como `authenticated` | 0 linhas / violação de RLS | — | db |
| D04 | RN18 | — | `anon` | `select * from heartbeat` | 1 linha | `anon` em `progress` sem acesso | db |

## Autenticação

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| A01 | RN15, RN29 | deslogado | e-mail | `signInWithOtp({shouldCreateUser:false})` | mensagem "confira sua caixa de entrada" + campo de código | e-mail inválido: mensagem no campo; erro remoto: mensagem genérica sem detalhar se a conta existe | browser + e2e-real |
| A02 | RN29, AC25 | e-mail enviado | código de 6 dígitos | `verifyOtp({type:'email'})` | sessão ativa, merge inicial | código errado/expirado: mensagem e permite reenviar | e2e-real |
| A03 | RN15 | link aberto no mesmo navegador | `?code=` | `exchangeCodeForSession` (PKCE) | logado; query removida da URL; rota hash preservada | — | e2e-real |
| A04 | RN32, AC28 | logado | sair | `signOut` | dados locais e fila mantidos; status `nao-sincronizado` | — | unit + browser |
| A05 | RN13 | sem rede ou CDN indisponível | abrir app | importar supabase-js dinamicamente | app funciona; status `offline`/`nao-sincronizado` | — | browser |

## Offline

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| O01 | RN17, RN30, AC07 | app visitado com política aberta | modo offline do navegador | recarregar e navegar | abre, navega, marca; status `offline` | — | browser |
| O02 | RN30, AC26 | área nunca aberta | offline | abrir área | aviso "precisa de conexão na primeira abertura" | — | browser |
| O03 | técnico | online, rede lenta | requisição de shell | SW network-first com timeout de 3 s | serve cache após 3 s; atualiza cache em segundo plano | — | browser |

## Operação

| ID | Origem | Pré-condição | Entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|---|
| P01 | RN18, AC15 | secrets definidos | agenda diária / manual | `curl` GET `/rest/v1/heartbeat?select=id` | sucesso com 200 | status ≠ 200 ou secret ausente: job falha | e2e-real (Action) |
| P02 | RN19 | push | — | Action `validate` | validate + testes unit + testes db passam | qualquer falha reprova | script |

## Matriz de cobertura

| RN | AC | Cenários | Teste |
|---|---|---|---|
| RN01 | AC01, AC02 | C01, C02 | script, browser |
| RN02 | AC03 | C04 | unit, browser |
| RN03 | AC04 | C05 | unit, browser |
| RN04 | AC05, AC09 | C08 | unit |
| RN05 | AC11 | C06 | browser |
| RN06 | AC12 | C07 | unit |
| RN07 | AC07, AC08 | L01, L02 | unit |
| RN08 | AC06 | S05 | unit |
| RN09 | AC06 | L03 | unit |
| RN10 | AC09, AC10, AC27 | S01, S02, S04 | unit |
| RN11 | AC07, AC19 | S06, S07, S10 | unit |
| RN12 | AC07, AC08 | S08 | unit, browser |
| RN13 | AC08 | S13, A05 | unit, browser |
| RN14 | AC09 | S02 | unit |
| RN15 | AC05, AC25 | A01, A03 | browser, e2e-real |
| RN16 | AC13, AC22 | B01–B04 | unit |
| RN17 | AC07, AC26 | O01, O02 | browser |
| RN18 | AC15 | D04, P01 | db, e2e-real |
| RN19 | AC14, AC16 | C10, P02 | script |
| RN20 | AC16 | C11 | script |
| RN21 | AC17 | C09 | browser |
| RN22 | AC18 | C03 | browser, script |
| RN23 | AC19 | D01, D02, S10 | db, unit |
| RN24 | AC20 | S09 | unit |
| RN25 | AC21 | S11 | unit |
| RN26 | AC22 | B02, B03, B04 | unit |
| RN27 | AC23 | L05 | unit |
| RN28 | AC24 | C12, S12 | unit, browser |
| RN29 | AC25 | A01, A02 | e2e-real |
| RN30 | AC26 | O01, O02 | browser |
| RN31 | AC27 | S03, B04 | unit |
| RN32 | AC28 | A04 | unit, browser |

**Gaps declarados**

| Gap | Motivo | Dono | Fechamento |
|---|---|---|---|
| AC05, AC06, AC20, AC21, AC25 de ponta a ponta | exigem o projeto Supabase real e dois aparelhos | autor (cria o projeto) | roteiro e2e-real no README, executado após o passo manual |
| Comportamento no iOS Safari real | sem aparelho iOS no ambiente | autor | checklist no README |
| Testes db locais | Docker instalado, mas daemon parado nesta máquina | autor / Action | rodam na Action com serviço PostgreSQL; localmente quando o Docker Desktop estiver ativo |
