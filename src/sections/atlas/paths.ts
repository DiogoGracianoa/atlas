// Endereços do atlas a partir do manifesto (KR1 v1.2): área simples em
// /atlas/{área}; subtema em /atlas/{agrupador}/{subtema}. As chaves de
// progresso continuam {folha}/{id}, em que a folha é a área ou o subtema.
import type { Manifest } from "../../core/types";

export interface Paths {
  areaPath(slug: string): string;
  itemPath(key: string): string;
  /** Agrupador do subtema, ou null. */
  parentOf(slug: string): string | null;
}

export function createPaths(manifest: Manifest | null): Paths {
  const parent = new Map<string, string>();
  for (const a of manifest?.areas ?? []) for (const s of a.subtemas ?? []) parent.set(s.slug, a.slug);
  const areaPath = (slug: string) => {
    const p = parent.get(slug);
    return p ? `/atlas/${p}/${slug}` : `/atlas/${slug}`;
  };
  return {
    areaPath,
    itemPath: (key: string) => {
      const i = key.indexOf("/");
      return i > 0 ? `${areaPath(key.slice(0, i))}/${key.slice(i + 1)}` : "/atlas";
    },
    parentOf: (slug) => parent.get(slug) ?? null,
  };
}
