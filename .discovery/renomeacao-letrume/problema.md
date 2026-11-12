# Problema: o portal mudou de nome

O autor comprou o domínio `letrume.com.br` e definiu que o portal passa a se
chamar **Letrume** (pedido de 2026-11-11). Hoje o nome "Atlas" aparece em
todas as superfícies visíveis:

- título da aba (`index.html`);
- marca do cabeçalho e título da tela inicial (`src/app/Layout.tsx`, `src/app/pages/Portal.tsx`);
- nome do app instalado (PWA, `vite.config.ts`: "Atlas · Portal de estudos" / "Atlas");
- ícone (globo, `public/icon.svg` e `public/icons/*`);
- cabeçalho do backup (`src/core/backup.ts`: `app: "Atlas de Estudos"`);
- textos da seção de estudos ("Atlas de estudos", "Mapa do Atlas");
- e-mails de autenticação e documentação de deploy (`docs/deploy.md`).

O site é servido hoje por um endereço da Vercel. Trocar de endereço muda a
origem do navegador: sessão, progresso local e fila de envio pendente ficam
presos à origem antiga se a transição não for tratada.
