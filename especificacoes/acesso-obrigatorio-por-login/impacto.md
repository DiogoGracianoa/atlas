# Impacto — Acesso obrigatório por login

Repositório único; nenhum diretório `projects/`. Não foram presumidos outros
projetos ou gestores de trabalho.

| Alvo | Papel e mudança | Motivo | Dependência / ordem | Tipo |
|---|---|---|---|---|
| Atlas: `src/core/sync.ts`, `src/app/` | estado de sessão, guarda, login isolado e fetch autenticado | RN01–RN04/RN07/RN08 | contratos antes; guarda + API + integração | altera código |
| Atlas: conteúdo e scripts | mover os JSONs para `private/content/`; ajustar leitores e validação | RN05 e integridade | preservar formato e bytes; antes do build final | altera localização/código, não texto |
| Atlas: `api/`, `server/`, `vercel.json` | função com validação Auth, allowlist e no-store | RN04/RN05/RN07 | handler testado antes de ligar cliente | código/configuração novos |
| Atlas: `src/sw*`, Vite e e2e | remover cache de conteúdo; limpar legado; runner do handler no e2e | RN06 | depois do contrato HTTP | altera código/configuração |
| Atlas: testes, docs, CI | migrar cenários anônimos; documentar conexão e backend; incluir novos testes | todos | validação de ponta a ponta ao final | altera testes/docs |
| Supabase: Auth e tabelas existentes | usar Auth existente, verificar RLS de dados pessoais | reusar política atual de contas; sem schema novo | integração real após confirmação de publicação | somente valida; sem migration prevista |
| Vercel publicada | funções/env, domínios e deploys anteriores | publicação da proteção | confirmação específica após revisão local | externo, não alterado neste plano |
| GitHub e histórico de distribuição | confirmar visibilidade; decidir fechamento se público | arquivos versionados podem ter outro canal | auditoria antes da declaração global; confirmação separada | validação; mudança externa condicionada |

Sem mudança de formato v3, IDs, regras de mescla ou textos. Impacto funcional
confirmado: acesso anônimo e leitura offline deixam de existir. O shell de login
continua público. Cópias já baixadas não podem ser recolhidas por essa mudança.
