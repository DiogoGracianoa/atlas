# Contratos: preparatório Concurso Contagem/MG 2027

## K1 v3 — manifesto (`private/content/areas.json`)

- **Mudança:** subtema pode ter `tipo: "concurso"`; nesse caso `arquivo`
  aponta para `content/<slug>/concurso.json` e `tradicoes` lista as disciplinas
  (cores AA como hoje). Sem `tipo`, vale `"curriculo"` (compatível com v2).
- **Invariantes:** slug global único; agrupador "Concursos" segue as regras de
  agrupador; concurso `planejado` não aparece.
- **Dono:** conteúdo + `scripts/validate.mjs`.

## K-C1 — `concurso.json` (novo)

```json
{
  "concurso": { "nome": "...", "orgao": "...", "banca": "IBGP", "cargo": { "codigo": "501", "nome": "Analista de TI" } },
  "fontes": [{ "id": "anexo4-r2", "documento": "Anexo IV – Conteúdos Programáticos", "versao": "Retificação nº 02", "data": "2026-11-09", "url": "https://..." }],
  "prova": { "data": "2027-01-24", "fuso": "America/Sao_Paulo", "fonte": { "ref": "edital-r2", "item": "9.2.1" },
             "objetiva": { "questoes": 45, "minimo": 60, "fonte": { "ref": "anexo3-r1", "pagina": 2 },
                           "disciplinas": [{ "id": "lp", "questoes": 10, "peso": 2 }] },
             "discursiva": { "questoes": 2, "pontos": 15, "linhas": 10, "criterios": [{ "id": "cp", "nome": "...", "max": 6 }], "fonte": { "ref": "edital-r2", "item": "9.4" } } },
  "disciplinas": [{ "id": "lp", "nome": "Língua Portuguesa", "modulos": [{ "id": "lp-m1", "nome": "...",
      "topicos": [{ "id": "lp-crase", "titulo": "Crase", "subtopicos": ["..."], "opcional": false,
                    "fonte": { "ref": "anexo4-r2", "pagina": 4, "trecho": "Emprego do sinal indicativo da crase" },
                    "validacao": "verificado", "publicado": false }] }] }],
  "trilha": { "inicio": "2026-11-16", "fim": "2027-01-23", "horasSemana": 10,
              "semanas": [{ "n": 1, "inicio": "2026-11-16", "fim": "2026-11-22", "titulo": "...", "topicos": ["lp-interpretacao"], "meta": "60 questões" }] },
  "rotina": { "seg": ["lp"], "ter": ["rl"], "qua": ["ce"], "qui": ["cgm"], "sex": ["ce", "exercicios"], "sab": ["revisao", "questoes", "simulado"], "dom": ["erros", "revisao"] },
  "revisao": { "dias": [1, 7, 21] }
}
```

`teoria/<disciplina>.json`: `{ "<topicoId>": { "objetivos": [], "explicacao": [], "exemplos": [{ "enunciado", "resolucao" }], "conceitos": [{ "t", "d" }], "dominio": [] } }`.
`questoes/<disciplina>.json`: `[{ "id", "topico", "enunciado", "alternativas": ["A","B","C","D"], "gabarito": 0-3, "comentario", "origem": "autoral" | { "fonte", "url" } }]`.
Casos da discursiva: `discursiva.json` `[{ "id", "topicos": [], "caso", "pede", "espelho" }]`.

- **Invariantes:** IDs únicos no concurso; todo tópico obrigatório com fonte e
  validação e em exatamente uma semana; semanas contíguas cobrindo
  `inicio..fim`; tópico `publicado` tem teoria completa e 8–10 questões;
  4 alternativas e um gabarito; datas ISO; nenhum dado de prova sem `fonte`.
- **Erros:** `npm run validate` sai com 1 e lista `contagem-2027/<id>: campo`.
- **Compatibilidade:** novo; `curriculum.json` não muda.
- **Dono:** conteúdo + validador.

## K-R1 — registros do estudante (novo, tabela `registros` + `atlas-registros-v1`)

| tipo | registro_id | corpo | mutável? |
|---|---|---|---|
| `topico` | `<concurso>/<topico>` | `{ estado, leitura: {feita, em} \| null, confianca }` | sim (LWW) |
| `replanejamento` | UUID | `{ topico, de, para, em }` | não |
| `sessao` | UUID | `{ disciplina, topicos[], data, minutos }` | não |
| `tentativa` | UUID | `{ questao, topico, marcada, acerto, em, origem: "fixacao" \| "simulado", simulado? }` | não |
| `erro` | `<concurso>/<questao>` | `{ anotacao, revisadaEm }` | sim |
| `revisao` | `<concurso>/<topico>/<n>` | `{ feitaEm }` | sim |
| `simulado` | UUID | `{ inicio, fim, parcial, questoes[], acertos: {lp, rl, cgm, ce}, nota }` | não |
| `discursiva` | UUID | `{ caso, criterios: {cp, pr, cl, el, ec}, total, em }` | não |
| `plano` | `<concurso>` | `{ horasSemana }` | sim |

- **Operações:** `select` por usuário (e `area`), `upsert` com
  `onConflict: user_id,tipo,registro_id`.
- **Invariantes:** RLS `auth.uid() = user_id`; trigger descarta escrita com
  `updated_at` mais antigo; `octet_length(corpo::text) <= 16384`; eventos nunca
  são reescritos pelo cliente.
- **Erros:** 4xx de validação → operação descartada com aviso (como hoje);
  5xx/rede → nova tentativa.
- **Idempotência:** reenviar o mesmo evento (mesmo UUID e `updated_at`) não
  duplica nada.
- **Compatibilidade:** tabela nova; `progress`, `notes`, `prefs` intactas.
- **Dono:** núcleo de sincronização + migration.

## KB4 — backup v4

- **Saída:** v3 + `registros: { "<tipo>:<id>": { corpo, at } }`.
- **Entrada:** v2, v3 e v4; mescla por `at` como hoje.
- **Dono:** `src/core/backup.ts`. Coordenar o campo `app` com a renomeação
  (KB3 revisão 2026-11-11).

## Extensão 2026-11-11 — ajustes comprovados na implementação

- **K-C1:** a semana ganhou `revisar` (tópicos revisitados, contam para a
  cobertura de disciplinas da semana) e `notas` (orientação por disciplina),
  porque as semanas 8–10 do planejamento são de revisão. `prova.objetiva`
  tem `alternativas` e `duracaoMin`; `prova.discursiva` tem `minimoPct`;
  `rotina` é `{ dia: { foco: [...], horas } }` e `atividades` dá nome aos focos
  que não são disciplinas. Tipos em `src/core/concurso/tipos.ts`.
- **K-R1:** registro excluído por "Zerar tudo" tem corpo `{ "apagado": true }`
  (marca de exclusão sincronizada). `erro` guarda `revisadaApos` (horário da
  tentativa dispensada). `tentativa` guarda `origem` (`fixacao` ou `simulado`)
  e, no simulado, o id do simulado.
- **KB4:** confirmado; exportar sempre gera v4 (`registros` por `tipo:id`),
  importar aceita v2, v3 e v4. O campo `app` segue "Letrume" (KB3).
