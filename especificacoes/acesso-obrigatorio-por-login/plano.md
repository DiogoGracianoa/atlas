# Plano — Acesso obrigatório por login

Data: 2026-11-06. Estado: **pronto para aprovação de implementação local**.
Base: visão atual, análise, especificação, contratos, impacto e tarefas.

## Objetivo e solução proposta

Guardar os mesmos JSONs fora da árvore pública (`private/content/`) e servi-los
exclusivamente por uma função Node na Vercel. Antes de ler qualquer arquivo, o
handler valida o bearer no Supabase Auth com `getUser(token)`, usando somente a
URL e a chave pública já existentes. Não usar service_role nem novo banco.
No cliente, login separado e guarda comum protegem a árvore de portal/seções;
nenhum conteúdo ou ferramenta protegida monta antes da sessão reconhecida.

Conexão obrigatória e arquivos privados foram confirmados pelo solicitante.
Sucesso em `/entrar` mantém o destino atual `/atlas`; preservam-se código/link
e política de contas existentes. Sem configuração, não há mais modo público
local. O desenvolvimento usa a mesma validação com configuração real; mocks
existem somente em testes.

## Decisão arquitetural proposta

Contexto: o site atual não tem servidor próprio, mas usa Vercel e Supabase.
Alternativas e custos em `analise.md`: guarda isolada não protege download;
Storage privado adiciona publicação de conteúdo em outro serviço; função na
Vercel reaproveita o deploy e os JSONs. Escolha proposta: função Node e arquivos
no seu pacote privado. Consequências: validação Auth em cada leitura, execução
serverless e ausência de leitura offline. Rever diante de custo/latência de
Auth ou necessidade de gestão de conteúdo separada. Após aprovação, registrar
novo ADR, preservando os ADRs anteriores como histórico e indicando superação.

## Responsabilidades e arquivos prováveis

| Módulo | Responsabilidade | Contrato |
|---|---|---|
| `server/conteudo.ts`, `api/conteudo.ts` | handler testável + adaptação HTTP Vercel, allowlist de arquivos, erros e headers | C01 |
| `private/content/` | mesmos materiais; somente pacote servidor, fora de `dist` | C01 |
| `src/core/sync.ts` | distinguir inicialização/sessão/erro e obter token atual pelo SDK | C02 |
| `src/app/RequireAuth.tsx`, rotas/login/Layout | proteger portal e seções; login sem ferramentas de dados | C02 |
| `src/app/services.ts`, `src/core/content.ts` | fetch com bearer, tratamento 401/503, cache em memória invalidável por sessão | C01/C02 |
| `src/sw.ts`, `src/sw-rules.ts` | somente rede para API/conteúdo, expurgar cache legado | C01 |
| `vercel.json`, `.vercelignore`, `tsconfig.json`, `vite.config.ts` | empacotar arquivos privados na função; incluir tipos servidor; desviar API da SPA e usar handler real em dev/teste | C01 |
| scripts, harness, testes de docs/conteúdo | migrar raiz e autenticar fixtures explicitamente | invariantes de conteúdo |

A forma final de adaptar `Request/Response` ao runtime pode ser decidida na
implementação conforme o SDK/runtime observado, sem trocar o contrato C01.
Não instalar uma dependência apenas para tipar o adaptador se tipos nativos
forem suficientes. Nenhuma atualização de versões existente está prevista.

## Ordem e estratégia

1. Para cada cenário, escrever teste e observar falha antes do código mínimo.
2. Implementar handler autenticado testável, com Auth/filesystem injetáveis;
   validar recusa antes da leitura, erros, cache e traversal.
3. Mover conteúdo preservando bytes/formato; atualizar leitores e validações;
   empacotar no servidor e excluir de todos os artefatos públicos.
4. Modelar ciclo de sessão; separar login/guarda e preservar callbacks.
5. Integrar fetch autenticado; invalidar memória e respostas em trânsito ao
   sair/trocar usuário; 401 encerra exposição, 503 não vira logout arbitrário.
6. Retirar persistência de conteúdo e apagar o cache legado conhecido na
   ativação do SW; preservar store/fila pessoais.
7. Atualizar testes existentes com autenticação explícita; executar HTTP real
   em servidor de teste com o mesmo handler e frontend de produção. O Vite
   preview sozinho não testa API Vercel. Um provedor falso de Auth é exclusivo
   do processo de testes e nunca ativado por variável no produto publicado.
8. Documentar arquitetura/deploy e limitações; revisar pelo fluxo `$revisar`.
9. Só depois preparar publicação concreta, confirmar ações externas e executar
   verificações de produção. Este plano não autoriza publicar ou mudar GitHub.

## Validações observadas e pendentes

Node do PATH está com shim quebrado; executável funcional encontrado:
`C:/Users/dtiDigital/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`
(v24.22.1). O implementador pode colocá-lo à frente no PATH do processo ou usar
o caminho absoluto. Scripts existem em `package.json`; não é necessário instalar
Node para começar os testes locais.

| Verificação | Disponibilidade/evidência atual | Validação da mudança |
|---|---|---|
| `npm run typecheck` | ambos os comandos `tsc` executados pelo Node absoluto, exit 0 | repetir após código; incluir servidor/API no tsconfig |
| `npm run lint` | script e ESLint instalados | pendente |
| `npm test` | script e Vitest instalados; incluir `tests/server/**/*.test.ts` no runner | pendente; RED/GREEN por cenário e suíte |
| `npm run validate` | script local existente | pendente após mudança de raiz |
| `npm run check-extract` | depende de fonte em `exemplos/` | executar se fonte presente; declarar ausência |
| `npm run build`, `npm run size`, `npm run secrets` | scripts existentes | pendentes; inspecionar também privacidade do artefato |
| `npm run e2e` | runner existente; exige Chromium e runner HTTP com API | pendente; adaptar offline/rotas/layout |
| pacote Vercel | função nova não existe; CLI/autenticação não confirmadas | pendente; comprovar arquivos privados só no pacote servidor |
| `bash tests/db/run.sh` | depende de bash/Docker; banco sem alterações | verificar disponibilidade; lacuna explícita se não executável |
| HTTP em produção e canais anteriores | depende de publicação confirmada e acesso externo | S18 pendente; não declarar privacidade global antes disso |

Se npm continuar indisponível pelo shim, executar os binários JS instalados
com o Node absoluto; scripts Vite/Playwright que criam subprocessos precisam do
PATH corrigido no processo. Não confundir presença do script com execução verde.

## Gate de implementação

- Visão atual sem perguntas funcionais bloqueantes; decisões do solicitante
  preservadas por extensão datada.
- **8 RNs, 15 ACs, 18 cenários, 2 contratos**; matriz completa, testes futuros
  identificados e tarefas ordenadas. Nenhum gap de planejamento oculto.
- Impacto funcional declarado: sem acesso anônimo, sem materiais offline;
  progresso local e métodos de login preservados.
- Somente verificação basal de tipos executada; testes/segurança/build/e2e da
  mudança ainda não existem ou não foram executados.
- Lacunas de entrega: visibilidade do repositório, pacotes/publicações antigas,
  empacotamento Vercel e validação real. Fechamento externo exige confirmação.
- Aguardar **aprovação explícita deste plano** antes de `$implementar`.

## Extensão 2026-11-06 — execução autorizada e concluída localmente

O solicitante aprovou este plano com “pode seguir”. Implementação e revisão
local concluídas conforme `execucao.md` e `revisao.md`. Publicação e ações
externas não foram realizadas; suas verificações permanecem explícitas.
