# Revisão — login com senha

## Evidências por cenário

| Cenário | Teste e código | Resultado |
|---|---|---|
| S01–S02 | `tests/core/sync-auth.test.ts`, `tests/ui/conta.test.tsx`; `src/core/sync.ts`, `src/app/conta.tsx` | Entrada por senha e recusa testadas com Auth falso; sem verificação remota. |
| S03–S04 | `tests/ui/conta.test.tsx`, testes de código preexistentes | Formulário padrão e código mantidos; passaram localmente. |
| S05–S06 | `tests/core/sync-auth.test.ts`, `tests/ui/conta.test.tsx` | Atualização e divergência de confirmação testadas com Auth falso. |
| S07 | `tests/ui/conta.test.tsx` | Código, alteração, saída e entrada com nova senha passaram com Auth falso. |
| S08 | `tests/core/sync-auth.test.ts`; `AccountBody` | Chamada sem sessão recusada e interface de alteração somente no ramo autenticado. |
| S09 | `tests/core/sync-auth.test.ts` | Indisponibilidade e exigência de autenticação recente testadas no núcleo; políticas reais não verificadas. |
| S10 | testes de conta, guarda e conteúdo existentes | Testes de unidade/interface executados; navegador e ambiente real são lacunas até conclusão dos respectivos testes. |

## Verificações

- Vitest completo: 410 passaram, 7 falharam em `tests/scripts/keepalive.test.ts`; Bash do Git falhou ao iniciar por `NtCreateDirectoryObject` 0xC0000022 no ambiente. Na primeira tentativa, o alias do Windows também retornou `spawn bash EACCES`. Não há evidência de falha funcional no script, mas os sete casos não estão verificados.
- `tsc --noEmit` e `tsc --noEmit -p tsconfig.sw.json`: passaram.
- ESLint: passou. Build Vite/PWA: passou, com avisos de tamanho de chunks e opção depreciada.
- `scripts/check-secrets.mjs`, `scripts/check-private-content.mjs`, `scripts/size-budget.mjs` e `scripts/validate.mjs`: passaram.
- Auth real, políticas do painel, recuperação e publicação: não executados. Testes usam cliente falso e não demonstram configuração remota.

## Revisão de riscos

Senha trafega para o SDK e não é colocada em storage ou logs pela alteração. A atualização é disponibilizada apenas no ramo autenticado e o núcleo recusa ausência de sessão; Supabase é a autoridade para validar a sessão. A interface desabilita envios concorrentes enquanto aguarda. Não há mudança de banco ou dependência. Erros de credenciais são genéricos. A política de senha e autenticação recente são controladas pelo Supabase; a mensagem de rejeição orienta a nova tentativa ou entrada recente. Não houve avaliação real do painel nem teste com suas políticas específicas.

## Veredito

**Não aprovada para entrega de produção**: há verificações indisponíveis ou pendentes e a integração remota ainda não foi testada. Não houve publicação ou alteração externa. A implementação local e os testes descritos ficam disponíveis para continuidade.

## Complemento de validação — 2026-11-07

- Suíte Vitest completa repetida isoladamente com Git Bash disponível: **418 testes passaram**, 32 arquivos; as falhas anteriores eram tempos excedidos durante execução concorrente ou impedimento de execução do Bash.
- Playwright com Chrome instalado: **75 passaram e um teste de diagrama excedeu o tempo** durante execução concorrente com a suíte. O teste de `m4e2` foi repetido isoladamente e passou. Assim, todos os 76 casos passaram em pelo menos uma execução, mas a suíte de navegador completa não ficou verde em uma única execução.
- Fluxo novo de senha e recuperação foi verificado com Auth falso na interface; não há caso de navegador contra Supabase real. A política e opções do projeto Supabase, assim como o comportamento publicado, continuam pendentes.

O veredito para produção permanece pendente por essas lacunas; não foi feita alteração externa.
