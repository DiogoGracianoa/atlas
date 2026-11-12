# Guia de conteúdo do preparatório (teoria e questões)

Vale para todas as levas. Formato: contrato K-C1 em [contratos.md](contratos.md).
Programa e páginas do edital: `private/content/contagem-2027/concurso.json`
e [edital-vigente.md](edital-vigente.md).

## Princípios

1. **O edital manda.** Cubra o que o trecho do Anexo IV e os subtópicos do
   tópico pedem, nada de assunto fora do programa como se fosse obrigatório.
2. **Autoral.** Explicação e questões escritas do zero. Nada copiado de livro,
   apostila, site, prova anterior ou banco de questões. Não diga que uma
   questão é da IBGP ou de prova anterior: toda questão é `"origem": "autoral"`.
3. **Exato.** Só afirme o que é consolidado. Em dúvida sobre um número, data
   ou nome, não escreva. Fatos de Contagem só com fonte verificável e citada
   em `fontes` (portal da Prefeitura `portal.contagem.mg.gov.br`, Câmara
   Municipal, IBGE Cidades, legislação oficial). Fato sem fonte confirmada fica
   de fora.
4. **Português do Brasil, norma-padrão**, frases claras, sem enrolação.

## Teoria (`teoria/<disciplina>.json`)

Um objeto por tópico, chave = id do tópico:

- `objetivos`: 2 a 4 frases "Ao final, você consegue…".
- `explicacao`: 5 a 9 parágrafos que ensinam de verdade o conteúdo
  ("teoria resumida, porém suficiente"), na ordem dos subtópicos, com regras,
  exceções e as pegadinhas que costumam cair.
- `exemplos`: 2 a 3 exemplos resolvidos e comentados (`enunciado`, `resolucao`).
- `conceitos`: 4 a 8 termos com definição curta (`t`, `d`).
- `dominio`: 2 a 3 critérios objetivos de domínio (ex.: "Acertar ao menos 8
  das 10 questões"; "Explicar sem consulta a diferença entre RAM e ROM").
- `fontes` (opcional; **obrigatório nos tópicos de Contagem**): `[{ titulo, url }]`,
  só `https://` e só páginas que você de fato consultou.

## Questões (`questoes/<disciplina>.json`)

Lista de questões; de 8 a 10 por tópico publicado.

- `id`: `<tópico>-q01`, `<tópico>-q02`… (minúsculas, único).
- `enunciado`: no estilo de prova objetiva de banca; quando o tópico for de
  texto (interpretação, gêneros, coesão), traga um texto curto **original**
  no enunciado. Use comandos variados: "Assinale a alternativa correta",
  "…incorreta", "Considere as afirmativas I, II e III…".
- `alternativas`: exatamente 4, sem a letra (o portal mostra A–D), de tamanho
  parecido, plausíveis; nada de "todas as anteriores"/"nenhuma das anteriores".
- `gabarito`: índice 0 a 3. **Distribua**: em cada tópico, use as quatro
  posições pelo menos uma vez.
- `comentario`: por que a correta está certa e, em uma frase cada, por que as
  outras estão erradas.
- `origem`: `"autoral"`.
- Varie a dificuldade: cerca de 3 fáceis, 4 médias e 2 a 3 difíceis.

## Itens antigos do edital

Windows XP/Vista, Office 2007/2010, BrOffice.org 2.1 e StarOffice 5.1 são
cobrados pelo edital vigente. Escreva sobre essas versões (menus, barras,
atalhos e conceitos daquela época), sem tratá-las como obsoletas e sem
misturar recursos de versões posteriores.

## Verificação antes de entregar

`node <scratchpad>/checar-leva.mjs <disciplina> <tópicos…>` confere JSON,
campos, contagem por tópico, 4 alternativas, gabaritos distribuídos e ids.
