# Tarefas — Acesso obrigatório por login

Estado: previstas, não executadas. Para cada linha: RED observado antes da
alteração mínima; GREEN específico antes de seguir. Refatorar somente mantendo
os contratos C01/C02 e integridade dos materiais.

| Ordem | Cenários | Arquivos prováveis | Teste a escrever primeiro (RED) | Alteração mínima (GREEN) e efeito | Condição de término |
|---|---|---|---|---|---|
| T01 | S05–S07, S12, S17 | `server/conteudo.ts`, `api/conteudo.ts`, `tests/server/conteudo.test.ts`, `vite.config.ts`, `tsconfig.json` | HTTP sem token/inválido/erro não lê arquivo; válido lê; traversal/método recusados; headers no-store | handler injetável; validar Auth antes de allowlist/leitura; incluir novos testes no runner | todos os casos verdes; erros sem segredos |
| T02 | S06, S08, S09 | `public/content/` → `private/content/`, `vercel.json`, `.vercelignore`, scripts e leitores de fixtures | teste de artefato e integridade falha com JSON ainda público | mover sem editar textos; incluir somente no pacote da função; excluir API da SPA; adaptar leitores | integridade/validate verdes; nenhuma cópia pública; pacote servidor verificável |
| T03 | S01–S03, S13, S15 | `src/core/sync.ts`, `src/app/RequireAuth.tsx`, `routes.tsx`, `pages/Entrar.tsx`, Layout/cabeçalho | sessão pendente não monta página; anon redireciona; login isolado; código/link continuam | estado explícito; guarda antes da árvore protegida; manter fluxo existente | testes de navegação/autenticação verdes; sem flash ou loop |
| T04 | S04, S06, S14, S16 | `src/app/services.ts`, `src/core/content.ts`, testes content-auth e conta | bearer correto; 401 bloqueia; resposta tardia após logout/troca descartada; store preservado | fetch autenticado e invalidável; limpar memória sem apagar progresso | cenários verdes; sem reaparecimento de conteúdo |
| T05 | S10, S11 | `src/sw.ts`, `src/sw-rules.ts`, testes SW/offline | cache legado semeado; API/conteúdo jamais recuperados do cache | rede apenas, no-store e expurgo de cache conhecido | offline indica indisponibilidade; cache antigo removido |
| T06 | S02, S04, S08–S11, S18 local | `e2e/acesso.spec.ts`, demais e2e, `playwright.config.ts`, runner HTTP de teste | GETs reais contra o handler e build; UI anon/autenticada; nunca mockar a própria decisão de autorização | ligar runner ao mesmo handler; fixtures Auth exclusivas de testes; atualizar suites que pressupunham anonimato | e2e relevantes e inspeção do build/pacote verdes |
| T07 | todos | README, `docs/`, novo ADR, `.env.example`, CI e `revisao.md` | verificar documentação e comandos sincronizados com comportamento novo | documentar conexão, função, variáveis públicas e deploy; registrar evidência de testes | typecheck/lint/test/validate/build/size/secrets/e2e executados ou gaps declarados; revisão feita |
| T08 | S18 externo | roteiro de deploy/revisão; sem alteração externa automática | auditoria de URLs públicas, repositório e versões anteriores | preparar ações concretas e pedir confirmação antes de publicar/alterar sistemas | somente após confirmação: HTTP real sem vazamento; caso contrário entrega local com pendências claras |

Não usar fixture autenticada como bypass permanente: os cenários anônimos têm
de exercitar a guarda e o handler reais. Testes de domínio podem continuar
isolados da autenticação. Ajustar os testes que antes aprovavam uso anônimo,
sem remover cobertura de funcionalidades para usuários autenticados.

## Extensão 2026-11-06 — situação final

T01–T07 concluídas localmente, com evidências em `execucao.md` e `revisao.md`.
T08 permanece condicionada a confirmação para publicar e alterar canais externos.
Verificações finais: 412 testes Vitest e 76 Playwright passaram; tipos, lint,
build, tamanho, segredos, privacidade e integridade de conteúdo passaram.
Banco depende de Docker indisponível; pacote Vercel/produção aguardam etapa
externa. Não se marca T08 como executada por existirem testes locais verdes.
