# Portal Atlas em React, pronto para novas seções e documentado para portfólio

Data: 2026-11-05 · Descoberta: `.discovery/portal-react/` (decisão **Construir**)

## Resultado esperado

O Atlas passa a ser um **portal de seções** construído em React com TypeScript.
A primeira seção é o atlas de estudos que já existe, com todos os recursos atuais
e os dados de quem já usa preservados. A estrutura comporta uma segunda seção,
de dossiês, sem tocar no núcleo. A interface pode ser redesenhada. O repositório
ganha documentação de portfólio: README em inglês e documentação de arquitetura,
sincronização, conteúdo, deploy e decisões em português.

**Persona e benefício:**
- **Autor:** cresce o portal com menos custo e menos risco.
- **Quem avalia o portfólio:** entende arquitetura, decisões e qualidade sem
  precisar ler todo o código.

## Escopo e não escopo

**Escopo**

- **Migração da interface:** reescrever a interface em React com TypeScript,
  com build estático, e portar para TypeScript o núcleo atual (armazenamento,
  mescla, fila, backup, conteúdo e sincronização).
- **Portal de seções:** página inicial do portal, registro de seções, atlas como
  primeira seção e cartão "Dossiês — em breve".
- **Rotas:** rotas limpas com prefixo de seção e redirecionamento dos links
  antigos.
- **Redesenho visual:** nova aparência, dentro dos limites das RNs de
  acessibilidade e de preferências.
- **Qualidade e entrega:** offline (PWA), build e deploy na Vercel, CI com tipos,
  testes, validação de conteúdo, testes do banco e build.
- **Documentação:**
  - README em inglês;
  - `docs/` em português: arquitetura, sincronização, conteúdo, deploy e ADRs;
  - capturas de tela.

**Não escopo**

- A seção de dossiês em si: formato, conteúdo, telas e sincronização. Ela terá
  especificação própria.
- Mudanças no banco (tabelas, RLS ou trigger) e no formato do conteúdo
  (`areas.json` e `curriculum.json`).
- Conteúdo novo de estudo.
- Recursos novos no atlas além dos atuais.
- Internacionalização do site: o conteúdo e a interface continuam em português.

## Regras de negócio

- **RN01 (paridade funcional):** todo recurso do inventário (ver "Exemplos e
  limites") continua disponível depois da migração, com o mesmo efeito para o
  usuário, ainda que com outra aparência. Recurso ausente reprova a entrega.
- **RN02 (dados locais preservados):** ao abrir a nova versão num aparelho que já
  tem estado v3 (`atlas-v3`) e fila (`atlas-v3-queue`), o usuário vê as mesmas
  marcações, anotações, posição de "continuar", tamanho de texto e tema. As
  operações pendentes são enviadas quando houver sessão e rede. Também continua
  válida a leitura única do estado v2 legado.
- **RN03 (sincronização inalterada):** as regras de sincronização da
  especificação anterior (`atlas-sincronizado-multiarea`, RN07–RN15, RN25–RN32)
  continuam valendo sem mudança:
  - escrita local primeiro;
  - granularidade por linha;
  - marcação enviada imediatamente e anotação 800 ms depois da última tecla;
  - mescla pelo mais recente;
  - fila persistida;
  - busca de dados ao abrir, ao voltar para a aba e ao reconectar;
  - Zerar com marca de corte (`resetAt`);
  - versão perdedora da anotação preservada com marcador.

  As tabelas e as colunas enviadas ao Supabase não mudam.
- **RN04 (rotas limpas):** os endereços do portal são:
  - `/`: início do portal;
  - `/atlas`: mapa de áreas;
  - `/atlas/{área}`: capa da área;
  - `/atlas/{área}/{id}`: tema ou oficina.

  Se a área estiver planejada ou não existir, o endereço leva ao mapa
  (`/atlas`) com aviso. Se o item não existir, leva à capa da área.
- **RN05 (links antigos):** endereços no formato anterior abrem o equivalente
  novo, substituindo o endereço sem criar uma entrada extra no histórico:
  - `/#/` vai para `/atlas`;
  - `/#/{área}` vai para `/atlas/{área}`;
  - `/#/{área}/{id}` vai para `/atlas/{área}/{id}`;
  - `/#{id}` e `/#inicio` são o legado de política e vão para
    `/atlas/politica/{id}` e `/atlas/politica`.
- **RN06 (acesso direto):** abrir ou recarregar qualquer rota limpa abre a página
  certa: online, no site publicado, e offline, depois da primeira visita, para a
  estrutura do site e as áreas já abertas.
- **RN07 (portal de seções):** a página inicial lista as seções do portal a partir
  de um registro único. Seção disponível tem link. Seção planejada aparece como
  "em breve", sem link. Neste ciclo: Atlas de estudos (disponível) e Dossiês
  (planejada).
- **RN08 (seção nova sem mexer no núcleo):** acrescentar uma seção exige apenas
  os arquivos da própria seção e uma entrada no registro. Shell, roteamento
  base, armazenamento e sincronização não são alterados.
- **RN09 (área nova sem código):** acrescentar uma área ao atlas continua exigindo
  apenas `content/areas.json` e o `curriculum.json` da área, sem mudança de
  código.
- **RN10 (offline):** sem rede, o portal abre e permite navegar e marcar nas áreas
  já abertas antes. Uma área nunca aberta mostra "Esta área precisa de conexão na
  primeira abertura." e a navegação continua funcionando.
- **RN11 (login):** o login continua por link e por código de 6 dígitos. Ao voltar
  pelo link do e-mail, o usuário cai na mesma página de onde pediu o login, já
  autenticado. "Sair deste aparelho" mantém os dados locais.
- **RN12 (redesenho com limites):** a aparência pode mudar livremente, desde que:
  - existam os temas auto, claro e escuro e os quatro tamanhos de texto (P, M, G
    e GG), guardados por aparelho;
  - as cores de tradição venham do manifesto;
  - o texto tenha contraste mínimo WCAG AA (4,5:1 para o normal e 3:1 para o
    grande);
  - toda ação funcione pelo teclado, com foco visível;
  - não haja rolagem horizontal a partir de 320 px de largura;
  - os campos de texto tenham fonte de pelo menos 16 px, para o iOS não dar zoom
    sozinho.
- **RN13 (primeira tela rápida):**
  - a primeira tela não espera o carregamento do cliente do Supabase;
  - o JavaScript inicial da página do portal, comprimido com gzip, fica em até
    150 KB;
  - estourar o limite reprova o build.
- **RN14 (PDF da área):** o usuário consegue gerar o roteiro completo da área
  aberta para "Salvar como PDF" na janela de impressão, como hoje.
- **RN15 (documentação de portfólio):**
  - O README, em inglês, tem as seções:
    - visão geral e motivação;
    - capturas de tela;
    - recursos;
    - arquitetura com diagrama;
    - sincronização offline-first;
    - estratégia de testes;
    - stack;
    - como rodar localmente;
    - deploy;
    - estrutura de pastas;
    - decisões (com link para os ADRs);
    - roteiro de evolução.
  - A pasta `docs/`, em português, traz:
    - `arquitetura.md`;
    - `sincronizacao.md`;
    - `conteudo.md`, com o formato do currículo e o guia de área nova;
    - `deploy.md`, com Supabase, Vercel e GitHub;
    - `adr/`, com um arquivo por decisão (contexto, alternativas, escolha,
      consequências e gatilho de revisão).
  - Todo comando citado na documentação funciona num clone limpo.
- **RN16 (portões de qualidade):** cada push roda:
  - checagem de tipos estrita;
  - lint;
  - testes;
  - validação de conteúdo;
  - testes do banco;
  - build com o limite da RN13.

  Qualquer falha deixa o push vermelho.
- **RN17 (segredos):** nenhuma chave secreta entra no repositório nem no bundle.
  Só a URL do projeto e a chave pública (anon/publishable) do Supabase podem
  aparecer no front.

## Critérios de aceite

- **AC01 — paridade:** Dado o inventário de recursos, Quando cada item é
  exercitado na nova versão, Então todos produzem o efeito descrito; um item
  ausente reprova.
- **AC02 — atualização sem perda:** Dado um aparelho com `atlas-v3` contendo
  marcações em `politica/m1e1:def` e `politica/m8e3:vid`, uma anotação em
  `politica/m2e1`, `lastAt` em `politica/m3e2`, tema escuro e tamanho G, e uma
  fila com 2 operações pendentes, Quando a nova versão é aberta, Então tudo
  aparece igual e, com sessão e rede, a fila é enviada e esvaziada.
- **AC03 — legado v2:** Dado só `atlas-estudos-v2` com `m1e1:def` marcado,
  Quando a nova versão abre pela primeira vez, Então `politica/m1e1:def` aparece
  marcado e a chave v2 continua intacta.
- **AC04 — sincronização:** Dado o conjunto de cenários de sincronização da
  especificação anterior, com dois aparelhos, fila offline, conflito de anotação,
  Zerar e logout durante o envio, Quando executado contra a nova base, Então os
  resultados são os mesmos.
- **AC05 — rotas limpas:** Dado o site publicado, Quando abro `/`, `/atlas`,
  `/atlas/politica` e `/atlas/politica/m8e3`, Então vejo portal, mapa, capa de
  política e o tema "Marx: dívida pública, impostos e capital fictício".
- **AC06 — rota inválida:** Dado `/atlas/historia` (planejada), `/atlas/xyz` e
  `/atlas/politica/zzz`, Quando abro cada um, Então vou ao mapa com aviso, ao
  mapa com aviso e à capa de política, respectivamente.
- **AC07 — links antigos:** Dado `/#/politica/m1e1`, `/#m1e1`, `/#inicio`,
  `/#/politica` e `/#/`, Quando abro cada um, Então o endereço vira
  `/atlas/politica/m1e1`, `/atlas/politica/m1e1`, `/atlas/politica`,
  `/atlas/politica` e `/atlas`, e voltar no navegador não reabre o endereço
  antigo.
- **AC08 — recarregar:** Dado `/atlas/politica/m1e1` aberto no site publicado,
  Quando recarrego a página, Então ela reabre no mesmo tema, e não numa página
  404.
- **AC09 — offline:** Dado que visitei o portal e abri política, Quando fico
  offline e abro `/atlas/politica/m3e1` direto, Então o tema abre e consigo
  marcá-lo; Quando abro `/atlas/{área nunca aberta}`, Então vejo "Esta área
  precisa de conexão na primeira abertura." e o menu continua navegável.
- **AC10 — portal:** Dado o registro com Atlas (disponível) e Dossiês
  (planejada), Quando abro `/`, Então vejo o cartão do Atlas com link para
  `/atlas` e progresso, e o cartão de Dossiês com "em breve" e sem link.
- **AC11 — seção nova:** Dado uma seção de teste registrada só com os próprios
  arquivos e uma entrada no registro, Quando o portal é montado no teste, Então a
  seção aparece na página inicial e sua rota responde, sem diff em shell,
  armazenamento ou sincronização.
- **AC12 — área nova:** Dado um `curriculum.json` de teste e a entrada
  correspondente no manifesto, Quando o portal carrega, Então a área aparece no
  mapa e é navegável sem mudança de código.
- **AC13 — login pelo link:** Dado que pedi o login estando em
  `/atlas/politica/m2e1`, Quando abro o link do e-mail no mesmo aparelho, Então
  volto a `/atlas/politica/m2e1` autenticado, e o parâmetro de autenticação some
  do endereço.
- **AC14 — login pelo código:** Dado o código de 6 dígitos correto, Quando o
  digito, Então fico autenticado; Dado um código errado ou expirado, Então vejo
  "Código inválido ou expirado. Peça um novo."
- **AC15 — sair:** Dado que estou autenticado com marcações, Quando saio deste
  aparelho, Então as marcações continuam visíveis e o indicador mostra "Não
  sincronizado".
- **AC16 — preferências e acessibilidade:** Dado cada combinação de tema (claro
  e escuro) e o tamanho GG, Quando reviso as telas principais (portal, mapa,
  capa, tema, oficina, menu e conta), Então:
  - o texto atinge contraste AA;
  - toda ação funciona pelo teclado, com foco visível;
  - não há rolagem horizontal a 320 px;
  - os campos de texto têm fonte de pelo menos 16 px.
- **AC17 — limite de tamanho:** Dado o build de produção, Quando medido, Então o
  JavaScript inicial do portal fica em até 150 KB comprimido com gzip e não inclui
  o cliente do Supabase.
- **AC18 — PDF:** Dado política aberta, Quando aciono "Salvar roteiro em PDF",
  Então a janela de impressão traz todos os módulos, temas e oficinas da área.
- **AC19 — documentação:** Dado um clone limpo, Quando sigo o README em inglês e
  `docs/deploy.md`, Então:
  - os comandos de instalação, desenvolvimento, teste e build funcionam;
  - o README tem todas as seções da RN15;
  - cada ADR tem contexto, alternativas, escolha, consequências e gatilho de
    revisão.
- **AC20 — CI:** Dado um push com erro de tipo, de lint, de teste, de conteúdo,
  do banco ou de tamanho, Quando a Action roda, Então ela fica vermelha; sem
  erros, fica verde.
- **AC21 — segredos:** Dado o repositório e o bundle de produção, Quando procuro
  `service_role`, `sb_secret_` e chaves JWT com papel `service_role`, Então não
  há ocorrência.

## Exemplos e limites

**Inventário de recursos (RN01), observado em `assets/app.js` e `index.html`:**

1. **Mapa de áreas:**
   - cartões com progresso;
   - áreas planejadas aparecem como "em breve";
   - cartão "Continuar de onde parei".
2. **Capa da área:**
   - título, subtítulo e texto de abertura com contagem de módulos e temas;
   - rota de três passos.
3. **Menu lateral:**
   - seletor de área;
   - módulos com o progresso de cada um;
   - lista de temas e oficina;
   - destaque do item atual.
4. **Busca:**
   - filtra os temas da área;
   - atalho "buscar em todas as áreas", que agrupa os resultados por área.
5. **Barra de progresso** da área.
6. **Página do tema:**
   - percurso de três passos com atalhos para cada seção;
   - definição, conceitos, teses e debate;
   - vídeos com foco;
   - livro ou ponte (quando não há livro);
   - perguntas de verificação;
   - marcações de definição, vídeo e livro.
7. **Tutor por IA:** copiar o prompt montado para o tema e abrir no Claude ou no
   ChatGPT.
8. **Anotações por item:** salvas a cada tecla, sem perder o foco quando chega
   uma atualização remota.
9. **Navegação** de anterior e próximo entre itens.
10. **Página da oficina:** proposta, exercício, entregável e marcação "feito".
11. **Backup:** exportar e importar (mescla, vence o mais recente).
12. **Zerar** com confirmação, valendo em todos os aparelhos.
13. **Salvar o roteiro da área em PDF.**
14. **Ajustes de leitura:** tamanho de texto (P, M, G e GG) e tema (auto, claro e
    escuro).
15. **Indicador de sincronização** e painel de conta: e-mail, código, link,
    reenviar e sair.
16. **Avisos** (toast) e texto de backup que muda conforme o login.

**Limites:**
- Item sem livro mostra a ponte.
- Área planejada nunca abre.
- Anotação até 200 000 caracteres na importação.
- Um prefixo de seção desconhecido (por exemplo, `/xyz`) leva ao portal (`/`)
  com aviso.

## Rastreabilidade

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN01 | AC01, AC18 | paridade por item do inventário | coberta |
| RN02 | AC02, AC03 | estado v3, fila e legado v2 | coberta |
| RN03 | AC04 | suíte de sincronização portada | coberta |
| RN04 | AC05, AC06 | tabela de rotas | coberta |
| RN05 | AC07 | redirecionamento de links antigos | coberta |
| RN06 | AC08, AC09 | recarregar online e offline | coberta |
| RN07 | AC10 | registro de seções | coberta |
| RN08 | AC11 | seção de teste | coberta |
| RN09 | AC12 | área de teste | coberta |
| RN10 | AC09 | offline | coberta |
| RN11 | AC13, AC14, AC15 | login e logout | coberta |
| RN12 | AC16 | acessibilidade e preferências | coberta |
| RN13 | AC17 | limite de tamanho | coberta |
| RN14 | AC18 | PDF | coberta |
| RN15 | AC19 | documentação | coberta |
| RN16 | AC20 | CI | coberta |
| RN17 | AC21 | busca de segredos | coberta |

Nenhum gap: toda RN tem AC e todo AC aponta para uma RN.

## Projetos potencialmente impactados

Repositório único, sem `projects/`.

- **Mudam:**
  - a interface (`index.html`, `assets/`, `sw.js`);
  - os scripts;
  - os testes do app;
  - o CI;
  - o `vercel.json`;
  - o README e a pasta `docs/`.
- **Mudam fora do repositório (passos manuais do autor):**
  - o preset do projeto na Vercel;
  - as URLs de retorno no Supabase.
- **Só validam:**
  - a migration e os testes do banco;
  - o conteúdo (`content/`), que pode mudar de lugar, mas não de formato.

## Perguntas em aberto

Nenhuma. As três perguntas originais, preservadas abaixo, foram respondidas na
extensão de 2026-11-05.

- **Licença** (não bloqueante): qual licença usar no repositório público?
  Sugestão: MIT para o código e "todos os direitos reservados" ou CC BY-NC para o
  texto do conteúdo. Impacto: a seção de licença do README.
- **Demo pública** (não bloqueante): o README pode apontar para o endereço da
  Vercel como demo? Visitantes usam o site só com armazenamento local, sem login.
  Impacto: o link no README.
- **Login visível para visitantes** (não bloqueante): visitantes do portfólio
  devem ver o indicador "Não sincronizado" e o painel de login, que só funciona
  para a conta do autor? Hipótese padrão: manter visível, com o texto "Login
  restrito ao autor".

## Extensão 2026-11-05 — respostas do autor

As perguntas em aberto foram respondidas. As regras e os critérios originais
ficam como estavam, com as mudanças abaixo valendo por cima deles.

- **Licença:** MIT. A RN15 passa a exigir `LICENSE` (MIT) na raiz e uma seção
  "License" no README. Como o autor não separou código e conteúdo, a MIT cobre o
  repositório inteiro.
- **Demo pública:** o README aponta o endereço publicado na Vercel como demo. Na
  demo, visitantes usam o site com armazenamento local.
- **Login visível para visitantes:** "a princípio, não; depois talvez". Isso
  gera a RN18 e o AC22 abaixo e muda o ponto de partida do login na RN11 e no
  AC13.

### Regra acrescentada

- **RN18 (login discreto):** quem nunca entrou neste aparelho não vê o indicador
  de sincronização, o painel de conta nem o texto sobre login. O autor entra pelo
  endereço `/entrar`, que não tem link em lugar nenhum do site. Depois de entrar
  uma vez no aparelho, o indicador e o painel de conta passam a aparecer nele,
  inclusive depois de sair. Esse comportamento pode ser revisto depois, sem mudar
  a sincronização.

### Critérios acrescentados ou ajustados

- **AC22 — visitante:** Dado um aparelho em que ninguém entrou, Quando abro `/`,
  `/atlas` e um tema, Então não aparece indicador de sincronização, botão de
  login nem texto sobre login; o texto de backup fala só em "salvo neste
  aparelho".
- **AC22b — autor:** Dado um aparelho em que ninguém entrou, Quando abro
  `/entrar`, informo o e-mail e o código correto, Então fico autenticado, sou
  levado ao mapa (`/atlas`), e o indicador passa a aparecer em todas as páginas.
- **AC13 (ajustado):** Dado que pedi o login em `/entrar`, Quando abro o link do
  e-mail no mesmo aparelho, Então volto autenticado e sou levado ao mapa
  (`/atlas`), e o parâmetro de autenticação some do endereço. Dado que já entrei
  antes neste aparelho e peço o login pelo painel de conta em
  `/atlas/politica/m2e1`, Então volto a `/atlas/politica/m2e1`.

### Rastreabilidade (acréscimo)

| RN | ACs | Cenários previstos | Estado |
|---|---|---|---|
| RN15 | AC19 | `LICENSE` MIT e seção no README | coberta |
| RN18 | AC22, AC22b, AC13 | visitante e autor | coberta |
