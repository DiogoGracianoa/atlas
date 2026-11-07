# Arquitetura

O Atlas usa React + TypeScript com Vite e uma **função Node na Vercel** para
entregar os materiais. A função valida o bearer no Supabase Auth antes de ler
os JSONs de `private/content/`. O navegador conversa diretamente com Supabase
para progresso e anotações, protegidos pelo Row Level Security do Postgres.

## Camadas

```
┌───────────────────────────────────────────────────────────────┐
│  Seções (src/sections/*)    rotas e páginas de cada seção     │
│    atlas/  → /atlas, /atlas/:area, /atlas/:area/:id           │
├───────────────────────────────────────────────────────────────┤
│  Shell (src/app) + design system (src/ui)                     │
│    roteador montado do registro, moldura, conta, ajustes      │
├───────────────────────────────────────────────────────────────┤
│  Núcleo (src/core), sem React                                 │
│    store · merge · queue · backup · content · sync · legacy   │
└───────────────────────────────────────────────────────────────┘
          │ localStorage                     │ PostgREST (supabase-js)
          ▼                                  ▼
     aparelho                         Supabase: progress, notes, prefs
```

| Módulo | Responsabilidade | Depende de |
|---|---|---|
| `core/store.ts` | estado local v3 (marcações, anotações, posição, preferências); única porta de escrita; grava antes de avisar | `localStorage` (injetado) |
| `core/merge.ts` | regras de mescla (vence o mais recente; anotação perdedora preservada); planeja o que aplicar e o que subir | — |
| `core/queue.ts` | fila de saída persistida, uma operação por linha remota, com coalescência | `localStorage` |
| `core/sync.ts` | ciclo de sincronização: conecta, busca, mescla, envia, tenta de novo; login por link e código | store, queue, merge, supabase-js (sob demanda) |
| `core/content.ts` | manifesto e currículos sob demanda, índice por área | `fetch` (injetado) |
| `core/backup.ts` | exportar e importar (v2 e v3) por mescla | merge |
| `core/legacy.ts` | tradução dos endereços antigos com `#` | — |
| `app/` | serviços, roteador, moldura, conta, ajustes, avisos | núcleo, `ui/` |
| `sections/registry.ts` | lista de seções do portal | cada seção |
| `sections/atlas/` | moldura do atlas (menu, gaveta), mapa, capa, tema, oficina, ferramentas, impressão | `app/`, `ui/`, núcleo |
| `ui/` | tokens, tema, primitivos, `Sheet`, `Toast`, `Confirm` | — |
| `sw.ts` + `sw-rules.ts` | cache offline | Workbox |

## Princípios

1. **O núcleo não conhece React.** Tudo o que decide dados (mescla, fila,
   sincronização) recebe as dependências de fora: armazenamento, relógio,
   temporizadores e carregador do Supabase. Isso torna testáveis cenários de
   dois aparelhos, rede caindo e relógio controlado, sem navegador
   ([ADR-004](adr/0004-estado-na-interface.md)).
2. **Escrita local primeiro.** A interface nunca espera a rede: o store grava no
   `localStorage`, avisa a interface e só então a sincronização enfileira o
   envio.
3. **Conteúdo é dado.** Área nova = JSON + entrada no manifesto; nenhuma linha
   de código ([conteudo.md](conteudo.md)).
4. **Seção nova não mexe no shell.** O shell só itera o registro de seções; um
   teste monta uma seção fictícia com o shell, o armazenamento e a
   sincronização reais para garantir isso
   ([ADR-003](adr/0003-registro-de-secoes.md)).
5. **Primeira tela leve.** O supabase-js é carregado sob demanda, num chunk à
   parte; o CI falha se o JS inicial passar de 150 KB gzip
   ([ADR-006](adr/0006-supabase-js-sob-demanda.md)).

## Da interface ao núcleo

O store muta o estado no lugar e emite eventos. Um contador de versão por
serviço, assinado com `useSyncExternalStore` (`app/context.tsx`), faz os
componentes redesenharem a cada evento: `useAppState()` para o estado local e
`useSyncState()` para status, usuário e erros de login.

As anotações são o caso delicado. O campo acompanha o store durante a
renderização, mas **não troca o texto enquanto tem foco**: uma atualização
vinda de outro aparelho é aplicada quando a pessoa sai do campo.

## Rotas

| Endereço | Página |
|---|---|
| `/` | início do portal (seções do registro) |
| `/atlas` | mapa de áreas |
| `/atlas/:area` | capa da área |
| `/atlas/:area/:id` | tema ou oficina |
| `/entrar` | login público obrigatório para acessar as demais telas |

- Área planejada ou desconhecida leva a `/atlas` com aviso; item desconhecido
  leva à capa.
- Os endereços antigos (`#/politica/m1e1`, `#m1e1`, `#inicio`) são traduzidos
  antes de o roteador montar, com `replaceState`
  ([ADR-002](adr/0002-roteamento.md)).

## Offline

O service worker (`src/sw.ts`, publicado em `/sw.js`):

- guarda no precache os arquivos do build, que têm hash no nome;
- serve qualquer navegação a partir do `index.html` guardado;
- nunca guarda `/api/*` ou materiais; remove o cache legado `atlas-conteudo`;
- nunca guarda nada do Supabase;
- na ativação, apaga o cache do service worker anterior (`atlas-v1`)
  ([ADR-007](adr/0007-offline-com-workbox.md)).

O comportamento atual está no [ADR-0012](adr/0012-acesso-e-conteudo-autenticados.md):
`/entrar` é público e não monta ferramentas de dados. `RequireAuth` só monta
portal e seções depois de reconhecer a sessão; durante restauração mostra
verificação, e sem sessão redireciona para o login. Sem rede, o material é
ocultado. A função valida credenciais para cada download e responde no-store.
O cache em memória é descartado ao mudar/sair da conta, inclusive respostas
tardias. A atualização não apaga o progresso local.

`npm run dev` e `npm run preview` usam o mesmo handler via middleware Vite;
a pasta privada é negada pelo servidor de desenvolvimento. Em produção só a
função recebe esses arquivos pelo `functions.includeFiles` da Vercel.

## Banco

O schema está em [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql):

- três tabelas por usuário: `progress`, `notes` e `prefs`;
- a tabela `heartbeat`, de leitura pública, usada pelo keepalive;
- RLS com a regra `auth.uid() = user_id`;
- um trigger `BEFORE UPDATE` que descarta escrita mais antiga que a
  armazenada.

Detalhes em [sincronizacao.md](sincronizacao.md).

## Qualidade

| Verificação | Onde |
|---|---|
| Tipos estritos (app e service worker) | `npm run typecheck` |
| Lint, incluindo hooks e acessibilidade (jsx-a11y) | `npm run lint` |
| Núcleo, cenários de sincronização, componentes, scripts | `npm test` |
| Rotas, recarga, offline, 320 px, axe com contraste real | `npm run e2e` |
| Migration, RLS, trigger | `bash tests/db/run.sh` |
| Conteúdo de todas as áreas | `npm run validate` |
| JS inicial ≤ 150 KB, sem segredos | `npm run size`, `npm run secrets` |

O CI (`.github/workflows/validate.yml`) roda tudo isso em todo push, nos jobs
`qualidade`, `e2e` e `banco`.
