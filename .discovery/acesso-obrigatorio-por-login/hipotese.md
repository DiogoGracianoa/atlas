# Hipótese — Acesso obrigatório por login

Acreditamos que exigir autenticação para acessar as telas do Atlas atende à
necessidade do responsável de impedir o uso do sistema sem login. Saberemos
quando todas as tentativas de abrir telas de conteúdo sem sessão terminarem na
tela de login, sem exibir a tela protegida, inclusive por link direto.

## Métrica e menor experimento

100% dos cenários de navegação anônima previstos devem terminar em `/entrar`;
uma sessão reconhecida deve continuar permitindo o acesso. Verificar também
saída da conta e restauração da sessão antes de apresentar conteúdo.

## Maior risco

Confundir bloqueio de telas com privacidade dos materiais. A proteção dos
arquivos estáticos depende da resposta funcional, antes de planejar a solução.
