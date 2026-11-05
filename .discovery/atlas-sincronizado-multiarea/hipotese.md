# Hipótese

Acreditamos que sincronizar marcações e anotações por linha via Supabase, com
escrita local primeiro e fila offline, para o autor que alterna celular e PC,
eliminará a exportação manual sem perder dados.

Saberemos quando:

- uma marcação feita no celular aparece no PC na próxima abertura (ou retorno ao app);
- edições intercaladas em dois aparelhos na mesma sessão não se perdem;
- com o aparelho em modo avião o app abre, navega e aceita marcações, e tudo sobe ao reconectar;
- o uso de Exportar/Importar deixa de ser necessário para continuar a leitura.

Maior risco: conflito de escrita entre aparelhos (fila offline antiga sobrescrevendo dado novo).
