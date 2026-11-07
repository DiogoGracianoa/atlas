# Plano — login com senha

Estado: proposto, aguardando aprovação explícita para implementação. Base: visão e especificação desta pasta.

## Direção

Usar o Supabase Auth existente: `signInWithPassword` para entrada e `updateUser` para definir/alterar senha na sessão autenticada. Alternativa de serviço de senhas próprio introduziria uma segunda identidade e armazenamento sensível sem necessidade. Manter código/link e sessão, guarda e sincronização existentes. A senha é transmitida apenas ao Auth; não persistir nem registrar em logs.

`src/core/sync.ts` adapta os métodos e resultados; `src/app/conta.tsx` apresenta senha como padrão, mantém código como opção e oferece configuração de senha na conta autenticada. Atualizar testes e fakes existentes e documentação de operação. O Supabase valida sua própria política; tratar rejeição e eventual exigência de autenticação recente com orientação para entrar de novo. Não presumir que painel remoto esteja configurado. As APIs e as políticas são descritas em https://supabase.com/docs/guides/auth/passwords e https://supabase.com/docs/guides/auth/password-security.

## Ordem e validação

Executar tarefas de `tarefas.md` em ciclos teste vermelho → alteração mínima → verde. Após regressões, executar comandos disponíveis: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run privacy`, `npm run secrets` e `npm run e2e` quando ambiente permitir. Registrar saídas e lacunas, inclusive dependências de Supabase real e Vercel. O fluxo posterior exige revisão. Publicação e qualquer alteração no painel são ações externas que exigem confirmação própria.

## Riscos e limites

Credenciais erradas recebem mensagem genérica; não registrar dados sensíveis. A sessão do Supabase autoriza alterações; exigir recente autenticação pode impedir atualização em sessões antigas conforme configuração real. Informar o usuário e permitir nova entrada por código; não desabilitar proteção no painel. Rejeições de política de senha são informadas sem inventar os limites do servidor. Contas existentes permanecem as únicas permitidas. Não foram executados testes nem verificado o painel remoto nesta fase.
