# Análise: redirecionamento do e-mail Supabase

## Evidências

- A imagem apresentada mostra o navegador em `localhost:3000` após abrir o link de login; não mostra a configuração do Supabase nem a URL completa anterior.
- `src/core/sync.ts` em `requestCode` envia `emailRedirectTo` como a origem e o caminho da página em que o login é solicitado. Assim, uma solicitação feita no domínio de produção informa esse domínio ao Supabase.
- `docs/deploy.md`, seção 1, passo 5, prevê Site URL de produção e Redirect URLs permitindo os caminhos do site; a seção de diagnóstico associa o retorno a `localhost:3000` à configuração de URLs.
- Não foi observada pasta `.sdd/` na raiz. A documentação e o código existentes foram consultados para suprir o contexto necessário.

## Divergência e hipótese

O resultado desejado é voltar ao domínio de produção. A hipótese principal é que a Site URL esteja em localhost e/ou que a URL solicitada não conste da lista permitida. Os valores atuais do painel, o template ativo e a origem da solicitação não foram verificados; a causa exata permanece não confirmada.

## Impacto e limites

A configuração pertence ao Supabase Auth do projeto implantado. Não há evidência suficiente para alterar código. O domínio, protocolo e caminho usados na solicitação devem corresponder às URLs permitidas. Links anteriores precisam ser testados com cuidado: o teste confiável usa um link novo solicitado no domínio de produção.

## Riscos e questões

| Risco | Probabilidade | Impacto | Mitigação | Questão |
|---|---|---|---|---|
| URL ou projeto Supabase incorreto | Não determinada | Login continua falhando | Verificar o projeto implantado, Site URL, lista de redirecionamento e template; testar novo link | Quais valores estão configurados no painel? |
| Template personalizado ignora o destino solicitado | Não determinada | Retorno incorreto | Conferir o link do template Magic Link | O template usa `{{ .ConfirmationURL }}`? |
