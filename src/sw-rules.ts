// Regras de cache do service worker (contrato KW1), separadas para teste.
//
//   app-shell → navegação: index.html do precache (rotas limpas offline)
//   rede      → /api/*, /content/* e /private/*: nunca guardar materiais
//   diagramas → /assets/diagramas/*: cache primeiro, guardado no primeiro uso
//   precache  → arquivos do build (com hash), servidos pelo precache
//   rede      → qualquer outro domínio (Supabase incluído): nunca em cache

export type CacheRule = "app-shell" | "diagramas" | "precache" | "rede";

/** Caches de versões anteriores, apagados na ativação. */
export const OLD_CACHES = ["atlas-v1", "atlas-conteudo"];

export const DIAGRAM_CACHE = "atlas-diagramas";

export function cacheRule(url: URL, mode: RequestMode, origin: string): CacheRule {
  if (url.origin !== origin) return "rede";
  if (/^\/(api|content|private)(\/|$)/.test(url.pathname)) return "rede";
  if (mode === "navigate") return "app-shell";
  // Mermaid e dependências: fora do precache (pesado); guardados no primeiro uso.
  if (url.pathname.startsWith("/assets/diagramas/")) return "diagramas";
  return "precache";
}
