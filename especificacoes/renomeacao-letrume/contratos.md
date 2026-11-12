# Contratos: renomeação para Letrume

## KB3 — arquivo de backup (v3, revisão 2026-11-11)

- **Operação:** exportar / importar arquivo JSON.
- **Entrada da importação:** `{ app: string, version: 2 | 3, ... }` como hoje.
- **Saída da exportação:** `{ app: "Letrume", version: 3, exportedAt, marks, notes, lastAt }`.
- **Invariantes:** `app` é informativo e não participa da validação; a
  estrutura v3 não muda.
- **Compatibilidade:** arquivos com `app: "Atlas de Estudos"` (v2 e v3)
  continuam importáveis; uma versão anterior do portal que receba um backup
  "Letrume" também o importa, pois não valida `app`.
- **Erros:** os mesmos de hoje (JSON inválido, versão desconhecida).
- **Dono:** núcleo (`src/core/backup.ts`).

## KO1 — origem canônica (novo)

- **Entrada:** `VITE_ORIGEM_CANONICA` (URL de origem, ex.:
  `https://letrume.com.br`), lida no build; vazia desativa.
- **Comportamento:** depois de cada ciclo de sincronização ocioso, se
  `location.origin !== canônica`, online e fila vazia →
  `location.replace(canônica + pathname + search + hash)`.
- **Invariantes:** nunca redireciona com fila não vazia, offline ou na própria
  origem canônica; idempotente (repetir não muda o resultado).
- **Erros:** falha de envio mantém o usuário na origem atual.
- **Compatibilidade:** sem a variável, comportamento idêntico ao atual.
- **Dono:** núcleo de sincronização.
