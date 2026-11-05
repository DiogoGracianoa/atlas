// Regras de cache do service worker (contrato KW1), separadas para teste.
//
//   app-shell → navegação: index.html do precache (rotas limpas offline)
//   conteudo  → /content/*: rede primeiro (3 s), cache de reserva; só entra
//               no cache o que foi aberto
//   precache  → arquivos do build (com hash), servidos pelo precache
//   rede      → qualquer outro domínio (Supabase incluído): nunca em cache

export type CacheRule = "app-shell" | "conteudo" | "precache" | "rede";

/** Caches de versões anteriores, apagados na ativação. */
export const OLD_CACHES = ["atlas-v1"];

export const CONTENT_CACHE = "atlas-conteudo";

export function cacheRule(url: URL, mode: RequestMode, origin: string): CacheRule {
  if (url.origin !== origin) return "rede";
  if (mode === "navigate") return "app-shell";
  if (url.pathname.startsWith("/content/")) return "conteudo";
  return "precache";
}
