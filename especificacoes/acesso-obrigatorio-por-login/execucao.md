# Execução — Acesso obrigatório por login

2026-11-06: solicitante aprovou o plano com “pode seguir”. Implementação local
autorizada; publicação e mudanças externas continuam fora desta aprovação.

O trabalho segue em branch `codex/acesso-obrigatorio-por-login`, no workspace
compartilhado. Não se cria outro checkout para não separar os artefatos aprovados
do workspace da pessoa. Tarefas serão registradas abaixo com RED/GREEN e
verificações; nenhum commit/push automático está previsto no plano aprovado.

## Registro por tarefa

- T01: teste S05 executado RED (501 em vez de 401), depois GREEN. Novos casos
  de autenticação válida, query duplicada, caminhos, método e indisponibilidade
  executados RED (8 falhas), depois 13 casos de servidor GREEN. O teste ficou
  em `tests/core/conteudo-servidor.test.ts` para usar o runner Node existente,
  em vez da pasta nova `tests/server/` prevista. Sem mudança de contrato.
- T02: privacidade da árvore RED (conteúdo ainda em public), depois GREEN.
  JSONs movidos sem reserialização; scripts/fixtures ajustados. Verificação de
  extração confirmou módulos originais byte a byte. Acrescentada inspeção do
  build com trecho vazado RED, depois GREEN, e script `npm run privacy` no CI.
- T03: seis cenários de guarda RED (rotas continuavam públicas), depois GREEN.
  Login público separado das ferramentas, estado de restauração explícito e
  rastreamento de conta movido para fora do Layout protegido. Métodos atuais
  de login e callback preservados nos testes.
- T04: quatro cenários de transporte/invalidação RED (fetch vazio e memória
  preservada), depois GREEN. Token no cabeçalho; 401 bloqueia; 503 não encerra
  sessão; logout preserva marcação; resposta tardia não repopula conteúdo.
- T05: regras de cache e expurgo RED, depois GREEN. Caso UI offline RED (mapa
  ainda aparecia), depois guarda de conectividade e GREEN na suíte completa.
  E2E confirmou exclusão de caches de materiais e atualização de versão.
- T06: runner e2e usa build real, handler real e Auth local exclusivo de teste;
  não há bypass no produto. O primeiro conjunto passou 8/9; o caso restante
  procurava indicador “Sincroniza” embora o status fosse Offline por fixture de
  CORS. Seletor passou a usar a ação acessível estável e CORS do Auth de teste
  passou a refletir os cabeçalhos solicitados. Suíte completa em verificação.
- T07: ADR-0012 e documentação atualizados. Suíte Vitest completa: 32 arquivos,
  410 testes passando. Testes Bash exigiram execução fora do sandbox; não se
  modificou sua implementação para mascarar restrições do ambiente.
- T08: não executada externamente. Sem publicação, mudança de visibilidade ou
  retirada de deploys antigos. Não há autorização para essas ações neste gate.

## Ambiente e validações

Node v24.22.1 do runtime do Codex usado à frente no PATH; scripts chamados pelos
binários JS instalados, porque o shim global de npm estava quebrado. Chrome
instalado usado pelo Playwright com `PLAYWRIGHT_CHANNEL=chrome` (CI continua
usando Chromium). Servidor HTTP e Bash precisaram de execução fora do sandbox.
Docker CLI existe, mas o daemon Linux não está em execução (pipe ausente).
Não se iniciou serviço nem se alterou banco para viabilizar verificação.

Uma revisão independente foi solicitada conforme a skill de revisão, somente
leitura e sem delegar a implementação. Achados e evidências finais serão
registrados em `revisao.md`.

## Correções da revisão independente

- P2/S14: `rejectSession` limpava só o estado da aplicação, permitindo
  reativação por evento automático do SDK. Teste novo reproduziu RED; agora
  encerra a sessão local do SDK e suprime restauração automática recusada até
  novo login explícito. Teste comprova persistência removida, recusa de evento
  antigo e novo login por código aceito.
- P2/S16: troca direta A→B preservava o estado React dos hooks de conteúdo.
  Teste UI reproduziu RED; a árvore protegida agora remonta por identidade,
  retira o material anterior imediatamente e recarrega manifesto/currículo.
- Correções verificadas juntas pela suíte completa: **412/412 testes** em
  32 arquivos, exit 0. Sem achado menor adiado ou alteração funcional nova.

## Encerramento local

Suíte completa de navegador: **76/76**, exit 0. Tipos (incluindo runner `.mts`),
lint e build final normal passaram. A checagem de tamanho ficou em 124,6 KB gzip;
privacidade, segredos e conteúdo passaram. Os três JSONs movidos são idênticos
ao HEAD byte a byte. Relatório temporário de testes removido; somente artefatos
de solução e mudanças necessárias permanecem. Branch preservada, sem commit,
merge, push ou publicação. Veredito e lacunas finais em `revisao.md`.

## Autorização posterior de versionamento

2026-11-06: o solicitante autorizou criar o commit e fazer push da alteração.
O envio será da branch `codex/acesso-obrigatorio-por-login` ao remoto `origin`,
sem merge na main nem mudança de visibilidade do repositório. A validação do
site publicado e dos canais anteriores continua uma etapa separada.
