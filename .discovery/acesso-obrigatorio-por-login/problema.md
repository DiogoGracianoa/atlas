# Acesso obrigatório por login

Data: 2026-11-06.

## Necessidade recebida

“Se não tiver logado, não consegue acessar e é redirecionado pra tela de login.”

## Problema e público

O responsável pelo Atlas quer condicionar o acesso ao sistema à autenticação.
Hoje visitantes navegam sem sessão; `/entrar` oferece o login existente.
Evidências: `src/app/routes.tsx`, `src/app/pages/Entrar.tsx` e
`especificacoes/portal-react/visao.md`, extensão de 2026-11-05 (RN18).

## Fronteira a esclarecer

O conteúdo de estudo está em `public/content/`, servido como arquivo estático.
Bloquear navegação no navegador não impede baixar esses arquivos diretamente.
A pessoa perguntou quais são esses arquivos; foi explicado que contêm os textos,
conceitos, oficinas e referências exibidos nas telas. Ainda falta decidir se
esses materiais também precisam de privacidade.

## Extensão 2026-11-06 — esclarecimento recebido

Os materiais também devem ficar privados. O solicitante aceitou exigir conexão,
sem guardar os materiais para leitura offline. A incerteza inicial foi resolvida;
resta verificar os canais externos de distribuição antes de declarar privacidade
em produção.
