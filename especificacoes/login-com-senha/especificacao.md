# Especificação — login com senha

Cada cenário usa contas existentes e sessões do Supabase. Falhas não devem expor credenciais nem conceder sessão indevida.

| Cenário | Origem | Pré-condição e entrada | Ação | Resultado | Falha esperada | Nível |
|---|---|---|---|---|---|---|
| S01 | RN01, AC01, AC09 | conta autorizada; e-mail e senha corretos | enviar formulário padrão | sessão reconhecida e acesso ao Atlas, sem envio de e-mail | indisponibilidade informada | núcleo e interface |
| S02 | RN02, AC02 | e-mail ou senha incorretos | tentar entrar | permanece sem acesso | mensagem genérica sem identificar conta | núcleo e interface |
| S03 | RN03, AC03 | sessão ausente | abrir entrada | formulário de senha visível e opção de código abaixo | indisponibilidade comunicada | interface |
| S04 | RN03, AC04 | conta autorizada e código recebido | escolher código e validar | sessão reconhecida | código incorreto ou expirado recusado | núcleo e interface |
| S05 | RN04, AC05, RN07 | sessão autenticada; senha nova e confirmação | definir senha | sucesso e acesso posterior com nova senha | senha rejeitada ou confirmação diferente sem alteração | núcleo e interface |
| S06 | RN05, AC06, RN07 | sessão autenticada; nova senha | alterar senha | nova senha aceita no próximo acesso | falha informada sem sucesso falso | núcleo e interface |
| S07 | RN06, AC07 | senha esquecida; conta autorizada | entrar por código, definir senha | próxima entrada com nova senha | código ou alteração rejeitada mantém proteção | integração local / interface |
| S08 | RN07, AC08 | sem sessão | tentar atualizar senha | operação recusada | nenhum pedido de atualização autorizado | núcleo e interface |
| S09 | técnico | sessão inválida, serviço indisponível, ou política remota exige autenticação recente | tentar atualizar | erro claro e orientação para entrar novamente por código | sem segredo em mensagem/log; não afirmar sucesso | núcleo |
| S10 | técnico | fluxo atual por link/código e guarda | autenticar e sair | mantém comportamento e proteção de conteúdo existentes | falha não abre conteúdo | regressão |

## Cobertura

| RN | AC | Cenário → teste previsto |
|---|---|---|
| RN01 | AC01, AC09 | S01 → `tests/core/sync-auth.test.ts`, `tests/ui/conta.test.tsx` |
| RN02 | AC02 | S02 → mesmos testes |
| RN03 | AC03, AC04 | S03–S04 → `tests/ui/conta.test.tsx`, `tests/core/sync-auth.test.ts` |
| RN04 | AC05 | S05 → mesmos testes |
| RN05 | AC06 | S06 → mesmos testes |
| RN06 | AC07 | S07 → teste integrado local ou e2e |
| RN07 | AC08 | S08 → testes de núcleo/interface |

Gaps: configuração e execução reais do Supabase e deploy não foram verificadas; autenticação recente e política de senha dependem do projeto remoto.
