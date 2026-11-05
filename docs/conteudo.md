# Conteúdo: áreas, currículos e manifesto

O conteúdo do atlas é **dado**, não código. Ele fica em `public/content/`, é
servido pelo site em `/content/...` e é carregado sob demanda: o manifesto ao
abrir o atlas e o currículo de cada área só quando ela é aberta.

```
public/content/
  areas.json                 manifesto: única fonte de verdade sobre as áreas
  <área>/curriculum.json     módulos, temas e oficinas da área
```

## Áreas

| Área | Pasta | Status |
|---|---|---|
| Política, economia e marxismo | `politica` | disponível |
| História | `historia` | planejada |
| Economia | `economia` | planejada |
| Filosofia | `filosofia` | planejada |
| Ciência | `ciencia` | planejada |
| Tecnologia | `tecnologia` | planejada |

Área planejada aparece no mapa em cinza, como "em breve", sem link. Esta tabela é
conferida contra `public/content/areas.json` pelos testes: se você mudar o status
de uma área, atualize a linha aqui também.

## Formato do `curriculum.json`

Cada área tem um `public/content/<área>/curriculum.json` com módulos; cada módulo tem
temas (`steps`) e uma oficina (`workshop`). Os IDs são curtos e únicos **dentro
da área** (`m1e1`, `m1of`); o app compõe o ID completo `area/id`
(`historia/m1e1`), que é o que vai para o banco. Exemplo mínimo:

```json
{
  "modules": [
    {
      "id": "m1",
      "number": 1,
      "name": "Nome do módulo",
      "subtitle": "Uma frase sobre o módulo.",
      "level": "Iniciante",
      "overview": "Parágrafo de visão geral do módulo.",
      "goals": ["O que você deve conseguir fazer ao fechar o módulo."],
      "workshop": {
        "id": "m1of",
        "title": "Oficina do módulo 1",
        "brief": "Uma frase sobre a oficina.",
        "exercise": "O exercício, em um parágrafo.",
        "deliverable": "O que entregar ao final."
      },
      "steps": [
        {
          "id": "m1e1",
          "title": "Título do tema",
          "tagline": "Uma frase que resume o tema.",
          "tradition": "geral",
          "effort": "2–3 h",
          "definition": ["Primeiro parágrafo da explicação.", "Segundo parágrafo."],
          "concepts": [{ "t": "Conceito", "d": "Definição curta do conceito." }],
          "theses": ["Uma tese central."],
          "debate": ["Uma crítica que a posição recebe."],
          "videos": [{ "title": "Título do vídeo", "source": "Canal ou curso", "url": "https://www.youtube.com/...", "focus": "O que procurar no vídeo." }],
          "book": { "title": "Título do livro", "author": "Autora", "url": "https://...", "label": "Ver o livro", "level": "Introdutório", "focus": "Por onde começar e o que não pular." },
          "check": ["Pergunta para verificar se entendeu?"]
        }
      ]
    }
  ]
}
```

| Campo do tema | Obrigatório | Observação |
|---|---|---|
| `id`, `title`, `tagline`, `tradition` | sim | `tradition` precisa existir em `tradicoes` da área no manifesto |
| `definition`, `concepts`, `theses`, `check` | sim | listas não vazias |
| `effort`, `debate`, `videos` | não | sem `videos`, o tema não tem a marcação "vídeo" |
| `book` | não | sem `book` (ou `null`), o tema precisa de `bridge` |
| `bridge` | se não houver `book` | texto explicando por que não há livro nesta etapa |

Toda URL precisa começar com `https://`. Aspas tipográficas (`“ ” ’`) e
travessões são texto como qualquer outro: escreva como quiser que apareça.

A entrada da área em `public/content/areas.json` guarda o que é próprio da área e não
do conteúdo de cada tema: títulos, textos da capa, o texto-base do prompt de
"Estude com a IA" e as tradições com rótulo e cor (clara e escura):

```json
{
  "slug": "historia",
  "nome": "História",
  "resumo": "Uma frase para o cartão no mapa.",
  "status": "disponivel",
  "arquivo": "content/historia/curriculum.json",
  "titulo": "Atlas de história",
  "subtitulo": "Trilha de história",
  "tituloPdf": "Atlas de Estudos · História",
  "capa": {
    "rotulo": "TRILHA DE ESTUDOS",
    "lead": "{modulos} módulos, {temas} temas. …",
    "passos": [{ "t": "Leia a definição", "d": "…" }]
  },
  "tradicoes": { "geral": { "nome": "História geral", "cor": "#4A5E70", "corEscura": "#9DB4CA" } },
  "promptBase": "Você é meu tutor socrático de história, em português do Brasil. …\n\n"
}
```

No `lead`, `{modulos}`, `{temas}`, `{livros}` e `{videos}` são trocados pelas
contagens da área.

## Como acrescentar uma área nova

Nenhuma alteração em código. Se for preciso mexer em `src/` para uma área
aparecer, é bug.

1. Escreva `public/content/<área>/curriculum.json` no formato acima (a pasta já existe para as áreas planejadas).
2. Em `public/content/areas.json`, troque a entrada da área para `"status": "disponivel"` e preencha `arquivo`, `titulo`, `subtitulo`, `tituloPdf`, `capa`, `tradicoes` e `promptBase`.
3. Rode `npm run validate` e corrija tudo o que ele apontar.
4. Rode `npm run dev`, abra a área no navegador e leia pelo menos um tema e a oficina.
5. Atualize a linha da área na tabela deste documento, faça commit e push: o CI confere tudo de novo e a Vercel publica.

As cores de tradição precisam passar no contraste AA (4,5:1) sobre o fundo dos
temas claro (`cor`) e escuro (`corEscura`): `tests/ui/tokens.test.ts` confere
todas as tradições do manifesto.

## O que o `validate` confere

`npm run validate` (`scripts/validate.mjs`, Node puro) sai com código 1 e lista
cada problema como `área/tema: campo`. Ele confere:

- **manifesto:** slug único e no formato `[a-z0-9-]+`, status válido, campos
  obrigatórios das áreas disponíveis e cores `#RRGGBB`;
- **currículo:**
  - o arquivo existe e o JSON é válido;
  - IDs únicos na área;
  - campos obrigatórios não vazios em temas e oficinas;
  - URLs com `https://`;
  - tema sem `book` tem `bridge`;
  - a tradição do tema existe no manifesto;
- **isolamento:** nenhum arquivo do site (`src/`, `public/`, `index.html`,
  configurações) referencia `exemplos/`.

## A pasta `exemplos/`

`exemplos/` é onde o autor deposita material bruto (rascunhos, listas de livros
e vídeos, anotações, recortes) que serve de insumo para escrever o conteúdo das
áreas. Ela está no `.gitignore` e **não vem no clone**: é normal ela não existir.

- O site nunca lê essa pasta, e nada no repositório depende dela: a validação,
  os testes e as Actions rodam num clone limpo. O único script que a menciona,
  `scripts/check-extract.mjs`, prova que os sete módulos originais de
  política seguem idênticos ao HTML original, e encerra em silêncio se ela não existir.
- Material que está só em `exemplos/` não existe para o site. Para virar
  conteúdo, ele precisa ser convertido em `public/content/<área>/curriculum.json`,
  num passo explícito.
- O repositório é público: o `curriculum.json` recebe explicação escrita do
  zero, não trechos colados de livros, artigos ou transcrições. Citação, só
  curta e com autor.
