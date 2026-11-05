# Decisão: **Construir**

Data: 2026-11-05

**Motivo:** o autor declarou que vai crescer o portal, com uma seção de dossiês,
e quer o projeto no portfólio. A base atual concentra a interface num único
arquivo de renderização manual, o que torna cada seção nova cara e arriscada.
O núcleo já testado reduz o risco da migração.

**Alternativas consideradas:**

| Alternativa | Por que não |
|---|---|
| Dividir `app.js` em módulos sem framework | Resolve a organização, mas mantém a renderização manual e não atende o objetivo de portfólio declarado pelo autor. |
| Preact + htm por CDN, sem build | Mantém o site sem build, mas é uma escolha de nicho, sem TypeScript real e com ferramentas de teste mais fracas. |
| Next.js | SSR e funções não são necessários. Acrescenta complexidade e acoplamento à Vercel sem benefício para um site estático offline-first. |

**Escolha:** React com TypeScript sobre Vite, como site estático.

**Decisões do autor (2026-11-05):**

- TypeScript.
- README em inglês; documentação detalhada e especificações em português.
- Rotas limpas com prefixo de seção (`/atlas/...`, depois `/dossies/...`), com
  os links antigos redirecionados.
- Liberdade para redesenhar a interface.

**Fora deste ciclo:** a seção de dossiês em si (conteúdo, formato e telas). Ela
terá especificação própria; aqui entra apenas a estrutura de portal que a
comporta.
