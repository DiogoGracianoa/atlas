# Renomeação do portal para Letrume

## Resultado esperado

O portal passa a se chamar **Letrume** e a ser servido em
`https://letrume.com.br`. Quem já usa o portal continua com todo o progresso,
anotações e preferências, inclusive o que ainda não tinha sido enviado ao
servidor quando o endereço mudou.

**Persona:** o autor, único usuário com conta, que usa o portal no computador e
no celular (inclusive como app instalado). **Benefício:** identidade própria
para o produto antes das novas seções.

## Escopo e não escopo

**Escopo**

- Nome visível: aba do navegador, cabeçalho, tela inicial, tela de entrada,
  app instalado, PDF, arquivo de backup, e-mails de autenticação.
- Domínio `letrume.com.br` como endereço principal.
- Continuidade de dados e sessão na troca de nome e de endereço.
- Documentação (README, deploy, arquitetura) com o nome novo.

**Não escopo**

- Mudar rotas, conteúdo das trilhas ou o design aprovado (cores, tipografia,
  layout), salvo resposta diferente à P1.
- Renomear o repositório no GitHub ou o projeto na Vercel/Supabase sem
  confirmação explícita (são ações externas).

**Projetos potencialmente impactados:** o portal na raiz (interface, PWA,
backup, documentação) e configurações externas feitas pelo autor: DNS do
domínio, domínio na Vercel, *Site URL* e *Redirect URLs* do Supabase, modelos
de e-mail do Supabase.

## Regras de negócio

- RN01 (nome do produto): toda superfície que nomeia o produto mostra
  "Letrume": título da aba, marca do cabeçalho, título da tela inicial, tela de
  entrada, nome e nome curto do app instalado, cabeçalho do PDF e campo de
  aplicativo do backup exportado.
- RN02 (e-mails): os e-mails de código, link de entrada e redefinição de senha
  nomeiam o produto como "Letrume" e levam a `letrume.com.br`.
- RN03 (continuidade local): depois da atualização com o nome novo, no mesmo
  endereço, o aparelho mantém marcações, anotações, preferências, posição de
  leitura, sessão e fila de envio pendente.
- RN04 (backup antigo): um backup exportado antes da mudança (aplicativo
  "Atlas de Estudos") continua sendo importado normalmente.
- RN05 (rotas preservadas): todo endereço que funcionava antes (ex.:
  `/atlas/politica/m2e1` e os endereços antigos com `#`) continua abrindo a
  mesma página.
- RN06 (domínio principal): `https://letrume.com.br` abre o portal e o login
  por senha e por código funciona nele.
- RN07 (endereço antigo): quem abre o endereço antigo chega ao mesmo caminho em
  `letrume.com.br`, mas só depois de o aparelho enviar ao servidor as
  marcações e anotações pendentes; sem conexão, o endereço antigo continua
  funcionando até conseguir enviar.
- RN08 (dados no novo endereço): ao entrar pela primeira vez em
  `letrume.com.br`, o aparelho recebe do servidor todas as marcações e
  anotações sincronizadas da conta.

## Critérios de aceite

- AC01 — nome visível: Dado o portal publicado, Quando abro a tela inicial,
  Então a aba e o cabeçalho mostram "Letrume" e nenhum texto chama o produto de
  "Atlas" (salvo a seção, conforme P2).
- AC02 — app instalado: Dado o app instalado no celular, Quando a atualização é
  aplicada, Então o nome do app passa a "Letrume" (conforme o sistema
  atualizar o atalho) e ele abre com o progresso existente.
- AC03 — backup novo: Dado um backup exportado após a mudança, Quando abro o
  arquivo, Então o aplicativo indicado é "Letrume".
- AC04 — backup antigo: Dado um backup "Atlas de Estudos" de 2026-11-07, Quando
  o importo, Então as marcações e anotações dele são mescladas como antes.
- AC05 — continuidade no mesmo endereço: Dado um aparelho com 3 marcações
  pendentes de envio, Quando a versão com o nome novo é carregada, Então as 3
  continuam pendentes e são enviadas na próxima sincronização.
- AC06 — rotas: Dado o link `/atlas/politica/m2e1`, Quando o abro em
  `letrume.com.br`, Então vejo o mesmo tema.
- AC07 — e-mail: Dada uma conta autorizada, Quando peço código de entrada,
  Então o e-mail diz "Letrume" e o link aponta para `letrume.com.br`.
- AC08 — redirecionamento com pendência: Dado um aparelho no endereço antigo
  com 1 anotação pendente e conexão, Quando abro o endereço antigo, Então a
  anotação é enviada e só depois sou levado ao mesmo caminho em
  `letrume.com.br`, onde a anotação aparece após entrar.
- AC09 — redirecionamento offline: Dado um aparelho no endereço antigo sem
  conexão, Quando abro o portal, Então ele continua funcionando no endereço
  antigo, sem redirecionar.
- AC10 — novo endereço: Dada uma conta com 40 marcações sincronizadas, Quando
  entro pela primeira vez em `letrume.com.br`, Então vejo as 40 marcações.

## Exemplos e limites

- Navegadores isolam dados por endereço: sessão e dados locais do endereço
  antigo não aparecem sozinhos no novo. Por isso RN07 exige enviar antes de
  redirecionar e RN08 exige baixar do servidor ao entrar.
- O nome do app instalado pode demorar a mudar no celular; isso depende do
  sistema operacional, não do portal.
- Um app instalado a partir do endereço antigo é um app diferente do instalado
  em `letrume.com.br`; o autor precisará instalar de novo.

## Rastreabilidade

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN01 | AC01, AC02, AC03 | nome nas superfícies | Parcial: seção e ícone em aberto (P1, P2) |
| RN02 | AC07 | e-mail com nome e domínio | Definido |
| RN03 | AC05 | pendências preservadas | Definido |
| RN04 | AC04 | importação de backup antigo | Definido |
| RN05 | AC06 | rotas antigas | Definido |
| RN06 | AC07, AC10 | login no domínio novo | Definido |
| RN07 | AC08, AC09 | redirecionar só depois de enviar | Bloqueado (P3) |
| RN08 | AC10 | dados no domínio novo | Definido |

## Perguntas em aberto

- P1 (bloqueante) Identidade: "identidade Letrume" é só o nome (mantendo cores,
  fontes e layout atuais) ou inclui novo ícone/logotipo? O ícone atual é um
  globo, ligado à ideia de "atlas". Se houver ícone novo, ele será fornecido
  pelo autor ou criado aqui? Impacto: RN01, AC02.
- P2 (bloqueante) A seção de estudos continua se chamando "Atlas de estudos"
  dentro do Letrume (Letrume › Atlas de estudos), ou também muda de nome?
  Impacto: RN01, AC01; as rotas `/atlas/...` não mudam em nenhum caso (RN05).
- P3 (bloqueante) Endereço antigo: ele deve redirecionar para
  `letrume.com.br` (com envio prévio das pendências, como em RN07) ou continuar
  funcionando em paralelo? Impacto: RN07, AC08, AC09.
- P4 Repositório e projetos externos: renomear o repositório GitHub, o projeto
  na Vercel e o pacote (`package.json`) para "letrume"? São ações externas que
  só acontecem com confirmação. Impacto: documentação e links do README.
- P5 Configuração do domínio: o autor configura o DNS no registro.br e o
  domínio na Vercel, ou quer um passo a passo em `docs/deploy.md` para isso?
  Impacto: ordem do plano (o código pode ficar pronto antes do DNS).

## Gate funcional

**Em esclarecimento.** P1 a P3 são bloqueantes.

## Extensão 2026-11-11 — respostas do autor

As perguntas acima ficam como histórico.

| Pergunta | Resposta |
|---|---|
| P1 Identidade | **Nome e ícone novos.** Cores, fontes e layout aprovados continuam; o ícone de globo é substituído por um ícone criado aqui, no mesmo estilo, aprovado pelo autor antes de publicar. |
| P2 Seção | **Continua "Atlas de estudos"** como nome da seção dentro do Letrume. |
| P3 Endereço antigo | **Redirecionar depois de enviar** as pendências do aparelho; sem conexão, segue funcionando (RN07). |

P4 e P5 não bloqueiam: nenhuma renomeação externa (GitHub, Vercel, Supabase,
pacote) acontece sem confirmação; a configuração do DNS e do domínio na Vercel
é feita pelo autor, com passo a passo em `docs/deploy.md`.

### Regras acrescentadas

- RN09 (ícone): o ícone do site e do app instalado (favicon, ícones 192 e 512,
  maskable e Apple) é o ícone Letrume aprovado pelo autor, nas cores atuais.
- RN10 (seção): a seção de trilhas continua chamada "Atlas de estudos"; textos
  que nomeiam a seção (ex.: "Mapa do Atlas") continuam; textos que nomeiam o
  produto mudam para Letrume.

### Critérios acrescentados

- AC11 — ícone: Dado o portal publicado, Quando vejo a aba e o app instalado,
  Então o ícone é o Letrume aprovado, não o globo.
- AC12 — seção: Dada a tela inicial do Letrume, Quando vejo as seções, Então o
  cartão "Atlas de estudos" continua, e o mapa se chama "Mapa do Atlas".

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN01 | AC01, AC02, AC03, AC12 | nome nas superfícies | Definido |
| RN07 | AC08, AC09 | redirecionar só depois de enviar | Definido |
| RN09 | AC11 | ícone novo | Definido |
| RN10 | AC12 | nome da seção | Definido |

### Gate funcional

**Pronto para planejamento.**

## Extensão 2026-11-12 — repositório e pacote

O autor pediu que o projeto também se chame Letrume no GitHub (resposta à P4).

- RN11 (repositório): o repositório `DiogoGracianoa/atlas` passa a se chamar
  `DiogoGracianoa/letrume`; endereços antigos continuam funcionando pelo
  redirecionamento do GitHub. A renomeação é feita pelo autor, no GitHub.
- RN12 (pacote): o nome do pacote (`package.json`) passa a `letrume`; chaves de
  armazenamento local (`atlas-v3` e afins) não mudam (RN03).
- AC13 — repositório: Dado o repositório renomeado, Quando faço `git push` no
  remoto atualizado para `https://github.com/DiogoGracianoa/letrume.git`,
  Então o push funciona e a Vercel publica o deploy.

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN11 | AC13 | push e deploy após renomear | Definido; depende da ação do autor |
| RN12 | — | nome do pacote | Definido (sem AC observável pelo estudante) |
