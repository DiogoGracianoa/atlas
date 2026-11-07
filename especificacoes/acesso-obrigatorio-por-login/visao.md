# Acesso obrigatório por login

Data: 2026-11-06. Estado: **Em esclarecimento**.
Descoberta: `.discovery/acesso-obrigatorio-por-login/` — **Construir**.

## Resultado esperado

Quem não está autenticado não consegue acessar o sistema e é redirecionado
para a tela de login existente (`/entrar`).

## Escopo e não escopo

- Exigir autenticação para abrir o portal e as seções, inclusive por endereço
  direto, e encaminhar quem está sem sessão para `/entrar`.
- Permitir acessar a tela de login sem autenticação.
- Tornar os materiais de estudo privados: escopo ainda em esclarecimento.
- Não foi solicitado criar cadastro, mudar quem pode entrar, trocar o método
  de login ou publicar a alteração.

## Regras de negócio

- RN01 (acesso autenticado): ao tentar abrir uma tela do sistema sem sessão
  autenticada, a pessoa não recebe acesso à tela e é encaminhada a `/entrar`.
- RN02 (entrada acessível): quem está sem sessão consegue abrir `/entrar` para
  realizar o login, sem ser preso em um ciclo de redirecionamentos.
- RN03 (saída): depois de encerrar a sessão, a pessoa deixa de ter acesso às
  telas protegidas e é encaminhada à tela de login.

## Critérios de aceite

- AC01 — portal: Dado que estou sem sessão, Quando abro `/`, Então sou levado
  a `/entrar` sem ver o conteúdo do portal.
- AC02 — link direto: Dado que estou sem sessão, Quando abro
  `/atlas/politica/m1e1`, Então sou levado a `/entrar` sem ver o tema.
- AC03 — login disponível: Dado que estou sem sessão, Quando abro `/entrar`,
  Então consigo acessar a tela de entrada sem ciclo de redirecionamentos.
- AC04 — sair: Dado que estou autenticado numa tela do Atlas, Quando encerro
  a sessão, Então deixo de ver a tela protegida e sou levado a `/entrar`.

## Exemplos e limites

- “Já entrou neste aparelho” não significa estar autenticado agora. A marca
  `atlas-conta-vista` existe somente para visibilidade da interface de conta.
- A nova necessidade altera o acesso anônimo descrito na RN18 de
  `especificacoes/portal-react/visao.md`. O artefato anterior permanece intacto;
  a mudança ainda depende de refinamento concluído e aprovação para código.
- Os materiais atuais incluem `public/content/areas.json`,
  `public/content/politica/curriculum.json` e
  `public/content/arquitetura-lideranca-tecnica/curriculum.json`.
- Os currículos contêm explicações, conceitos, oficinas e referências, não
  são os registros de progresso e anotações pessoais sincronizados no banco.
- A proteção da navegação não torna privados os arquivos estáticos nem apaga
  cópias já baixadas.

## Rastreabilidade

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN01 | AC01, AC02 | entrada pelo portal e link direto sem sessão | definido; escopo global pendente |
| RN02 | AC03 | tela de login pública | definido |
| RN03 | AC04 | saída de sessão durante uso | definido |

## Projetos potencialmente impactados

Repositório único, sem `projects/`. Evidências de navegação e autenticação em
`src/app/`, `src/core/sync.ts` e `tests/ui/conta.test.tsx`. A eventual proteção
dos arquivos pode ampliar a fronteira; não há decisão técnica tomada.

## Contexto e lacunas

Não existe `.sdd/` na raiz. Foram consultados visão, especificação e plano do
portal, `docs/arquitetura.md`, `docs/sincronizacao.md` e o código relevante.
Recomenda-se `$mapear-legado` para memória duradoura, sem condicionar este
esclarecimento à adoção da memória.

Os scripts de validação existem em `package.json` e há `node_modules`, mas
`node --version` e `npm --version` informaram que Node.js >=22.22.2 não está
instalado ou não foi encontrado no ambiente atual. Nenhum teste foi executado.

## Perguntas em aberto

- (bloqueante) Os materiais de estudo também devem ficar privados, impedindo
  download por endereço direto, ou basta exigir login para usar as telas?
  Origem: arquivos servidos de `public/content/`. Impacto: muda o escopo, os
  critérios de acesso e a fronteira da solução. Responsável: solicitante.

## Gate funcional

**Em esclarecimento**: há pergunta bloqueante. `$planejar` não foi iniciado;
nenhum código de produto foi alterado. Respostas posteriores entram como
extensões datadas, preservando o histórico.

## Extensão 2026-11-06 — materiais privados e conexão obrigatória

### Respostas recebidas

- Sobre proteger telas e materiais: **“pode proteger então tudo, por favor”**.
- Sobre deixar de guardar materiais para uso offline: **“Pode exigir conexão”**.

A pergunta bloqueante anterior está **respondida**. Seu texto permanece como
histórico. Estado funcional atual: **pronta para planejamento**.

### Escopo atualizado

Proteger as telas e a entrega do manifesto e dos currículos. Exigir conexão para
abrir os materiais. A tela de login e os arquivos técnicos necessários para
mostrá-la (JavaScript, CSS, fontes e ícones) continuam públicos; não podem conter
os materiais de estudo. Não se promete revogar cópias que alguém já baixou.
Login por código/link e contas permitidas continuam como no sistema existente;
não há cadastro novo. A entrada bem-sucedida por `/entrar` continua levando a
`/atlas`. Marcações e anotações locais continuam preservadas ao sair, sem acesso
pelas telas públicas.

### Regras acrescentadas

- RN04 (entrega autenticada): manifesto e currículos somente são entregues
  depois da validação da autenticação no servidor; conhecer a URL ou a chave
  pública do Supabase não concede acesso.
- RN05 (sem cópia estática pública): os materiais não podem ser publicados em
  diretórios estáticos, bundles ou mapas de código acessíveis sem login; os
  endereços antigos também não entregam o conteúdo.
- RN06 (conexão obrigatória): abrir os materiais depende de conexão; a nova
  versão não os guarda para leitura offline e remove o cache legado de conteúdo
  ao assumir o controle do navegador.
- RN07 (recusa segura): sessão ausente/rejeitada, configuração ausente ou
  impossibilidade de validar a autenticação não liberam conteúdo; a pessoa vê
  login ou aviso de indisponibilidade conforme a causa.
- RN08 (verificação da sessão): enquanto a sessão é restaurada, nenhuma tela
  protegida é exibida; uma sessão reconhecida permite navegar, e sua perda
  volta a bloquear o acesso.

### Critérios acrescentados

- AC05 — download anônimo: Dado que não envio uma sessão, Quando solicito o
  manifesto ou um currículo pela URL, Então não recebo nenhum material.
- AC06 — download autenticado: Dado que minha sessão é aceita pelo servidor,
  Quando abro uma área online, Então recebo o currículo e vejo os mesmos textos.
- AC07 — credencial rejeitada: Dado um token falso, expirado ou apenas a chave
  pública, Quando solicito conteúdo, Então o download é recusado sem material.
- AC08 — distribuição: Dado um build novo, Quando inspeciono seus arquivos
  públicos e bundles, Então os materiais não estão incorporados neles.
- AC09 — endereço antigo: Dado que estou sem sessão, Quando solicito
  `/content/areas.json` ou `/content/politica/curriculum.json`, Então não recebo
  os JSONs antigos.
- AC10 — falta de conexão: Dado que estou autenticado, Quando tento abrir
  material sem rede, Então vejo indisponibilidade, sem usar cópia offline.
- AC11 — cache antigo: Dado um aparelho com cache `atlas-conteudo`, Quando o
  service worker novo assume o controle, Então remove esse cache e não grava
  novas respostas de conteúdo para leitura offline.
- AC12 — indisponibilidade: Dado que a configuração está ausente ou o serviço
  de autenticação está inacessível, Quando tento acessar material, Então nenhum
  material é entregue e vejo uma mensagem adequada, sem detalhes internos.
- AC13 — sessão persistida: Dado que a sessão ainda está sendo restaurada,
  Quando abro um tema, Então só vejo o estado de verificação; depois da sessão
  reconhecida, o tema abre sem passagem indevida pelo login.
- AC14 — sessão perdida: Dado que eu estava autenticado, Quando a sessão é
  removida ou o servidor rejeita minha credencial, Então o conteúdo deixa de
  aparecer e sou levado a `/entrar`.
- AC15 — métodos existentes: Dado meu acesso permitido no Supabase, Quando
  entro pelo código correto ou link válido, Então chego autenticado a `/atlas`;
  um código/link rejeitado mantém o acesso bloqueado.

AC04 também verifica que sair mantém as marcações/anotações, mas não deixa
acessíveis conteúdo, exportação, impressão ou ferramentas protegidas no login.

### Rastreabilidade atual

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN01 | AC01, AC02 | entrada e links diretos sem sessão | definido |
| RN02 | AC03, AC15 | login público, código e link | definido |
| RN03 | AC04 | saída e preservação do progresso | definido |
| RN04 | AC05, AC06, AC07 | download e validação no servidor | definido |
| RN05 | AC08, AC09 | build e URLs legadas sem materiais | definido |
| RN06 | AC10, AC11 | rede e atualização do cache | definido |
| RN07 | AC07, AC12 | recusa por credencial/configuração/serviço | definido |
| RN08 | AC13, AC14 | restauração e perda da sessão | definido |

### Compatibilidade e limites

Esta necessidade revê acesso anônimo, distribuição estática e leitura offline
descritos na visão do portal (RN06, RN10, RN18), além do modo só local. Os
documentos antigos não foram substituídos. Privacidade no site exige também
verificar repositório, versões publicadas anteriormente e outros canais que
possam distribuir os mesmos arquivos. A documentação descreve o repositório
como público; a visibilidade atual não pôde ser confirmada nesta sessão.
Alterar a visibilidade do GitHub, retirar deploys antigos e publicar a nova
versão são ações externas que exigem confirmação específica na entrega.

### Perguntas e gate atuais

Nenhuma pergunta funcional bloqueante restante. Código somente depois do plano
e da aprovação explícita prevista no AGENTS.md. A aprovação do escopo acima não
é aprovação de um plano técnico que ainda não tinha sido apresentado.

### Atualização da validação local

O comando `node` do PATH aponta para um gerenciador sem a versão exigida, mas
foi encontrado Node v24.22.1 no runtime do Codex. Com o executável absoluto,
`tsc --noEmit` e `tsc --noEmit -p tsconfig.sw.json` passaram antes de qualquer
alteração de produto. A indisponibilidade geral de Node registrada antes está
superada; os demais comandos continuam pendentes.

## Extensão 2026-11-06 — aprovação e encerramento local

Após apresentação do plano, o solicitante autorizou a implementação com
**“pode seguir”**. A alteração local foi implementada e revisada, preservando
as decisões funcionais acima. Evidências em `revisao.md`: 412 testes de núcleo,
componentes e scripts e 76 testes de navegador passaram, assim como tipos,
lint, build, tamanho, segredos, privacidade e integridade de conteúdo.

Estado atual: **implementação local concluída; publicação pendente**. Banco
não revalidado por indisponibilidade do Docker. Empacotamento Vercel, HTTP real
publicado e auditoria dos canais públicos anteriores permanecem lacunas da
etapa externa, que não foi autorizada nem executada nesta entrega.
