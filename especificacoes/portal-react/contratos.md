# Contratos — Portal Atlas em React

Os contratos K1 (manifesto), K2 (currículo), K3 (tabelas do Supabase), K4
(estado local) e K5 (backup) de `especificacoes/atlas-sincronizado-multiarea/
contratos.md` continuam valendo **sem alteração**. A única mudança é que os
arquivos de K1 e K2 passam a ficar em `public/content/` (ADR-010), servidos em
`/content/...`, os mesmos caminhos públicos de hoje.

## KR1 — Rotas do portal · v1 · dono: app

| Rota | Página | Regra |
|---|---|---|
| `/` | início do portal | lista o registro de seções (KS1) |
| `/atlas` | mapa de áreas | — |
| `/atlas/:area` | capa da área | área `planejado` ou desconhecida: redireciona para `/atlas` e mostra aviso |
| `/atlas/:area/:id` | tema ou oficina | `id` desconhecido na área: redireciona para `/atlas/:area` |
| `/{seção}/...` | rotas declaradas pela seção | — |
| qualquer outra | — | redireciona para `/` e mostra aviso |

- **Invariantes:**
  - `:area` segue `[a-z0-9-]+`;
  - `:id` é o ID curto do currículo;
  - a chave canônica de estado continua `área/id` (K4);
  - rotas novas de seção nunca colidem com `/atlas`.
- **Query:** `?code=` e `?error_description=` são reservados para o retorno do
  login e removidos com `replaceState` depois de tratados.
- **Compatibilidade:** KR2.

## KR2 — Tradução de endereços antigos · v1 · dono: app

`legacyToPath(hash: string): string | null`, executada antes de montar o
roteador. Quando retorna um caminho, o app usa `history.replaceState` para
trocar o endereço.

| Hash de entrada | Saída |
|---|---|
| `""` ou `#` | `null` (sem redirecionamento) |
| `#/` | `/atlas` |
| `#/{área}` | `/atlas/{área}` |
| `#/{área}/{id}` | `/atlas/{área}/{id}` |
| `#inicio` | `/atlas/politica` |
| `#{id}` (formato `m\d+(e\d+|of)`) | `/atlas/politica/{id}` |
| outro hash | `/atlas` |

- **Invariante:** nunca lança exceção; é uma função pura sobre a string.

## KS1 — Registro de seções · v1 · dono: app

```ts
type SectionStatus = "disponivel" | "planejado";

interface Section {
  slug: string;            // prefixo da rota, [a-z0-9-]+, único; "atlas", "dossies"
  nome: string;            // "Atlas de estudos"
  resumo: string;          // uma frase para o cartão
  status: SectionStatus;
  routes?: RouteObject[];  // obrigatório se disponivel; caminhos relativos ao prefixo
  Card?: ComponentType;    // cartão próprio opcional (por exemplo, com progresso)
}

export const sections: Section[];
```

- **Invariantes:**
  - `slug` é único e não pode ser vazio;
  - `disponivel` exige `routes`;
  - `planejado` não gera rota e aparece como "em breve", sem link.
- **Seção nova (RN08):** basta criar `src/sections/{slug}/` e acrescentar uma
  entrada. O shell não importa nada de seção específica fora do registro.
- **Erros:** registro inválido (por exemplo, `slug` duplicado) quebra o teste
  `portal.test.tsx` e o build de tipos, nunca o runtime em produção.

## KC1 — Configuração pública · v1 · dono: deploy

| Variável | Uso | Vazia |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | modo só local |
| `VITE_SUPABASE_ANON_KEY` | chave pública (anon ou publishable) | modo só local |

- **Invariantes:**
  - nenhuma outra variável `VITE_*` contém segredo;
  - `service_role` ou `sb_secret_` em qualquer arquivo ou no bundle reprova Q03.
- **Onde:** variáveis de ambiente do projeto na Vercel; `.env.local` no
  desenvolvimento (não versionado); `.env.example` versionado, com os valores
  vazios.

## KW1 — Cache do service worker · v1 · dono: app

| Requisição | Estratégia |
|---|---|
| arquivos do build (precache, com hash) | cache, atualizado a cada versão |
| navegação (qualquer rota do app) | `index.html` do precache |
| `/content/areas.json` | rede primeiro (3 s), com cache como reserva |
| `/content/*/curriculum.json` | rede primeiro (3 s), com cache como reserva; entra no cache só quando a área é aberta |
| domínio do Supabase | nunca em cache |
| fontes | empacotadas no build (precache) |

- **Migração:**
  - o service worker é publicado em `/sw.js`, o mesmo caminho do antigo;
  - na ativação, apaga o cache `atlas-v1`;
  - usa `skipWaiting` e `clientsClaim`.

## Extensão 2026-11-05 — KR1 v1.1

| Rota | Página | Regra |
|---|---|---|
| `/entrar` | login do autor (RN18) | sem link em nenhuma página; depois de entrar, vai para `/atlas` |

Estado local acrescentado, fora do K4 e nunca sincronizado: a chave
`atlas-conta-vista` com o valor `"1"`, gravada na primeira autenticação bem
sucedida neste aparelho. Ela só controla a visibilidade da interface de conta.

## Extensão 2026-11-05 — KR2 v1.1 e reescrita na Vercel

- **KR2:** a tradução só roda quando `location.pathname === "/"`. O site antigo
  era uma página só, na raiz; em outras rotas o hash pertence ao app novo.
- **Vercel:** a reescrita para `index.html` exclui `/assets/`, `/content/` e
  `/icons/`, para que um arquivo ausente dê 404, e não HTML com status 200.
