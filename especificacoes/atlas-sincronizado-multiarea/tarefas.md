# Tarefas — Atlas multiárea com progresso sincronizado

Cada tarefa: cenário → teste RED → mudança GREEN → refatoração permitida → término.
Uma etapa termina com a suíte disponível verde, commit e pausa para revisão do autor.

## Etapa 1 — reorganização multiárea, local-first

| # | Cenário | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| T1.1 | C11 | `.gitignore` | `git check-ignore exemplos/x` falha | acrescentar `exemplos/` | comando passa |
| T1.2 | C01 | `scripts/check-extract.mjs`, `content/politica/curriculum.json` | script compara hash e falha (arquivo ausente) | extrair bytes do bloco `atlas-data` | hashes iguais; `git diff --no-index` vazio |
| T1.3 | C10, C11 | `scripts/validate.mjs`, `tests/app/fixtures/`, `tests/app/validate.test.mjs` | cada fixture inválida espera código 1 com mensagem | implementar checagens (K1, K2) | fixtures inválidas = 1; conteúdo real = 0 |
| T1.4 | C04, C05, C08 | `content/areas.json`, `content/*/.gitkeep`, `assets/lib/content.js`, `tests/app/content.test.mjs` | IDs compostos, planejada sem arquivo, fixture `historia` | manifesto com metadados copiados do JS original; índice | testes verdes; `validate` = 0 |
| T1.5 | C07 | `assets/lib/routes.js`, `tests/app/routes.test.mjs` | tabela de rotas, incluindo legadas e inválidas | `parseRoute`/`hrefFor` | verde |
| T1.6 | L01, L02, L04, L05, S11 (local) | `assets/lib/store.js`, `tests/app/store.test.mjs` | escrita síncrona com `at`; migração v2; preferências fora da fila; reset | store v3 com `localStorage` injetável | verde |
| T1.7 | B01–B04 | `assets/lib/backup.js`, `assets/lib/merge.js` (`mergeNote` básico), `tests/app/backup.test.mjs` | export v3; import v2/v3 por mescla; nota anexada | implementar | verde |
| T1.8 | C02, C03, C06, C09, C12, C13 | `index.html`, `assets/app.css`, `assets/app.js`, `scripts/serve.mjs` | comparação no navegador falha (app ausente) | portar render sem mudar textos; mapa, capa, seletor, busca, cores do manifesto | 36/36 itens idênticos; cores corretas em claro/escuro; rede só `areas.json` na abertura |
| T1.9 | P02 (parcial) | `.github/workflows/validate.yml` | — (CI) | validate + `node --test` + grep anti-`exemplos/` | YAML válido; execução local dos mesmos comandos verde |
| T1.10 | — | commit | — | versionar app + framework SDD + especificação (P11) | commit "Etapa 1" e resumo ao autor |

## Etapa 2 — banco

| # | Cenário | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| T2.1 | D01–D04 | `tests/db/stub-auth.sql`, `tests/db/test.sql`, `tests/db/run.sh` | testes falham sem migration | — | testes escritos |
| T2.2 | D01–D04 | `supabase/migrations/0001_init.sql` | — | SQL do autor + adendo (`area`, índices) + trigger LWW | verde no Docker (local se o daemon estiver ativo; senão na Action) |
| T2.3 | P02 | `validate.yml` | — | job `db` com serviço `postgres:16` | YAML válido; commit "Etapa 2" |

## Etapa 3 — autenticação

| # | Cenário | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| T3.1 | A04, A05, S08 | `assets/sync.js`, `tests/app/sync-auth.test.mjs` (cliente falso) | status sem login; falha de import do CDN; logout mantém dados | `sync.init` com `import()` dinâmico e cliente injetável | verde |
| T3.2 | A01–A03 | `assets/config.js`, `index.html`, `assets/app.js` | verificação no navegador: tela, validação de e-mail, campo de código | tela mínima; PKCE; `verifyOtp`; limpeza da query | navegador ok; e2e-real declarado; commit "Etapa 3" |

## Etapa 4 — sincronização + offline

| # | Cenário | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| T4.1 | S01–S05 | `assets/lib/merge.js`, `tests/app/merge.test.mjs` | LWW, base, conflito, linhas | implementar | verde |
| T4.2 | S06, S07, S10 | `assets/lib/queue.js`, `tests/app/queue.test.mjs` | persistência, coalescência, classificação de erro, linha ignorada | implementar | verde |
| T4.3 | L03, S09, S12, S13, S11 (global) | `assets/sync.js`, `tests/app/sync.test.mjs` (timers e cliente falsos) | debounce 800 ms, gatilhos com intervalo de 15 s, `last_at`, merge no login, reset em lote | pull/push | verde |
| T4.4 | O01–O03 | `sw.js`, `index.html` | navegador offline falha ao recarregar | SW (D6) | O01–O03 no navegador; commit "Etapa 4" |

## Etapa 5 — deploy

| # | Cenário | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| T5.1 | R4 | `vercel.json` | — | headers: `index.html`/`sw.js` `no-cache`; `assets/`/`content/` `max-age=300, must-revalidate` | JSON válido |
| T5.2 | — | `README.md` | checklist de seções da visão | escrever | todas as seções presentes; commit "Etapa 5" |

## Etapa 6 — keepalive

| # | Cenário | Arquivos prováveis | Teste RED | Mudança GREEN | Término |
|---|---|---|---|---|---|
| T6.1 | P01 | `.github/workflows/keepalive.yml` | — | `schedule` diário + `workflow_dispatch`; `curl -w '%{http_code}'`; falha se ≠ 200 ou secret vazio | YAML válido; commit "Etapa 6"; execução real depende dos secrets |

## Registro de implementação — Etapa 1 (2026-11-04)

| Cenário | Evidência | Resultado |
|---|---|---|
| C01 | `node scripts/check-extract.mjs` + `git diff --no-index` | idêntico, SHA-256 `f9896542…a43e694`, 198 397 bytes |
| C02 | navegador: SHA-256 do texto do `#page` e do cabeçalho, original × novo, capa + 36 itens | 37/37 idênticos |
| C03 | navegador: cor da etiqueta de `m1e1`, `m3e1`, `m5e2`, `m6e1` em claro e escuro | 8/8 iguais ao original |
| C05, C07, C08, C12, C13 | `tests/app/routes.test.mjs`, `content.test.mjs` + navegador (`#/historia` → mapa; `#m1e1` → `#/politica/m1e1`; cartão "Continuar") | verde |
| C06 | navegador: `performance` na abertura e após reabrir a área | só `areas.json`; currículo 1× por sessão |
| C09 | navegador: "Gramsci" → 3 resultados + atalho; atalho agrupa por área | ok |
| C10, C11 | `tests/app/validate.test.mjs` (22 casos) | verde |
| L01, L02, L04, L05, S11 local | `tests/app/store.test.mjs` | verde |
| B01–B04 | `tests/app/backup.test.mjs` | verde |
| C04 (navegador) | não executado: coberto por fixture unitária e por grep (nenhum texto de área em `assets/`, só a constante `LEGACY_AREA` das rotas/backup v2) | lacuna menor |

Decisões de implementação:

- `--brand` (cor neutra do app, igual ao azul-ardósia original) colore o mapa; as cores de área ficam em `--c-<área>-<tradição>`.
- Texto do mapa e do cartão "Continuar" é texto do app, não de área.
- `.gitattributes` com `eol=lf` (o Git local usa `core.autocrlf=true`).
- `.claude/launch.json` sobe `scripts/serve.mjs` na porta 8080 para o navegador embutido.

## Registro de implementação — Etapa 2 (2026-11-04)

| Cenário | Evidência | Resultado |
|---|---|---|
| D01 | `bash tests/db/run.sh` sem o trigger | RED: upsert de 10:00 sobrescreveu o de 10:05 |
| D01, D02 | idem, com o trigger (`progress`, `notes`, `prefs`) | verde; escrita antiga não retorna linha (base do S10) |
| D03 | RLS: U2 não lê, não insere, não altera linhas de U1 | verde |
| D04 | `anon` lê `heartbeat`, sem acesso a `progress` | verde |
| técnico | reenvio com mesmo horário aceito; `updated_at` padrão; `on delete cascade` | verde |

19 asserções, PostgreSQL 16 (imagem `postgres:16-alpine`) com stub de `auth` em `tests/db/stub-auth.sql`.

Decisões de implementação:

- Função do trigger `public.descarta_escrita_antiga()` com `search_path = ''` e `execute` revogado de `public`, `anon` e `authenticated`: só o trigger a usa, ela não vira RPC.
- Empate de horário é aceito (reenvio idempotente da fila).
- O stub não reproduz o PostgREST nem o JWT real: a semântica do upsert foi testada com o SQL que o PostgREST gera (`on conflict … do update set … = excluded.…`). A confirmação contra o Supabase real fica no roteiro e2e-real.

## Registro de implementação — Etapa 3 (2026-11-04)

| Cenário | Evidência | Resultado |
|---|---|---|
| A01–A05, S08 (auth) | `tests/app/sync-auth.test.mjs` (12 casos, cliente falso): sem config, opções PKCE, sessão, online/offline, CDN indisponível com nova tentativa, pedir/verificar código, logout, limpeza de `?code` e `?error_code=otp_expired` | RED com stub, depois verde |
| A01, A02, A04 (navegador) | Supabase falso servido localmente, `config.js` apontado para ele só durante o teste | e-mail → tela do código; código errado → mensagem; código certo → "Sincronizado" + aviso; sessão sobrevive ao recarregar; sair mantém 2 marcações e a nota |
| A03 (navegador) | `/?code=bom#/politica/m2e1` | logado, URL limpa, rota preservada |
| link expirado | `/?error_code=otp_expired…` | URL limpa, tela de login abre com a explicação |
| A05 (navegador) | módulo inacessível | app navega e marca; indicador "Não sincronizado"; tela explica |
| sem configuração | `config.js` vazio (estado do commit) | "Não sincronizado"; nenhuma requisição ao CDN |
| CDN real | `import()` de `@supabase/supabase-js@2.118.0` | `createClient`, `signInWithOtp`, `verifyOtp`, `signOut` presentes |

Decisões de implementação:

- **D4 revista:** supabase-js `2.118.0` (15/10/2026, a mais recente com ≥ 14 dias) pelo jsDelivr `+esm`, não pelo esm.sh. Nenhum dos dois entrega arquivo único; o esm.sh puxa polyfills sem versão na URL (`/node/buffer.mjs`), o jsDelivr resolve tudo com versão fixa (9 arquivos, ~80 KB), o que permite cache seguro no service worker (Etapa 4).
- Código aceito com 6 a 10 dígitos (o Supabase permite configurar o tamanho); a tela pede 6.
- `signOut({ scope: "local" })`: sai só deste aparelho.
- Até a Etapa 4, "Sincronizado" significa apenas sessão ativa e online; a troca de dados ainda não existe.
- Indicador: ponto no cabeçalho (celular) e linha no menu (computador, onde o cabeçalho some); campos com fonte de 16 px para o iOS não dar zoom.

Não verificado: Supabase real (envio de e-mail, PKCE de verdade, template com código) — roteiro e2e-real após o passo manual.
