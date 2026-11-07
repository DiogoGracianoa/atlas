# ADR-0012: Acesso e conteúdo autenticados

Status: aceita para implementação local · Data: 2026-11-06.
Origem: [plano aprovado](../../especificacoes/acesso-obrigatorio-por-login/plano.md).

## Contexto

O responsável exigiu login para usar o Atlas e baixar os materiais, e aceitou
exigir conexão. Uma guarda React não protege arquivos estáticos. A configuração
anterior publicava os JSONs e os guardava no service worker.

## Alternativas

- Guarda de navegação somente: não atende à proteção de download.
- Bucket privado no Supabase: funciona, mas adiciona upload e publicação dos
  currículos em outro serviço.
- Função Node na Vercel, com arquivos privados no pacote: reaproveita o deploy
  existente e os JSONs versionados, sem credencial privilegiada ou schema novo.

## Decisão

Materiais em `private/content/`, fora de `public/` e do bundle. A função
`api/conteudo.ts` usa `server/conteudo.ts` para validar o bearer com Supabase
`getUser` antes de ler material, negar identidades anônimas e limitar caminhos
ao manifesto. Respostas usam no-store, sem cache de CDN ou do service worker.

`/entrar` é público e isolado das ferramentas de dados; o restante da árvore
monta somente depois da restauração da sessão. Conteúdo em memória é invalidado
ao mudar a identidade, inclusive respostas em trânsito. A perda de rede oculta
o material. A versão nova apaga o cache legado `atlas-conteudo` ao ativar.
O progresso local continua preservado. Dev e preview usam o mesmo handler;
o Auth falso de e2e existe somente em `tests/e2e-server.mts`.

## Consequências

Deixa de existir modo de visita anônima e leitura offline dos materiais.
A API exige disponibilidade de Auth e execução de uma função por download.
As mesmas variáveis públicas do Supabase são necessárias no build e na função;
não se usa service_role. `npm run privacy` inspeciona os artefatos estáticos.
Os ADRs 0005, 0007 e 0010 permanecem históricos e são parcialmente superados
quanto a acesso local anônimo, cache dos materiais e sua distribuição pública.
Sem publicar, esta alteração não protege o site existente. Repositório público,
deploys antigos e cópias previamente obtidas continuam canais separados; a
entrega registra essas lacunas e exige confirmação para ações externas.

## Gatilho de revisão

Necessidade de conteúdo offline, gestão de conteúdo separada ou custo/latência
de Auth que justifique outra estratégia de validação e distribuição privada.
