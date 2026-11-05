# Contratos — Atlas multiárea com progresso sincronizado

## K1 — `content/areas.json` (manifesto) · v1 · dono: autor do conteúdo

```json
{
  "areas": [
    {
      "slug": "politica",
      "nome": "Política, economia e marxismo",
      "resumo": "Do vocabulário básico à economia política avançada.",
      "status": "disponivel",
      "arquivo": "content/politica/curriculum.json",
      "titulo": "Atlas de política, economia e marxismo",
      "subtitulo": "Trilha de política, economia e marxismo",
      "tituloPdf": "Atlas de Estudos · Política, Economia e Marxismo",
      "capa": {
        "rotulo": "TRILHA DE ESTUDOS",
        "lead": "Sete módulos, {temas} temas. Cada tema traz …",
        "passos": [{ "t": "Leia a definição", "d": "…" }]
      },
      "tradicoes": {
        "politica": { "nome": "Ciência política", "cor": "#4A5E70", "corEscura": "#9DB4CA" }
      },
      "promptBase": "Você é meu tutor socrático de política e economia, …"
    },
    { "slug": "historia", "nome": "História", "status": "planejado" }
  ]
}
```

- **Invariantes:** `slug` único, `[a-z0-9-]+`; `status ∈ {disponivel, planejado}`; `disponivel` exige `arquivo`, `titulo`, `tradicoes` (≥ 1) e `promptBase`; toda `tradition` usada no currículo existe em `tradicoes`; cores `#RRGGBB`. Placeholders aceitos em `lead`: `{temas}`, `{modulos}`, `{livros}`, `{videos}`.
- **Textos de `politica`:** copiados literalmente do JS original (TRAD, prompt, títulos, rota de 3 passos), sem alteração.
- **Erros:** violação → `validate.mjs` sai com código 1; em runtime, área malformada aparece como indisponível e o restante do mapa funciona.
- **Compatibilidade:** campos novos opcionais podem ser acrescentados; remover ou renomear campo exige mudança no app.

## K2 — `content/<slug>/curriculum.json` · formato do original · dono: autor do conteúdo

- `{ modules: [{ id, number, name, subtitle, level, overview, goals[], workshop{ id, title, brief, exercise, deliverable }, steps[] }] }`
- Tema: obrigatórios `id, title, tagline, tradition, definition[], concepts[{t,d}], theses[], check[]`; opcionais `effort, debate[], videos[{title, source, url, focus}], book{title, author, url, label, level, focus} | null, bridge`.
- **Invariantes:** IDs únicos na área (temas e oficinas); URLs `https://`; sem `book` ⇒ `bridge`.
- IDs curtos no arquivo; ID canônico `slug/id` composto na carga.

## K3 — tabelas Supabase via PostgREST · v1 · dono: app

| Tabela | Chave | Colunas enviadas | Operação |
|---|---|---|---|
| `progress` | `(user_id, item_id, mark)` | `user_id, area, item_id, mark, done, updated_at` | `upsert` (`onConflict: user_id,item_id,mark`, `Prefer: return=representation`) |
| `notes` | `(user_id, item_id)` | `user_id, area, item_id, body, updated_at` | `upsert` idem |
| `prefs` | `user_id` | `user_id, last_at, updated_at` | `upsert` idem |
| todas | — | — | `select` filtrado por RLS (sem filtro de área) |

- **Invariantes:** `item_id = area + "/" + id curto`; `mark ∈ {def, vid, book, do}`; `updated_at` = instante da edição no aparelho (ISO UTC); desmarcar = `done=false`, nunca `delete`; nota vazia = `body=''`.
- **Trigger LWW:** `BEFORE UPDATE` em `progress`, `notes`, `prefs`: se `new.updated_at < old.updated_at`, retorna `NULL` (linha intacta). Linha ausente na resposta do upsert ⇒ cliente agenda `pull`.
- **Autorização:** RLS `auth.uid() = user_id`; somente `authenticated` escreve; `anon` só lê `heartbeat`.
- **Erros:** rede/5xx/401 ⇒ operação fica na fila (401 dispara refresh de sessão); 4xx de validação ⇒ operação descartada, log sem conteúdo da nota.
- **Idempotência:** reenviar a mesma operação produz o mesmo estado (upsert + LWW).

## K4 — estado local (`localStorage`) · v3 · dono: app

```
atlas-v3        { v:3, marks:{ "politica/m1e1:def": {done, at} },
                  notes:{ "politica/m1e1": {body, at, base:{body, at}|null} },
                  lastAt:{route, at}|null, resetAt:ISO|null, totals:{ politica: 89 },
                  size, theme }
atlas-v3-queue  { "p|politica/m1e1|def": {table, row}, "n|politica/m1e1": {...} }
```

- Chave v2 `atlas-estudos-v2` lida uma vez (L04) e preservada.
- `resetAt` (acrescentado na Etapa 4): horário do último Zerar; na mescla, linha remota desconhecida e anterior a ele conta como desmarcada/vazia e é sobrescrita.
- `base` de uma nota é atualizada quando o servidor confirma o envio, e na mescla.
- `size ∈ {s,m,l,xl}`, `theme ∈ {auto,light,dark}`: nunca sincronizados.

## K5 — backup JSON · v3 (lê v2) · dono: app

- **Exporta:** `{ app:"Atlas de Estudos", version:3, exportedAt, marks:{key:{done,at}}, notes:{id:{body,at}} }`, todas as áreas.
- **Importa v3:** mescla por `at` (RN26). **Importa v2** (`{version:2, done:{"m1e1:def":true}, notes:{"m1e1":"…"}}`): prefixa `politica/`, `at` = momento da importação; só chaves que existem no currículo (ou que têm o formato válido, se a área não estiver carregada); notas até 200 000 caracteres.
- Tudo o que vencer na importação entra na fila.
