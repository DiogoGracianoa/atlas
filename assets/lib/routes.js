// Rotas por hash: "#/" (mapa), "#/area" (capa), "#/area/id" (tema/oficina).
// Rotas do arquivo antigo ("#inicio", "#m1e1") continuam abrindo: o arquivo
// antigo só tinha a área de política.
export const LEGACY_AREA = "politica";

const LEGACY_ID = /^m\d+(e\d+|of)$/;

export function parseRoute(hash) {
  let h = String(hash || "");
  if (h.startsWith("#")) h = h.slice(1);
  try { h = decodeURIComponent(h); } catch (e) { return { view: "mapa" }; }
  if (!h.startsWith("/")) {
    if (LEGACY_ID.test(h)) return { view: "item", area: LEGACY_AREA, id: h };
    return { view: "mapa" };
  }
  const parts = h.split("/").filter(Boolean);
  if (parts.length === 0) return { view: "mapa" };
  if (parts.length === 1) return { view: "area", area: parts[0] };
  if (parts.length === 2) return { view: "item", area: parts[0], id: parts[1] };
  return { view: "mapa" };
}

export function hrefFor(route) {
  if (!route || route.view === "mapa") return "#/";
  if (route.view === "area") return "#/" + encodeURIComponent(route.area);
  return "#/" + encodeURIComponent(route.area) + "/" + encodeURIComponent(route.id);
}

// "politica/m1e1" -> rota de item
export function routeForKey(key) {
  const i = String(key || "").indexOf("/");
  if (i <= 0) return { view: "mapa" };
  return { view: "item", area: key.slice(0, i), id: key.slice(i + 1) };
}
