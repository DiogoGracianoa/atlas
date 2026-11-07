# Contratos — Acesso obrigatório por login

Estado: proposta v1, sujeita à aprovação do plano.

## C01 — Navegador → entrega de conteúdo

- Operação: `GET /api/conteudo?arquivo=content/areas.json` ou caminho de currículo
  permitido. Dono: camada servidor do Atlas.
- Entrada: `Authorization: Bearer <access_token>` e um único caminho lógico
  exato da lista de arquivos de conteúdo. Token não vai em query string.
- Saída 200: JSON no mesmo formato atual, UTF-8. Sem redirecionamento HTML na
  API. O navegador sem sessão continua sendo redirecionado para `/entrar` pela
  guarda de navegação.
- Invariantes: validar token no Supabase antes de acessar arquivo; negar usuário
  anônimo do provedor; chave pública sozinha não autentica. Resolver somente
  caminhos de uma lista permitida, sem concatenação livre com o filesystem.
- Erros sem material: 401 credencial ausente/rejeitada; 404 arquivo fora da
  lista; 405 método diferente de GET (Allow: GET); 503 configuração/validação
  remota indisponível; 500 falha de leitura interna, com mensagem genérica.
- Cache em todas as respostas: `Cache-Control: private, no-store`, controle de
  CDN sem armazenamento e nenhum cache do service worker. Não habilitar CORS
  amplo; a API usa a mesma origem.
- Compatibilidade: preserva IDs, formato e texto; substitui entrega pública.
  GET é idempotente e não modifica dados. Logs não incluem token, e-mail,
  conteúdo, caminho físico ou erro bruto do provedor.

## C02 — Serviços de autenticação/conteúdo → interface

- Dono: `src/core/sync.ts` para sessão e `src/app/services.ts` para integração.
- Estado explícito: verificação inicial pendente, sessão reconhecida, sem
  sessão e falha de inicialização. Token acessível somente por operação do
  serviço que consulta o SDK; não entra em snapshots React nem no store v3.
- Guarda só monta a árvore protegida com sessão reconhecida. A marca de conta
  vista não autoriza nada. Tela de login não monta ações de backup/impressão.
- Fetch aguarda inicialização, obtém token atual e envia C01. Falha de rede/503
  mostra indisponibilidade; 401 bloqueia a sessão para a interface e exige
  autenticação, sem laço infinito de tentativas.
- Ao sair/trocar sessão: invalidar manifesto/áreas e requisições em andamento;
  resposta da sessão anterior nunca repopula a memória da sessão nova.
- Preservar store/fila de progresso existentes. Essa preservação não autoriza
  exposição em telas públicas. Operações de limpeza são idempotentes.
- Compatibilidade: tipos opcionais/mocks existentes devem ser migrados
  explicitamente; sem flag que permita bypass em build de produção.

## Extensão 2026-11-06 — aprovação e implementação

O solicitante aprovou o plano e estes contratos com “pode seguir”. C01 foi
implementado por `server/conteudo.ts`, `api/conteudo.ts` e adaptação dev/preview.
C02 foi implementado no serviço de sessão, transporte autenticado e guarda.
Na rejeição 401, a sessão local do SDK também é encerrada e seus eventos
automáticos não reabrem o acesso; login explícito posterior pode substituí-la.
A troca direta de identidade remonta a árvore de telas além de limpar memória.
