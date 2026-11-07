# Contratos

## C01 — Atlas ↔ Supabase Auth (SDK existente)

- Operações: entrada com e-mail e senha (`signInWithPassword`); atualização da senha da conta autenticada (`updateUser`); código existente permanece.
- Entrada: e-mail e senha no login; nova senha na atualização, com confirmação validada na interface. Saída: sessão reconhecida ou resultado de atualização; erros tratados sem expor credenciais nem revelar existência da conta.
- Invariantes: somente conta existente entra; atualização exige sessão própria; não gravar senha em armazenamento, logs ou analytics. Auth é dono da autenticação, autorização e política de senha.
- Falhas: credenciais inválidas, indisponibilidade, senha rejeitada e exigência de autenticação recente não produzem sucesso. Orientar nova entrada por código quando necessário.
- Compatibilidade: preservar entrada por código/link, estado de sessão, conteúdo protegido e sincronização. Não há alteração de schema local. A atualização muda credencial e não deve ser repetida automaticamente; login não cria conta.
- Versão: fronteira do `@supabase/supabase-js` já instalado; dono da integração: Atlas; políticas remotas: operador do projeto Supabase.
