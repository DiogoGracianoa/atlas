# Subtemas no Atlas e o atlas de arquitetura e liderança técnica

Data: 2026-11-06 · Descoberta: `.discovery/atlas-tecnologia-subtemas/` (**Construir**)

## Resultado esperado

Uma área do Atlas pode agrupar **subtemas**, cada um com currículo próprio. A
área "Tecnologia" passa a existir como agrupador. Seu primeiro subtema,
"Arquitetura e liderança técnica", traz os cerca de 85 temas do guia de tech
lead reescritos no padrão do atlas de política:
- explicação completa antes de qualquer recomendação;
- depois, conceitos, teses, críticas, vídeo, livro e verificação;
- oficinas que absorvem o plano de 12 meses, as armadilhas e a prontidão para
  arquitetura.

**Persona:** o autor, tech lead, que estuda pelo celular e pelo PC.

## Escopo e não escopo

**Escopo**
- Subtemas no manifesto, nas rotas, no mapa, no menu, no progresso, no
  "continuar", na busca e no `validate`.
- Área "Tecnologia" como agrupador, com o subtema "Arquitetura e liderança
  técnica" disponível.
- Conteúdo em três levas:
  1. Liderança técnica;
  2. Engenharia e arquitetura;
  3. IA aplicada e SDD.

  Cada leva tem 3 módulos (Fundamental, Intermediário e Avançado) e oficinas.
  Uma leva só é considerada pronta depois de passar no `validate` e na revisão
  do autor.

**Não escopo**
- Outros subtemas de Tecnologia; eles entram como planejados apenas se o autor
  pedir.
- Subtemas nas demais áreas. O mecanismo é genérico, mas nenhuma outra área
  muda.
- Mudança no banco, na sincronização ou no formato do `curriculum.json`.
- Copiar texto do guia: ele é insumo, e o texto é escrito do zero.

## Regras de negócio

- **RN01 (agrupador):** uma área com `subtemas` não tem currículo próprio. Ela
  aparece no mapa como cartão de área e abre uma página com a lista dos
  subtemas.
  - Subtema disponível tem link.
  - Subtema planejado aparece como "em breve", sem link.
  - A área conta como disponível se ao menos um subtema estiver disponível.
- **RN02 (endereços):**
  - `/atlas/{área}` mostra a página do agrupador;
  - `/atlas/{área}/{subtema}` mostra a capa do subtema;
  - `/atlas/{área}/{subtema}/{id}` mostra o tema ou a oficina.

  Se o subtema estiver planejado ou não existir, volta à página do agrupador
  com aviso. Se o item não existir, volta à capa do subtema. As áreas sem
  subtemas continuam com `/atlas/{área}/{id}`, sem mudança.
- **RN03 (identidade do progresso):**
  - O progresso de um subtema usa a chave `{subtema}/{id}`, por exemplo
    `arquitetura-lideranca-tecnica/m1e1`.
  - O slug do subtema é único em todo o manifesto, sem repetir slug de área
    nem de outro subtema.
  - O progresso de política não muda.
- **RN04 (progresso do agrupador):** o cartão da área no mapa mostra o
  progresso somado dos subtemas já abertos neste aparelho.
- **RN05 (navegação):**
  - o seletor do menu lista os subtemas sob o nome da área;
  - "Continuar de onde parei" leva ao endereço completo do subtema;
  - "buscar em todas as áreas" inclui os subtemas disponíveis.
- **RN06 (padrão de conteúdo):** todo tema do subtema tem:
  - definição com pelo menos 5 parágrafos, que explica o assunto de forma
    autossuficiente antes de qualquer recomendação;
  - pelo menos 6 conceitos-chave, 3 teses, 2 críticas ou debates e 3 perguntas
    de verificação;
  - ao menos um vídeo e um livro, ou uma ponte (`bridge`) que explique a
    ausência do livro.
- **RN07 (etiqueta):** a tradição de cada tema é a trilha: `lideranca`,
  `engenharia` ou `ia`, com cores clara e escura que passam em contraste AA.
- **RN08 (oficinas):** cada módulo tem uma oficina prática. O conteúdo extra do
  guia entra nas oficinas:
  - método de estudo nas oficinas fundamentais;
  - armadilhas do caminho na oficina de liderança avançada;
  - prontidão para arquitetura na oficina de engenharia avançada;
  - plano de 12 meses na oficina final, de IA avançada.
- **RN09 (fontes):**
  - livros da biblioteca do guia, com o link de busca do Google Books;
  - vídeos com o link de busca do YouTube pelo título e autor da palestra ou
    pelo assunto;
  - nenhuma URL inventada;
  - nenhum trecho copiado do guia ou de livros (citação só curta e com autor).
- **RN10 (subtema novo sem código):** acrescentar um subtema exige só a entrada
  no manifesto e o `curriculum.json`.

## Critérios de aceite

- **AC01 — agrupador:** Dado o manifesto com Tecnologia agrupando "Arquitetura
  e liderança técnica" (disponível), Quando abro `/atlas/tecnologia`, Então vejo
  o título da área e o cartão do subtema com link para
  `/atlas/tecnologia/arquitetura-lideranca-tecnica`.
- **AC02 — capa e item:** Quando abro
  `/atlas/tecnologia/arquitetura-lideranca-tecnica` e
  `.../arquitetura-lideranca-tecnica/m1e1`, Então vejo a capa do subtema e o
  primeiro tema.
- **AC03 — inválidos:** Dado `/atlas/tecnologia/xyz` e
  `/atlas/tecnologia/arquitetura-lideranca-tecnica/zzz`, Quando abro cada um,
  Então volto a `/atlas/tecnologia` com aviso e à capa do subtema,
  respectivamente.
- **AC04 — política intacta:** Dado o estado atual de política, Quando a
  mudança entra, Então `/atlas/politica/m1e1` e as marcações de política
  funcionam como antes.
- **AC05 — chave:** Quando marco a definição de m1e1 no subtema, Então a chave
  gravada é `arquitetura-lideranca-tecnica/m1e1:def`, e a linha sincronizada tem
  `area = arquitetura-lideranca-tecnica`.
- **AC06 — mapa:** Dado marcações no subtema, Quando abro `/atlas`, Então o
  cartão Tecnologia mostra o progresso somado.
- **AC07 — continuar e menu:** Dado `lastAt` num tema do subtema, Quando abro o
  mapa, Então "Continuar" leva ao endereço completo. No seletor do menu, o
  subtema aparece sob "Tecnologia".
- **AC08 — busca:** Quando busco "Conway" em todas as áreas, Então aparecem os
  resultados do subtema, agrupados por ele.
- **AC09 — validate:** Dado um slug de subtema repetido, um subtema disponível
  sem currículo ou tradição inexistente, Quando rodo o `validate`, Então ele
  falha apontando o erro.
- **AC10 — padrão de conteúdo:** Dado o currículo do subtema, Quando um teste
  confere cada tema, Então todos têm os mínimos da RN06 e tradição ∈
  {lideranca, engenharia, ia}.
- **AC11 — leva:** Dado o fim de uma leva, Quando a entrego, Então o `validate`
  e a suíte passam e o autor revisa os temas daquela trilha antes da leva
  seguinte.
- **AC12 — subtema novo:** Dado um manifesto de teste com um segundo subtema e
  um currículo, Quando o app carrega, Então ele aparece e navega sem mudança de
  código.

## Exemplos e limites

- **Ordem dos módulos:**
  - m1–m3: Liderança técnica (Fundamental, Intermediário e Avançado);
  - m4–m6: Engenharia e arquitetura;
  - m7–m9: IA aplicada e SDD.

  A capa recomenda o método do guia: passar pelo nível fundamental das três
  trilhas antes de ir fundo.
- **Durante as levas:** o currículo publica só os módulos já escritos, e a capa
  conta os temas reais pela contagem automática (`{temas}`).
- **Slug:** o slug interno do subtema é igual ao trecho da URL. Assim a chave
  do progresso e o endereço usam o mesmo nome.

## Rastreabilidade

| RN | ACs | Situação |
|---|---|---|
| RN01 | AC01 | coberta |
| RN02 | AC02, AC03 | coberta |
| RN03 | AC04, AC05 | coberta |
| RN04 | AC06 | coberta |
| RN05 | AC07, AC08 | coberta |
| RN06 | AC10 | coberta |
| RN07 | AC10 | coberta |
| RN08 | AC10, AC11 | coberta (oficinas conferidas pelo teste de conteúdo e pela revisão) |
| RN09 | AC09, AC11 | coberta (`validate` exige https; revisão por leva) |
| RN10 | AC12 | coberta |

## Projetos potencialmente impactados

- **Mudam:**
  - código do atlas (`src/core/content.ts`, `src/sections/atlas/*`);
  - `scripts/validate.mjs`;
  - `public/content/areas.json`;
  - o novo `public/content/arquitetura-lideranca-tecnica/curriculum.json`;
  - `docs/conteudo.md`.
- **Só validam:** banco, sincronização, área de política.

## Perguntas em aberto

- **Ordem das levas** (não bloqueante): começo por Liderança técnica (a ordem
  do guia), salvo se você preferir outra trilha.
- **Nome da área** (não bloqueante): "Tecnologia", com o resumo "Recortes de
  tecnologia: arquitetura, liderança técnica e IA aplicada".
