# Contratos

## K1 v2: manifesto com subtemas (dono: autor do conteúdo)

Acréscimo compatível a `areas.json`. Uma área pode trazer `subtemas`:

```json
{
  "slug": "tecnologia", "nome": "Tecnologia", "resumo": "…", "status": "disponivel",
  "subtemas": [
    { "slug": "arquitetura-lideranca-tecnica", "nome": "Arquitetura e liderança técnica",
      "resumo": "…", "status": "disponivel",
      "arquivo": "content/arquitetura-lideranca-tecnica/curriculum.json",
      "titulo": "…", "subtitulo": "…", "tituloPdf": "…", "capa": { … },
      "tradicoes": { "lideranca": {…}, "engenharia": {…}, "ia": {…} }, "promptBase": "…" }
  ]
}
```

**Invariantes:**
- Uma área com `subtemas` não tem `arquivo`, `tradicoes` nem `promptBase`.
- `subtemas` tem pelo menos 1 item.
- Cada subtema segue as mesmas regras de uma área do K1 v1.
- Os slugs são únicos em todo o manifesto, contando áreas e subtemas.
- Agrupador `disponivel` exige ao menos um subtema `disponivel`.
- Não há subtema de subtema.

**Compatibilidade:** um manifesto sem `subtemas` continua válido e idêntico ao
v1.

## KR1 v1.2: rotas do atlas

| Rota | Área sem subtemas | Área agrupadora |
|---|---|---|
| `/atlas/:a` | capa | página do agrupador (lista de subtemas) |
| `/atlas/:a/:b` | item `b` (desconhecido vai à capa) | capa do subtema `b` (desconhecido ou planejado vai a `/atlas/:a` com aviso) |
| `/atlas/:a/:b/:c` | vai à capa de `a` | item `c` do subtema `b` (desconhecido vai à capa do subtema) |

## K3 e K4: sem mudança

`item_id` e as chaves locais continuam `{folha}/{id}`, em que a folha é o slug
da área ou do subtema que tem currículo.

## Extensão 2026-11-06

- **K2 (currículo):** campo opcional `diagram: { code, caption }` no tema.
  `code` começa por `flowchart LR|TB|TD|RL|BT`, `sequenceDiagram`,
  `stateDiagram-v2` ou `quadrantChart`; sem `style`, `classDef`, `class`,
  `click`, `linkStyle`, `:::` nem HTML; `caption` obrigatória. Conferido pelo
  `validate` e renderizado de verdade pelo `e2e/diagramas.spec.ts`.
- **KW1 (cache):** os chunks do Mermaid ficam em `/assets/diagramas/`, fora do
  precache, com cache-first no primeiro uso (cache `atlas-diagramas`).
