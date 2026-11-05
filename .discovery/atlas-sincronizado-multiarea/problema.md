# Problema — Atlas sincronizado e multiárea

- **Persona:** o próprio autor, estudante autodirigido, leitor majoritariamente no celular e às vezes no PC.
- **Situação atual:** app de página única (`exemplos/atlas-de-estudos-política.html`) com progresso e anotações em `localStorage` (chave `atlas-estudos-v2`).
- **Dor observável:** o progresso fica preso a um navegador; ler no celular e continuar no PC exige exportar/importar JSON manualmente.
- **Alternativa atual:** botões Exportar/Importar.
- **Restrições:** sem framework nem build; Vercel estático; Supabase free; iOS Safari e Chrome Android; chave `service_role` nunca no repositório; repositório público.
