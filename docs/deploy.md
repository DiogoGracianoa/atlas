# Deploy: Supabase, Vercel e GitHub

São três sistemas, cada um configurado uma vez. A ordem importa só num ponto:
as URLs de retorno do login (Supabase, passo 5) dependem do endereço que a
Vercel gera. O login e os materiais só ficam disponíveis depois da configuração.

> A chave **`service_role`** (ou *secret*) do Supabase **nunca** é usada neste
> projeto: nem no código, nem nas variáveis da Vercel, nem nos secrets do
> GitHub. O front usa só a chave pública (anon ou publishable); o que protege
> os dados é o RLS. `npm run secrets` e o CI conferem isso.

## 1. Supabase

Tudo no painel (`supabase.com/dashboard`).

1. **Criar o projeto.** *New project*, plano Free; região sugerida: São Paulo.
   Guarde a senha do banco num gerenciador de senhas (o app não a usa).
2. **Rodar a migration.** *SQL Editor* → *New query* → cole o conteúdo de
   [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) →
   *Run*. Em *Table Editor*, confira `progress`, `notes`, `prefs` e
   `heartbeat`, todas com RLS ligado.
3. **Criar a sua conta antes de fechar os cadastros.** *Authentication* →
   *Users* → *Add user* → *Create new user*: seu e-mail, uma senha inicial
   segura e *Auto Confirm User* marcado. Depois de entrar, a senha pode ser
   definida ou alterada no painel de sincronização do Atlas.
4. **Desligar novos cadastros.** *Authentication* → *Sign In / Providers* →
   desligue *Allow new users to sign up*. O app também pede login com
   `shouldCreateUser: false`.
5. **URLs de retorno do link.** *Authentication* → *URL Configuration*:
   - *Site URL*: o endereço da Vercel, por exemplo `https://atlas-seunome.vercel.app/`.
   - *Redirect URLs*: `https://atlas-seunome.vercel.app/**`, porque o link volta
     para a página de onde o login foi pedido, como `/atlas/politica/m2e1`.
     Para testar em casa, acrescente `http://localhost:5173/**`.
6. **Código no e-mail de login e recuperação.** *Authentication* → *Emails* → *Templates* →
   *Magic Link*:

   ```html
   <h2>Entrar no Atlas</h2>
   <p><a href="{{ .ConfirmationURL }}">Entrar neste aparelho</a></p>
   <p>Ou digite o código: <b>{{ .Token }}</b></p>
   ```

   Em *Sign In / Providers* → *Email*, confira *Email OTP Length* = 6 e o
   provedor de e-mail habilitado. A política de senha e a exigência de
   autenticação recente são definidas no Supabase. Após entrar por código,
   abra a sincronização e escolha **Definir ou alterar senha**.
7. **Anotar URL e chave pública.** *Project Settings* → *Data API* (URL) e
   *API Keys*: a **publishable** (`sb_publishable_…`) ou a legada **anon
   public**. Uma das duas basta.

## 2. Vercel

1. *Add New…* → *Project* → importe o repositório. O [`vercel.json`](../vercel.json)
   já define:
   - preset **Vite**, `npm ci`, `npm run build` e saída `dist`;
   - reescrita das rotas para `index.html`;
   - cache por tipo de arquivo.
2. *Environment Variables*:

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | URL do projeto |
   | `VITE_SUPABASE_ANON_KEY` | chave pública |

3. *Deploy*. Anote o endereço e use-o no passo 5 do Supabase.
4. Cada push em `main` publica de novo. Depois de mudar uma variável, refaça o
   deploy (*Deployments* → *Redeploy*), porque o Vite embute as variáveis no
   build.

Em desenvolvimento, as mesmas variáveis vão em `.env.local` (copie de
`.env.example`), que nunca é versionado.

## 3. GitHub

- **CI** (`.github/workflows/validate.yml`): roda em todo push e PR, com os
  jobs `qualidade` (tipos, lint, conteúdo, testes, build, tamanho e segredos),
  `e2e` (Playwright) e `banco` (migration em PostgreSQL).
- **Keepalive** (`.github/workflows/keepalive.yml`): uma vez por dia, às 09:17
  UTC, faz um `SELECT` na tabela `heartbeat` para o Supabase Free não pausar o
  projeto por inatividade. Configure em *Settings* → *Secrets and variables* →
  *Actions*:
  - `SUPABASE_URL`: a mesma URL;
  - `SUPABASE_ANON_KEY`: a mesma chave pública.

  Depois, dispare uma vez à mão em *Actions* → *keepalive* → *Run workflow*.

## 4. Roteiro de verificação

### Entrega privada de conteúdo

`api/conteudo.ts` é uma função Node da Vercel. O `vercel.json` inclui
`private/content/**` somente no pacote dessa função; esses arquivos não entram
em `dist/`. A função precisa das mesmas `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` em runtime e valida o token com Supabase Auth. Use
apenas a chave pública, sem segredo privilegiado.

Antes de publicar, execute `npm run privacy` depois do build. Não substitua o
deploy completo por upload isolado de `dist/`, porque ele não contém a API.
Valide o pacote de funções e, após publicação aprovada, teste a API sem token
(401), com token falso (401), com sessão permitida (200, no-store) e os caminhos
antigos (404). O `vite preview` local também executa o handler, mas não comprova
o empacotamento específico da Vercel.

Os materiais agora exigem conexão. Em modo avião o conteúdo deve ser ocultado
com aviso de conexão; ao reconectar, a sessão reconhecida pode continuar.
O service worker novo apaga `atlas-conteudo` ao ativar. Verifique isso num
aparelho com a versão antiga, sem apagar `atlas-v3` e sua fila.

A proteção deste site não fecha automaticamente um repositório GitHub público
nem deploys antigos. Audite esses canais antes de declarar os materiais
privados; alterar visibilidade e retirar publicações antigas exige confirmação
específica. Cópias já baixadas permanecem fora do controle do site.

Com dois aparelhos (celular e PC):

- [ ] **Login por código no PC:** abra `/entrar`, informe o e-mail e digite o
  código. Você vai para o mapa, e o indicador "Sincronizado" passa a aparecer.
- [ ] **Login pelo link no celular:** em `/entrar`, peça o login e abra o link
  no mesmo aparelho.
- [ ] **Livro no celular, PC depois:** marque um livro como lido no celular,
  abra o Atlas no PC e confira que está marcado.
- [ ] **Sessão intercalada:** escreva uma anotação no PC e marque um vídeo no
  celular. Os dois aparelhos devem ter as duas coisas.
- [ ] **Modo avião:**
  1. No celular, ligue o modo avião: o material é ocultado e aparece aviso de
     conexão, inclusive depois de recarregar.
  2. Desligue o modo avião: o acesso volta sem perder o progresso já salvo.
- [ ] **Sair deste aparelho:** as marcações continuam e a interface volta ao login.
- [ ] **iPhone na tela inicial:** *Compartilhar* → *Adicionar à Tela de
  Início*. Abra pelo atalho e entre em `/entrar` pelo **código**.
- [ ] **Visitante:** numa janela anônima, qualquer tela leva ao login; API sem bearer retorna 401 e `/content/areas.json` retorna 404.
- [ ] **Keepalive:** *Run workflow* fica verde.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| O código não chega | o e-mail padrão do Supabase tem limite baixo por hora; espere e confira o spam |
| "Código inválido ou expirado" | código antigo (cada pedido invalida o anterior) ou *Email OTP Length* diferente de 6 |
| O link leva para `localhost:3000` ou dá erro | *Site URL* / *Redirect URLs* sem o padrão `https://SEU-SITE/**` |
| "Não foi possível enviar agora" | e-mail diferente do da conta, conta criada depois de fechar os cadastros, ou limite de envio |
| `/entrar` diz que a sincronização não está configurada | variáveis `VITE_SUPABASE_*` ausentes no deploy; cadastre e refaça o deploy |
| Keepalive com HTTP 401 / 404 | chave errada / migration não rodou ou URL errada |
| Projeto pausado | keepalive sem secrets ou desativado; restaure no painel |

## Limitações

- **O GitHub desativa workflows agendados** após 60 dias sem atividade no
  repositório e avisa por e-mail; reativar é um clique em *Actions*.
- As demais limitações (relógio, iOS, edição simultânea) estão em
  [sincronizacao.md](sincronizacao.md#limitações-conhecidas).
