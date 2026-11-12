# ADR-0015: Registros genéricos sincronizados

Status: aceita · Data: 2026-11-11.
Origem: [plano aprovado](../../especificacoes/preparatorio-concurso-contagem-2027/plano.md) (D4, D5, D8, D9).

## Contexto

O preparatório guarda estado do tópico, leitura, confiança, replanejamentos,
sessões, tentativas, caderno de erros, revisões, simulados e treinos da
discursiva. Tudo precisa funcionar offline, sincronizar entre aparelhos e
nunca se perder, como marcações e anotações.

## Alternativas

- **Uma tabela por tipo:** colunas tipadas, mas uma migration e mudanças na
  fila e na mescla a cada tipo novo.
- **Reaproveitar `progress`/`notes`:** os formatos não cabem (tentativa não é
  marcação booleana) e quebraria o contrato K3.
- **Uma tabela genérica `registros`** com corpo JSON e "vence o mais recente".

## Decisão

Tabela `registros (user_id, area, tipo, registro_id, corpo jsonb, updated_at)`,
PK `(user_id, tipo, registro_id)`, RLS "dono", o mesmo trigger da 0001 e corpo
de até 16 KB (migration 0002). No aparelho, chave própria
`atlas-registros-v1` (`src/core/registros.ts`), separada do `atlas-v3`, para
que uma aba com versão antiga não apague registros. Estados (tópico, revisão,
plano, erro) são linhas mutáveis; eventos (tentativa, sessão, replanejamento,
simulado, discursiva) têm id único e nunca são reescritos, então nunca
conflitam. "Zerar tudo" troca cada registro por uma marca de exclusão. O
backup passa à versão 4 com os registros. O simulado em andamento fica só no
aparelho até terminar.

## Consequências

- Tipo novo de registro não exige migration.
- Consultas no servidor por campo do corpo são limitadas (sem colunas tipadas).
- Registros excluídos continuam ocupando uma linha (marca de exclusão).
- A migration 0002 precisa ser aplicada no Supabase antes do deploy.

## Gatilho de revisão

Relatórios no servidor que precisem filtrar por campos do corpo, ou volume de
registros que torne o `select` completo lento: então tipar colunas ou paginar.
