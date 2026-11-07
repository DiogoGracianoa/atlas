# Revisão — Acesso obrigatório por login

Data: 2026-11-06. Escopo: implementação local aprovada pelo solicitante.
Veredito: **Aprovada com lacunas de ambiente e publicação**. Os dois achados
P2 foram corrigidos com testes RED→GREEN. Nenhum achado importante local aberto.
Isso não declara o site publicado, o repositório ou versões antigas privados.

## Evidência por cenário

| Cenário | Teste/comando | Código | Evidência e resultado |
|---|---|---|---|
| S01–S03 | `tests/ui/acesso.test.tsx`, `e2e/acesso.spec.ts` | `RequireAuth`, rotas e login | visitantes redirecionados sem fetch de material; login sem ferramentas de dados — passou |
| S04 | `tests/ui/conta.test.tsx`, `tests/core/content-auth.test.ts`, `e2e/acesso.spec.ts` | sync, serviços e cache de conteúdo | sair leva ao login, conserva progresso e invalida conteúdo — passou |
| S05–S07 | `tests/core/conteudo-servidor.test.ts`, `e2e/acesso.spec.ts` | handler servidor | sem token/falso/expirado/chave pública/usuário anônimo recusados; sessão aceita recebe material — passou |
| S08 | `tests/scripts/conteudo-privado.test.ts`, `node scripts/check-private-content.mjs` | árvore privada e build | vazamento de texto é detectado no teste; build real sem materiais públicos — passou |
| S09 | `e2e/acesso.spec.ts`, `e2e/smoke.spec.ts` | middleware HTTP e ausência de arquivos em dist | caminhos antigos e `/private/content/...` retornam 404 — passou localmente |
| S10 | `tests/ui/acesso.test.tsx`, `e2e/offline.spec.ts` | guarda de conectividade | offline oculta até material já carregado; reconexão permite continuar — passou |
| S11 | `tests/core/sw-rules.test.ts`, `e2e/offline.spec.ts` | service worker | API/materiais não entram em cache; ativação remove caches antigos — passou |
| S12 | testes de acesso e servidor | sessão/handler | sem configuração ou Auth indisponível não libera material — passou |
| S13 | `tests/ui/acesso.test.tsx` | restauração de sessão | aguarda sessão sem montar tela nem redirecionar cedo — passou |
| S14 | testes de conta/acesso/content-auth | rejeição e SDK | 401 bloqueia acesso e limpa SDK; evento automático antigo não reautoriza — passou |
| S15 | testes de conta e sync-auth | login/callback | código certo/errado, link e limpeza de parâmetros preservados — passou |
| S16 | testes de content-auth e acesso | geração do cache e chave da árvore | resposta tardia descartada; troca direta A→B retira material anterior e recarrega — passou |
| S17 | `tests/core/conteudo-servidor.test.ts` | autorização/allowlist | traversal, query duplicada e método indevido recusados; erros genéricos — passou |
| S18 local | build e e2e com handler real | middleware Vite/servidor | HTTP autenticado/anônimo no build real, sem desativar a guarda — passou |
| S18 produção | roteiro em `docs/deploy.md` | pacote/publicação Vercel e canais anteriores | não executado; publicação não autorizada neste gate |

## Comandos e resultados

Os comandos abaixo equivalem aos scripts do `package.json`, executados pelos
binários JS instalados. Node v24.22.1 do runtime do Codex foi colocado à frente
no PATH porque o shim global de npm não encontrava a versão de Node. Não houve
instalação ou atualização de dependências.

| Comando executado | Resultado |
|---|---|
| `node node_modules/vitest/vitest.mjs run --reporter=dot` | exit 0; **412/412**, 32 arquivos, após as duas correções da revisão |
| `node node_modules/vitest/vitest.mjs run tests/core/content-auth.test.ts tests/ui/acesso.test.tsx --reporter=dot` | exit 0; 13/13 no código final, após compatibilizar PromiseLike no encerramento do SDK |
| `node node_modules/playwright/cli.js test --workers=3` | exit 0; **76/76**, Chrome instalado via `PLAYWRIGHT_CHANNEL=chrome`; servidor e Auth locais exclusivos de teste |
| `node node_modules/typescript/bin/tsc --noEmit` | exit 0; app, servidor, função, testes e runner `.mts` incluídos |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.sw.json` | exit 0 |
| `node node_modules/eslint/bin/eslint.js .` | exit 0 |
| `node node_modules/vite/bin/vite.js build` | exit 0; build final normal, sem configuração falsa do e2e |
| `node scripts/size-budget.mjs` | exit 0; **124,6 KB gzip**, limite 150 KB |
| `node scripts/check-private-content.mjs` | exit 0; materiais ausentes de `dist/` |
| `node scripts/check-secrets.mjs` | exit 0; nenhuma ocorrência |
| `node scripts/validate.mjs` | exit 0; duas áreas disponíveis conferidas |
| `node scripts/check-extract.mjs` | exit 0; módulos originais idênticos, fonte legada presente |
| comparação Buffer dos três JSONs privados com `git show HEAD:public/content/...` | todos byte a byte iguais ao HEAD |
| `git diff --check` | exit 0; sem erros de whitespace |
| `docker info --format '{{.ServerVersion}}'` | falhou: daemon Linux ausente, pipe dockerDesktopLinuxEngine inexistente |

A execução dos testes HTTP/navegador e Bash exigiu sair do sandbox. A execução
integral no sandbox teve restrições de socket/MSYS; não se alterou o código dos
testes para fazer essas restrições parecerem sucesso. A suíte completa passou
na execução autorizada. O jsdom emite avisos conhecidos de `scrollTo`/canvas;
os testes correspondentes de navegador renderizaram de verdade e passaram.
Vite/Workbox emitem avisos de chunks grandes de diagramas e de opção depreciada;
o limite obrigatório do JavaScript inicial passou.

## Achados da revisão independente

Revisor independente somente leitura, com inspeção do diff e reprodução mínima
da primeira falha. Não houve alterações de código pelo revisor.

| Achado | Severidade | Evidência/consequência | Correção e teste | Decisão |
|---|---|---|---|---|
| Reativação de sessão recusada por evento do SDK | P2 | `rejectSession` só limpava estado do app; reprodução `authenticated → anonymous → authenticated` sem login | limpar SDK, suprimir recuperação automática recusada e aceitar novo OTP explícito; teste novo RED→GREEN em content-auth | corrigido |
| Material anterior preservado na troca direta de conta | P2 | hooks conservavam manifesto/currículo React depois da limpeza do serviço | remount do Outlet por identidade; teste UI A→B RED→GREEN | corrigido |

Nenhum achado menor adiado. A guarda React atende à navegação; a autorização
para download continua sempre no servidor. Não foram criados bypass de teste
no produto, chaves privilegiadas, migrations ou mudanças nas regras de mescla.

## Contratos e riscos

C01 respeitado: bearer no cabeçalho, validação remota antes da leitura, usuário
não anônimo, lista permitida, erros sem material/detalhes e respostas no-store.
C02 respeitado: restauração explícita, login isolado, token fora do store e do
snapshot React, invalidação de conteúdo/respostas em trânsito e remount por
identidade. O progresso local permanece no formato anterior.

Nenhuma dependência foi adicionada; nova decisão arquitetural no ADR-0012.
Persistência/RLS do progresso não mudou. Não há migration, operação destrutiva
ou alteração externa nessa entrega local. O conteúdo exige conexão por decisão
confirmada do solicitante.

## Lacunas declaradas

1. **Banco:** `bash tests/db/run.sh` não executado porque o daemon Docker está
   indisponível. Nenhuma migration/tabela/RLS foi alterada. Reexecutar quando
   o ambiente Docker estiver disponível; não se iniciou serviço automaticamente.
2. **Vercel:** configuração `includeFiles` e Web Handler seguem a documentação
   oficial; CLI/pacote específico e HTTP publicado não foram executados. O e2e
   valida o mesmo handler no preview, sem equivaler a um deploy Vercel.
3. **Canais anteriores:** a visibilidade atual do GitHub e os deploys antigos
   não foram confirmados. Documentação anterior descreve repositório público;
   esses canais devem ser auditados e, se necessário, fechados com confirmação.
4. **Cópias existentes:** não há promessa de recolher materiais já baixados ou
   conteúdos de uma versão antiga que ainda não recebeu a atualização.

Responsável pelo fechamento: entrega com o solicitante para autorizar publicação
e mudanças externas. A implementação local está concluída; a proteção do site
em produção só pode ser declarada depois desses passos.
