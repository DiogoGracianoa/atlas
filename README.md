# atlas

Trilha de estudos autodirigidos: definição, vídeo e livro para cada tema, com progresso sincronizado.

O Atlas é um site estático (HTML, CSS e JavaScript puros, sem framework e sem
build) hospedado na Vercel. Cada **área** é uma trilha própria; o progresso e as
anotações ficam no aparelho e, com login, sincronizam entre celular e PC pelo
Supabase. Sem login, ou sem rede, tudo continua funcionando só no aparelho.

```
index.html              página única do app
sw.js                   service worker (abre e navega sem rede)
assets/                 app.css, app.js (UI), sync.js (Supabase), config.js, lib/
content/areas.json      manifesto: única fonte de verdade sobre as áreas
content/<área>/         curriculum.json de cada área
supabase/migrations/    schema do banco
scripts/                validate.mjs, serve.mjs, check-extract.mjs
tests/                  testes do app (node --test) e do banco (Docker)
especificacoes/         visão, especificação, plano e registro de cada mudança
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
conferida contra `content/areas.json` pelos testes: se você mudar o status de uma
área, atualize a linha aqui também.

## Rodar localmente

Precisa só do Node 22 (sem `npm install`: nada aqui tem dependências).

```bash
node scripts/serve.mjs
```

Abre em `http://localhost:8080`. Outros comandos:

```bash
node scripts/validate.mjs
```

```bash
node --test "tests/app/**/*.test.mjs"
```

```bash
bash tests/db/run.sh
```

O último testa a migration num PostgreSQL descartável e precisa do Docker
rodando.

## Supabase: passo a passo

Faça uma vez. Tudo no painel do Supabase (`supabase.com/dashboard`).

1. **Criar o projeto.** *New project*, plano Free. Anote a senha do banco num
   gerenciador de senhas (o app não usa).
2. **Rodar a migration.** *SQL Editor* → *New query* → cole o conteúdo de
   `supabase/migrations/0001_init.sql` → *Run*. Confira em *Table Editor* que
   existem `progress`, `notes`, `prefs` e `heartbeat`, todas com RLS ligado.
3. **Criar a sua conta antes de fechar os cadastros.** *Authentication* →
   *Users* → *Add user* → *Create new user*: seu e-mail, uma senha aleatória
   qualquer (o app não usa senha) e marque *Auto Confirm User*.
4. **Desativar novos cadastros.** *Authentication* → *Sign In / Providers* →
   desligue *Allow new users to sign up* e salve. A partir daqui só a sua conta
   existe. O app também pede o login com `shouldCreateUser: false`.
5. **Configurar as URLs de retorno do link.** *Authentication* →
   *URL Configuration*:
   - *Site URL*: o endereço da Vercel, por exemplo `https://atlas-seunome.vercel.app/`.
   - *Redirect URLs*: o mesmo endereço e, para testar em casa,
     `http://localhost:8080/`. Se quiser logar nos deploys de preview da
     Vercel, acrescente também `https://*-seunome.vercel.app/**`.
6. **Pôr o código no e-mail de login.** *Authentication* → *Emails* →
   *Templates* → *Magic Link*. Troque o corpo por algo como:

   ```html
   <h2>Entrar no Atlas</h2>
   <p><a href="{{ .ConfirmationURL }}">Entrar neste aparelho</a></p>
   <p>Ou digite o código: <b>{{ .Token }}</b></p>
   ```

   O código resolve dois casos em que o link não funciona: o atalho do Atlas na
   tela inicial do iPhone (o link abre no Safari, não no atalho) e pedir o
   login num aparelho e abrir o e-mail em outro. Em *Sign In / Providers* →
   *Email*, confira que o tamanho do código (*Email OTP Length*) é 6.
7. **Copiar URL e chave pública para o app.** *Project Settings* → *Data API*
   (URL do projeto) e *API Keys* (a chave **publishable**, `sb_publishable_…`,
   ou a chave legada **anon public**). Cole em `assets/config.js`:

   ```js
   export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
   export const SUPABASE_ANON_KEY = "sb_publishable_...";
   ```

   Essa chave é pública por design: o que protege os dados é o RLS da
   migration. A chave **`service_role`** (ou *secret*) **nunca** entra no
   repositório, nem em `config.js`, nem em GitHub Secrets deste projeto.
8. **Commit e push** do `config.js`. O deploy da Vercel pega a mudança.

O servidor de e-mail padrão do Supabase tem limite baixo de envios por hora.
Para uso pessoal basta; se o código não chegar, espere alguns minutos antes de
pedir outro.

## Vercel: passo a passo

1. Em `vercel.com`, *Add New…* → *Project* → importe o repositório `atlas` do GitHub.
2. *Framework Preset*: **Other**. Deixe *Build Command* e *Install Command*
   vazios e *Output Directory* como a raiz (`.`). Não há serverless functions.
3. *Deploy*. Anote o endereço gerado e use-o no passo 5 do Supabase.
4. Cada push em `main` publica de novo. O `vercel.json` define cache:
   `index.html` e `sw.js` sem cache, `assets/` e `content/` com 5 minutos e
   revalidação. O `.vercelignore` deixa fora do deploy tudo o que não é site
   (testes, especificações, scripts, migration, `exemplos/`).

## GitHub Actions

- **validate** (`.github/workflows/validate.yml`): roda em todo push e PR.
  Valida o conteúdo de todas as áreas, roda os testes do app e testa a
  migration num PostgreSQL descartável. Se você acrescentar uma área com o JSON
  torto, é aqui que o push fica vermelho.
- **keepalive** (`.github/workflows/keepalive.yml`): uma vez por dia faz um
  `SELECT` na tabela `heartbeat` pela API do Supabase, para o projeto Free não
  ser pausado por inatividade (ele pausa após 7 dias sem requisições). Falha se
  a resposta não for 200, e o GitHub avisa por e-mail. Dá para disparar à mão
  em *Actions* → *keepalive* → *Run workflow*.

  Configure em *Settings* → *Secrets and variables* → *Actions* →
  *New repository secret*:
  - `SUPABASE_URL`: a mesma URL do `config.js`.
  - `SUPABASE_ANON_KEY`: a mesma chave pública do `config.js`.

## Formato do `curriculum.json`

Cada área tem um `content/<área>/curriculum.json` com módulos; cada módulo tem
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

A entrada da área em `content/areas.json` guarda o que é próprio da área e não
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

Nenhuma alteração em código. Se precisar mexer em `assets/` para uma área
aparecer, é bug.

1. Escreva `content/<área>/curriculum.json` no formato acima (a pasta já existe para as áreas planejadas).
2. Em `content/areas.json`, troque a entrada da área para `"status": "disponivel"` e preencha `arquivo`, `titulo`, `subtitulo`, `tituloPdf`, `capa`, `tradicoes` e `promptBase`.
3. Rode `node scripts/validate.mjs` e corrija tudo o que ele apontar.
4. Rode `node scripts/serve.mjs`, abra a área no navegador e leia pelo menos um tema e a oficina.
5. Atualize a linha da área na tabela deste README, faça commit e push: a Action **validate** confere tudo de novo e a Vercel publica.

## A pasta `exemplos/`

`exemplos/` é onde o autor deposita material bruto (rascunhos, listas de livros
e vídeos, anotações, recortes) que serve de insumo para escrever o conteúdo das
áreas. Ela está no `.gitignore` e **não vem no clone**: é normal ela não existir.

- O site nunca lê essa pasta, e nada no repositório depende dela: a validação,
  os testes e as Actions rodam num clone limpo. O único script que a menciona,
  `scripts/check-extract.mjs`, foi usado uma vez para provar que o conteúdo de
  política saiu idêntico do HTML original, e encerra em silêncio se ela não existir.
- Material que está só em `exemplos/` não existe para o site. Para virar
  conteúdo, ele precisa ser convertido em `content/<área>/curriculum.json`,
  num passo explícito.
- O repositório é público: o `curriculum.json` recebe explicação escrita do
  zero, não trechos colados de livros, artigos ou transcrições. Citação, só
  curta e com autor.

## Roteiro de verificação

Depois dos passos do Supabase e da Vercel, confira com dois aparelhos
(celular e PC):

- [ ] **Login por código no PC:** toque no indicador "Não sincronizado" (no
  menu, no PC), informe o e-mail, digite o código. O indicador vira "Sincronizado".
- [ ] **Login pelo link no celular:** peça o login no celular e abra o link
  no mesmo aparelho. Volta para a página em que você estava, já logado.
- [ ] **Livro no celular, PC depois:** marque um livro como lido no celular;
  abra (ou volte para) o Atlas no PC. Está marcado.
- [ ] **Sessão intercalada:** escreva uma anotação no PC e marque um vídeo no
  celular. Troque de aparelho: os dois têm as duas coisas.
- [ ] **Modo avião:** no celular, ligue o modo avião, abra o Atlas, navegue,
  marque três itens (indicador "Offline"). Desligue o modo avião: o indicador
  passa por "Sincronizando…" e chega a "Sincronizado"; confira no PC.
- [ ] **Deslogado:** em *Sair deste aparelho*, as marcações continuam; marque
  algo, recarregue: continua lá, com "Não sincronizado".
- [ ] **iPhone na tela inicial:** *Compartilhar* → *Adicionar à Tela de
  Início*; abra pelo atalho e faça login pelo **código**.
- [ ] **Keepalive:** em *Actions* → *keepalive* → *Run workflow*. Fica verde.
- [ ] **Conteúdo:** abra alguns temas de política e compare com o arquivo antigo.

## Limitações conhecidas

- **Keepalive pode parar sozinho.** O GitHub desativa workflows agendados de
  repositório público após 60 dias sem atividade no repositório. Ele avisa por
  e-mail antes; reativar é um clique em *Actions*. Sem o keepalive, o Supabase
  Free pausa o projeto após 7 dias sem uso, e aí é só reativá-lo no painel.
- **iOS apaga dados de sites pouco usados.** O Safari pode limpar o
  armazenamento de um site não aberto há 7 dias. O que já foi sincronizado volta
  no próximo login; o que estava na fila sem ter subido se perde.
- **Mesma anotação editada ao mesmo tempo em dois aparelhos online:** a versão
  mais recente vence sem preservar a outra. Editando offline, ou em momentos
  diferentes, as duas versões são preservadas, a mais antiga anexada com o
  marcador `— versão de outro aparelho (data) —`.
- **Relógio do aparelho.** "Vence o mais recente" usa o horário do aparelho.
  Celulares e PCs acertam a hora pela rede; um relógio muito errado faria esse
  aparelho vencer (ou perder) sempre.
- **Exportar/Importar** continuam no menu como seguro contra lock-in. Importar
  mescla com o que existe (vence o mais recente; nada é apagado) e aceita o
  backup do arquivo antigo.
