// Endereços do site antigo (rotas por hash) → rotas limpas do portal (KR2).
//
//   #/                → /atlas
//   #/{área}          → /atlas/{área}
//   #/{área}/{id}     → /atlas/{área}/{id}
//   #inicio, #{id}    → arquivo original de política (só tinha essa área)
//
// Função pura: nunca lança exceção; hash vazio não redireciona.

/** Área do arquivo original (antes do multiárea). */
export const LEGACY_AREA = "politica";

const LEGACY_ID = /^m\d+(e\d+|of)$/;
const AREA = /^[a-z0-9-]+$/;
const ID = /^[A-Za-z0-9_-]+$/;

export function legacyToPath(hash: string): string | null {
  let h = String(hash || "");
  if (h.startsWith("#")) h = h.slice(1);
  if (!h) return null;
  try { h = decodeURIComponent(h); } catch { return "/atlas"; }
  if (!h.startsWith("/")) {
    if (h === "inicio") return "/atlas/" + LEGACY_AREA;
    if (LEGACY_ID.test(h)) return "/atlas/" + LEGACY_AREA + "/" + h;
    return "/atlas";
  }
  const parts = h.split("/").filter(Boolean);
  const [area, id] = parts;
  if (parts.length === 0 || !area) return "/atlas";
  if (!AREA.test(area)) return "/atlas";
  if (parts.length === 1) return "/atlas/" + area;
  if (parts.length === 2 && id && ID.test(id)) return "/atlas/" + area + "/" + id;
  return "/atlas";
}
