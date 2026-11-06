# Impacto

- **Mudam:**
  - `src/core/{types,content}.ts`;
  - `src/sections/atlas/*`;
  - `scripts/validate.mjs`;
  - `public/content/areas.json`;
  - o novo `public/content/arquitetura-lideranca-tecnica/curriculum.json`;
  - `docs/conteudo.md`;
  - testes.
- **Só validam:**
  - a sincronização e o banco: as chaves continuam com duas partes;
  - o conteúdo de política: SHA dos módulos originais via `check-extract`;
  - o service worker: o conteúdo continua fora do precache.
- **Fora do repositório:** nada.
