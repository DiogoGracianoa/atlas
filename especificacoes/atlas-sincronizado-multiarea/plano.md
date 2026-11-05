# Plano técnico — Atlas multiárea com progresso sincronizado

Fontes: `visao.md`, `especificacao.md`, código de `exemplos/atlas-de-estudos-política.html`.
Não há `.sdd/` no repositório; as decisões abaixo ficam aqui e no histórico de
commits até que `$inicializar` crie a memória durável.

## Objetivos técnicos

1. Separar código e conteúdo sem alterar um byte do conteúdo (RN01).
2. Tornar o app genérico por área: nenhum texto, cor ou contagem de área no JS (RN02, RN22).
3. Persistência local com horário por entrada, base para merge e fila (RN07–RN11).
4. Sincronização Supabase opcional: o app inicia e funciona sem rede, sem CDN e sem login (RN13, RN17).
5. Operação: validação de conteúdo e keepalive em GitHub Actions (RN18, RN19).

## Estrutura alvo

```
index.html                 # marcação do original + login, indicador, seletor de área
sw.js                      # service worker (precisa estar na raiz para escopo /)
vercel.json
assets/app.css             # CSS do original, sem as cores fixas de tradição
assets/app.js              # UI, render, rotas (entrada, type=module)
assets/sync.js             # Supabase: auth, pull, push, fila, gatilhos
assets/config.js           # SUPABASE_URL, SUPABASE_ANON_KEY, versão do supabase-js
assets/lib/content.js      # manifesto, carga sob demanda, índice com IDs compostos
assets/lib/routes.js       # parseRoute / hrefFor, incluindo rotas legadas
assets/lib/store.js        # estado local v3, migração v2, preferências, lastAt
assets/lib/merge.js        # mergeMark, mergeNote (LWW + preservação de conflito)
assets/lib/queue.js        # fila persistida com coalescência por chave
assets/lib/backup.js       # exportar v3, importar v2/v3 por mescla
content/areas.json
content/politica/curriculum.json
content/{historia,economia,filosofia,ciencia,tecnologia}/.gitkeep
supabase/migrations/0001_init.sql
scripts/validate.mjs       # Node puro
scripts/serve.mjs          # servidor estático local para desenvolvimento (Node puro)
scripts/check-extract.mjs  # verificação única de C01 (lê exemplos/ se existir; silencioso se ausente)
tests/app/*.test.mjs       # node --test
tests/app/fixtures/        # manifestos e currículos válidos/inválidos de teste
tests/db/                  # stub de auth + testes SQL do trigger e RLS
.github/workflows/validate.yml
.github/workflows/keepalive.yml
.gitignore                 # exemplos/
README.md
```

`assets/lib/` não estava na lista da Etapa 1. Existe para que merge, fila,
rotas e backup sejam módulos puros testáveis em Node sem navegador (D3).

## Responsabilidades e fronteiras

| Módulo | Responsabilidade | Não faz |
|---|---|---|
| `app.js` | render (portado sem mudanças de texto), navegação, eventos, telas de login | rede com Supabase |
| `store.js` | única porta de escrita do estado; grava `localStorage` primeiro; emite eventos `change` | rede |
| `sync.js` | importa supabase-js dinamicamente; sessão; `pull` → `merge` → `store`; `push` da fila; status | render |
| `merge.js` / `queue.js` / `backup.js` / `routes.js` / `content.js` | funções puras ou com dependências injetadas | DOM |
| `sw.js` | cache do shell, manifesto, currículos visitados, CDN e fontes | cachear a API do Supabase |

Fluxo de escrita: UI → `store.setMark` → `localStorage` → re-render → `store`
emite `change(op)` → `sync` enfileira → envia (marcação imediata, nota após
800 ms) → sucesso remove da fila; falha de rede mantém e status `offline`.

Fluxo de leitura: abertura/visibilidade/online → `sync.pull` (2 `select`s + 1 de
`prefs`, todas as áreas) → `merge` por entrada → `store.applyRemote` →
re-render se algo mudou → enfileira o que o local venceu.

## Decisões

| # | Decisão | Alternativas | Motivo | Revisar quando |
|---|---|---|---|---|
| D1 | `curriculum.json` byte-idêntico; metadados da área em `areas.json` | chave extra no currículo; arquivo por área | resposta P2; prova por hash | manifesto passar de ~50 KB |
| D2 | `updated_at` do cliente + trigger `BEFORE UPDATE` que retorna `NULL` se `new.updated_at < old.updated_at` | `now()` do servidor; RPC | resposta P3; preserva LWW com fila offline; upsert simples continua funcionando | relógio de aparelho muito errado (risco R2) |
| D3 | lógica em `assets/lib/*.js` como ES modules, testados com `node --test` | tudo em `sync.js`; Playwright | sem dependências, sem build | — |
| D4 | supabase-js por `import()` dinâmico de `esm.sh` com versão fixada (`?bundle`, arquivo único) | import estático; vendorizar | app sobe sem rede/CDN; um arquivo é fácil de cachear no SW. Versão: a mais recente com ≥ 14 dias, confirmada por `npm view` na implementação | CDN instável |
| D5 | PKCE para o link + `verifyOtp` para o código | fluxo implícito | link não usa `#access_token` (não colide com rotas hash); o código cobre aparelho diferente e atalho do iOS | — |
| D6 | SW network-first com timeout de 3 s para mesmo origin; cache-first para CDN fixado e fontes; API do Supabase nunca cacheada | cache-first com versão manual | sem build não há hash; network-first dispensa lembrar de trocar versão | uso offline muito lento |
| D7 | progresso no mapa: feitos contados das marcações locais; total da área guardado em `localStorage` na primeira abertura da área | total no manifesto; carregar todos os currículos | respeita carga sob demanda; total no manifesto desatualizaria | — |
| D8 | conflito de nota detectado por `base` (último texto/horário sincronizado) guardado por nota | comparar só horários | resposta P9 exige saber se os dois lados mudaram | — |
| D9 | cores de tradição injetadas como `<style>` gerado do manifesto, replicando as três regras do original (claro, `prefers-color-scheme`, `data-theme=dark`) | estilo inline por elemento | mantém o comportamento exato do CSS original | — |
| D10 | `pull` com intervalo mínimo de 15 s entre gatilhos | sem limite | evita rajadas ao alternar abas no celular | — |
| D11 | colunas `size`/`theme` de `prefs` mantidas na migration, sem uso | removê-las | schema fornecido pelo autor; P6a só decide o uso | — |
| D12 | commits por etapa em `main`, sem push até o autor pedir | branch por etapa | pedido "commit ao fim de cada etapa"; nada conectado à Vercel ainda | Vercel conectada antes da Etapa 4 |

## Ordem de execução (uma etapa = um commit, com pausa para revisão)

1. **Etapa 1 — reorganização multiárea, local-first.** Extração byte a byte, manifesto com metadados, `app.js` genérico, mapa/capa/tema, rotas, seletor de área, busca com atalho, `store` v3 (com `at`, `base`, migração v2), backup v3/v2 por mescla, Zerar (local por enquanto, mesma semântica), `validate.mjs`, testes unit, `serve.mjs`, `validate.yml` (validate + unit), `.gitignore`, framework SDD versionado (P11).
2. **Etapa 2 — banco.** Migration fornecida com o adendo (coluna `area` e índices) + trigger LWW nas três tabelas; `tests/db/`; job db na `validate.yml`.
3. **Etapa 3 — autenticação.** `config.js`, `sync.js` (sessão, PKCE, código), tela de login, logout que mantém dados, indicador `nao-sincronizado`.
4. **Etapa 4 — sincronização + offline.** `merge`, `queue`, pull/push, debounce, gatilhos, conflito de nota, `prefs.last_at`, Zerar global, importação enfileirada, `sw.js`.
5. **Etapa 5 — deploy.** `vercel.json`, README completo (Supabase, template de e-mail com código, cadastro desativado após criar a conta, URL de redirecionamento, Vercel, tabela de áreas, formato do currículo, área nova em 5 passos, `exemplos/`, roteiro e2e-real).
6. **Etapa 6 — keepalive.** `keepalive.yml` diário + `workflow_dispatch`.

## Validação disponível

| Comando | Cobre | Disponível agora |
|---|---|---|
| `node scripts/validate.mjs` | C10, C11 | sim (Node 22.23.3) |
| `node --test tests/app/` | L*, B*, S*, C07, C08, C12, C13 | sim |
| `node scripts/check-extract.mjs` | C01 | sim (lê `exemplos/` só se existir) |
| `tests/db/run.sh` (Docker) | D01–D04 | Docker instalado, daemon parado; roda na Action |
| navegador embutido + `node scripts/serve.mjs` | C02–C06, C09, C12, O01–O03, A04, A05 | sim |
| projeto Supabase real | A01–A03, P01, AC05/06/20/21/25 | não — depende do passo manual |

## Riscos

| # | Risco | Mitigação |
|---|---|---|
| R1 | GitHub desativa workflows agendados em repositório público após 60 dias sem atividade | aviso no README; o GitHub manda e-mail antes; reativar é um clique |
| R2 | relógio de um aparelho muito adiantado vence sempre | aparelhos usam hora de rede; documentado; revisar D2 se acontecer |
| R3 | iOS limpa armazenamento de sites não usados por 7 dias (ITP) | dados ficam no Supabase; o merge no próximo login restaura; fila pendente pode se perder se offline há 7+ dias sem abrir |
| R4 | SW servindo versão antiga após deploy | network-first (D6); `sw.js` com `no-cache` no `vercel.json` |
| R5 | supabase-js por CDN fora do ar | app segue local; fila espera |
