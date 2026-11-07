# Login com senha

## Resultado esperado

Permitir que uma pessoa autorizada entre no Atlas com login e senha sem depender do recebimento de e-mail durante o acesso.

## Escopo e não escopo

Inclui o acesso por credenciais. Gestão de contas, métodos existentes e recuperação de senha dependem das respostas abaixo. O projeto potencialmente afetado é o Atlas na raiz.

## Regras de negócio

- RN01 (acesso por senha): uma conta autorizada pode entrar usando seu identificador e senha, sem precisar receber mensagem para concluir esse acesso.
- RN02 (recusa): credenciais incorretas não concedem acesso ao conteúdo protegido.

## Critérios de aceite

- AC01 — entrada: Dada uma conta autorizada com senha cadastrada, Quando informo seu identificador e senha corretos, Então entro no Atlas sem receber e-mail para essa autenticação.
- AC02 — recusa: Dada uma conta autorizada, Quando informo senha incorreta, Então não acesso o conteúdo protegido.

## Exemplos e limites

O sistema atual usa e-mail como identificador e link ou código para autenticação; isso não define automaticamente a forma de criar ou recuperar senhas.

## Rastreabilidade

| RN | ACs | Cenários previstos | Situação |
|---|---|---|---|
| RN01 | AC01 | entrada com credenciais | Parcial: gestão da senha em aberto |
| RN02 | AC02 | senha incorreta | Definido |

## Perguntas em aberto

- (bloqueante) O acesso com senha deve substituir o código/link por e-mail ou coexistir com ele? Impacto: opções da tela e critérios de acesso. Responsável: solicitante.
- (bloqueante) Como as pessoas receberão ou definirão a senha inicial e como a recuperarão se esquecerem? Impacto: gestão de contas e independência de e-mail. Responsável: solicitante.
- (bloqueante) O identificador será o e-mail já associado à conta ou um nome de usuário separado? Impacto: credenciais e cadastro. Responsável: solicitante.

## Gate funcional

**Em esclarecimento**. Planejamento e implementação aguardam as decisões acima.

## Extensão 2026-11-07 — métodos de entrada

O solicitante definiu: **os dois métodos**; login com senha é o padrão da tela, com opção abaixo para login sem senha por código enviado ao e-mail. A pergunta sobre substituição ou coexistência está respondida e preservada acima como histórico.

- RN03 (escolha do método): a tela apresenta inicialmente a entrada com senha e oferece abaixo a opção de entrada por código de e-mail.
- AC03 — escolha: Dada a tela de entrada, Quando a pessoa a abre, Então vê o formulário de senha como padrão e a opção de acesso por código de e-mail abaixo.
- AC04 — código: Dada uma conta autorizada, Quando escolho o acesso sem senha e informo o código correto recebido por e-mail, Então entro no Atlas.

| RN | ACs | Cenários previstos | Situação |
|---|---|---|---|
| RN03 | AC03, AC04 | apresentação inicial e entrada por código | Definido |

O gate continua **Em esclarecimento**: definição e recuperação da senha e identificador permanecem em aberto.

## Extensão 2026-11-07 — definição e alteração de senha

O solicitante escolheu definir a senha dentro do próprio Atlas e disponibilizar um mecanismo de alteração no portal. A parte da pergunta relativa à definição inicial está respondida; a recuperação quando a senha for esquecida continua em aberto.

- RN04 (definição): a pessoa autorizada pode definir sua senha dentro do Atlas.
- RN05 (alteração): a pessoa autorizada pode alterar sua senha dentro do Atlas.
- AC05 — definição: Dada uma pessoa autorizada que ainda não definiu senha, Quando define uma senha no portal, Então pode usá-la para entrar posteriormente.
- AC06 — alteração: Dada uma pessoa autorizada, Quando altera sua senha no portal, Então pode usar a nova senha em acessos posteriores.

| RN | ACs | Cenários previstos | Situação |
|---|---|---|---|
| RN04 | AC05 | definição da primeira senha | Parcial: condições de acesso e recuperação em aberto |
| RN05 | AC06 | alteração de senha | Parcial: condições de autorização em aberto |

O gate permanece **Em esclarecimento**: faltam definir a recuperação e confirmar o identificador e as condições para alteração.

## Extensão 2026-11-07 — recuperação de acesso

O solicitante aprovou a recuperação por código de e-mail: a pessoa entra com o código e, já autenticada, define uma nova senha no portal. A parte da pergunta sobre recuperação está respondida.

- RN06 (recuperação): quem esqueceu a senha pode autenticar-se pelo código de e-mail e definir uma nova senha no portal.
- AC07 — recuperação: Dada uma conta autorizada cujo titular esqueceu a senha, Quando entra com o código correto recebido por e-mail e define uma nova senha, Então pode usá-la em acessos posteriores.

| RN | ACs | Cenários previstos | Situação |
|---|---|---|---|
| RN06 | AC07 | recuperação pelo código e definição de nova senha | Definido |

O gate continua **Em esclarecimento** enquanto o identificador e as condições de alteração são confirmados.

## Extensão 2026-11-07 — identificador e autorização

O solicitante confirmou o e-mail existente como identificador e que definição e alteração de senha exigem autenticação. As perguntas bloqueantes anteriores estão respondidas e permanecem como histórico.

- RN07 (autorização): somente uma pessoa autenticada pode definir ou alterar a senha de sua própria conta no portal.
- AC08 — acesso anônimo: Dada uma pessoa sem sessão, Quando tenta definir ou alterar senha, Então a operação não é disponibilizada nem concluída.
- AC09 — identificador: Dada uma conta autorizada, Quando entra por senha, Então usa o e-mail associado à conta.

| RN | ACs | Cenários previstos | Situação |
|---|---|---|---|
| RN07 | AC08 | tentativa sem sessão | Definido |
| RN01 | AC09 | identificação por e-mail | Definido |

## Gate funcional atual

**Pronta para planejamento**. Todas as perguntas bloqueantes foram respondidas; preservam-se os critérios e as decisões históricas. Não se abre cadastro público nem se altera a proteção dos materiais.
