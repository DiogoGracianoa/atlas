# ADR-0014: Concurso como subtema tipado do Atlas

Status: aceita · Data: 2026-11-11.
Origem: [plano aprovado](../../especificacoes/preparatorio-concurso-contagem-2027/plano.md) (D1, D2, D3).

## Contexto

O autor quer um preparatório para o concurso de Contagem/MG 2027 **dentro da
seção de estudos**, reaproveitável para outros concursos. O currículo atual
(`curriculum.json`) descreve temas com definição, vídeo e livro; um concurso
precisa de programa do edital com fonte e validação, trilha com datas, rotina,
quadro de provas, teoria, questões e casos da discursiva.

## Alternativas

- **Estender o `curriculum.json`:** misturaria dois formatos num só contrato e
  obrigaria campos de tema (livro, vídeo) que não fazem sentido no concurso.
- **Seção nova do portal (`/concursos`):** isolaria o preparatório, mas o autor
  escolheu mantê-lo na seção de estudos.
- **Subtema com `tipo: "concurso"`** num agrupador "Concursos": reaproveita o
  modelo de subtemas (K1 v2), as rotas do atlas e a função de conteúdo.

## Decisão

Subtema tipado. O manifesto ganha `tipo: "concurso"` (K1 v3); o `arquivo`
aponta para `content/<slug>/concurso.json` (K-C1), com `teoria/<disciplina>.json`,
`questoes/<disciplina>.json` e `discursiva.json` na mesma pasta. A função de
conteúdo libera esses arquivos só para subtemas do tipo concurso. A rota ganha
um quarto segmento: `/atlas/{grupo}/{concurso}/{página}/{id}`. O `AtlasLayout`
resolve o tipo e entrega a tela a um chunk próprio (`sections/atlas/concurso`),
sem o menu de módulos. `loadArea` recusa concursos, e o `validate` tem um
validador próprio (`scripts/validate-concurso.mjs`).

## Consequências

- Um novo concurso é um subtema e uma pasta de JSON, sem mudar código (RN23).
- O cartão "Concursos" aparece no mapa do atlas.
- O e2e de diagramas e a busca em todas as áreas ignoram concursos.
- Telas do concurso não usam o menu lateral do atlas; navegam por abas.

## Gatilho de revisão

Se os concursos precisarem de navegação fora do atlas, ou se o número deles
pedir uma página de busca própria, promover a uma seção do portal.
