# Tarefas

1. **S01–S02:** em `tests/core/sync-auth.test.ts` escrever testes de autenticação por senha, erros genéricos e indisponibilidade; executá-los vermelhos. Adaptar `src/core/sync.ts` e fakes necessários; executar verdes. Termina com sessão e erros verificados sem registrar senhas.
2. **S03–S04:** em `tests/ui/conta.test.tsx` testar formulário padrão e opção por código, preservando código e link; executar vermelho. Adaptar `src/app/conta.tsx` e estilos; executar verde. Termina com navegação acessível e regressões passando.
3. **S05–S06, S08–S09:** escrever testes de alteração autenticada, confirmação divergente, rejeição, ausência de sessão e autenticação recente; executar vermelho. Implementar adaptação em `src/core/sync.ts` e formulário em `src/app/conta.tsx`, atualizar fakes; executar verde. Termina sem armazenamento/log de senha e sem sucesso falso.
4. **S07, S10:** testar recuperação por código e login posterior, além de saída, guarda e link existentes, em testes de interface/integração e e2e conforme suporte. Corrigir apenas regressões e executar novamente. Termina com fluxo integrado verificável.
5. Atualizar `docs/deploy.md` com fluxo e condições do Supabase, executar validações do plano e registrar evidências para revisão. Termina com falhas e limites declarados.
