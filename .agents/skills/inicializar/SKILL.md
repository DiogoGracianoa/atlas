---
name: inicializar
description: Use quando um workspace novo precisa adotar o Núcleo SDD, inclusive quando contém projetos em projects/.
---

# Inicializar

Crie contexto SDD útil, específico e verificável. Não invente domínio, stack ou
comandos que não possa observar ou confirmar.

1. Inspecione a raiz, arquivos de configuração e documentação existente.
2. Crie `.sdd/` na raiz com `CONSTITUICAO.md`, `PROJETO.md`, `STACK.md`,
   `PLAYBOOK.md`, `memoria/DOMINIO.md` e `memoria/DECISOES.md`.
3. Se `projects/` existir, trate cada diretório imediato como projeto
   independente. Repita a estrutura `.sdd/` dentro dele, detectando sua stack
   e comandos próprios. Nunca copie stack, decisões ou domínio de outro
   projeto.
4. Registre no `PROJETO.md` da raiz as responsabilidades e integrações
   confirmadas entre projetos. Relações desconhecidas viram perguntas.
5. Para informação não detectável, faça perguntas curtas antes de fixá-la.

Use tabelas e listas curtas. `CONSTITUICAO.md` contém limites duradouros;
`STACK.md` contém apenas tecnologias e comandos observados; memórias preservam
fatos e decisões, não suposições.

Ao concluir, informe os contextos criados, os projetos encontrados e as
perguntas que ainda impedem um entendimento confiável.

## Gate de fundação

Entrevistar uma questão por vez: problema/usuários, entidades, resultado,
restrições, integrações, escala e perfil do time. Em seguida, apresente stack
detectada e peça correção. Derive princípios específicos e falsificáveis; para
cada risco, registre um controle verificável no `PLAYBOOK.md`. Não avance com
campo desconhecido preenchido por padrão. O resumo final lista arquivos,
hipóteses confirmadas e perguntas remanescentes.
