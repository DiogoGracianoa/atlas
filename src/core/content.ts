// Manifesto de áreas, carga sob demanda dos currículos e índice por área.
// O ID canônico de um item é "area/id" (ex.: "politica/m1e1"); o currículo
// mantém os IDs curtos.
import type { AreaIndex, AreaMeta, Curriculum, ItemNode, Manifest, MarkInfo, StepNode, WorkshopNode } from "./types";

export type FetchJSON = (url: string) => Promise<unknown>;

export interface ContentApi {
  loadManifest(): Promise<Manifest>;
  /** Áreas de topo do manifesto (agrupadores incluídos). */
  areas(): AreaMeta[];
  /** Áreas e subtemas que podem ter currículo (sem os agrupadores). */
  leaves(): AreaMeta[];
  /** Área de topo ou subtema, pelo slug (único no manifesto). */
  area(slug: string): AreaMeta | null;
  /** Agrupador de um subtema; null para área de topo. */
  parentOf(slug: string): AreaMeta | null;
  isGroup(slug: string): boolean;
  isAvailable(slug: string): boolean;
  loadArea(slug: string): Promise<AreaIndex>;
  isLoaded(slug: string): boolean;
}

export function createContent({ fetchJSON, manifestUrl = "content/areas.json" }: { fetchJSON: FetchJSON; manifestUrl?: string }): ContentApi {
  let manifest: Manifest | null = null;
  const cache = new Map<string, Promise<AreaIndex>>();
  const done = new Set<string>();

  async function loadManifest(): Promise<Manifest> {
    if (!manifest) {
      const m = (await fetchJSON(manifestUrl)) as { areas?: unknown } | null;
      const list: unknown[] = m && Array.isArray(m.areas) ? m.areas : [];
      manifest = { areas: list.filter((a): a is AreaMeta => !!a && typeof (a as AreaMeta).slug === "string") };
    }
    return manifest;
  }
  const areas = () => (manifest ? manifest.areas : []);
  const isGroupMeta = (a: AreaMeta) => Array.isArray(a.subtemas) && a.subtemas.length > 0;
  const leaves = () => areas().flatMap(a => (isGroupMeta(a) ? a.subtemas ?? [] : [a]));
  const area = (slug: string) => areas().find(a => a.slug === slug) || leaves().find(a => a.slug === slug) || null;
  const parentOf = (slug: string) => areas().find(a => isGroupMeta(a) && (a.subtemas ?? []).some(s => s.slug === slug)) || null;
  const isGroup = (slug: string) => { const a = area(slug); return !!a && isGroupMeta(a); };
  const isAvailable = (slug: string) => {
    const a = area(slug);
    return !!(a && !isGroupMeta(a) && a.status === "disponivel" && a.arquivo);
  };

  function loadArea(slug: string): Promise<AreaIndex> {
    if (!isAvailable(slug)) return Promise.reject(new Error("Área indisponível: " + slug));
    let p = cache.get(slug);
    if (!p) {
      const meta = area(slug) as AreaMeta;
      p = fetchJSON(meta.arquivo as string).then(data => {
        const a = indexArea(meta, data as Curriculum);
        done.add(slug);
        return a;
      });
      p.catch(() => cache.delete(slug));
      cache.set(slug, p);
    }
    return p;
  }

  return { loadManifest, areas, leaves, area, parentOf, isGroup, isAvailable, loadArea, isLoaded: (slug) => done.has(slug) };
}

export function marksOf(n: ItemNode): MarkInfo[] {
  if (n.kind === "workshop") return [{ k: "do", label: "Fazer a oficina" }];
  const out: MarkInfo[] = [{ k: "def", label: "Ler a definição" }];
  if (n.videos && n.videos.length) out.push({ k: "vid", label: "Assistir ao vídeo" });
  if (n.book) out.push({ k: "book", label: "Ler o livro" });
  return out;
}

export function indexArea(meta: AreaMeta, data: Curriculum): AreaIndex {
  const slug = meta.slug;
  const nodes: ItemNode[] = [];
  // Sem protótipo: "constructor", "__proto__" etc. não viram itens (achado 5 da revisão).
  const byId: Record<string, ItemNode> = Object.create(null) as Record<string, ItemNode>;
  const byKey: Record<string, ItemNode> = Object.create(null) as Record<string, ItemNode>;
  const add = (n: ItemNode) => { nodes.push(n); byId[n.id] = n; byKey[n.key] = n; };
  data.modules.forEach(m => {
    m.steps.forEach(s => add({ ...s, kind: "step", mod: m, area: slug, key: slug + "/" + s.id } satisfies StepNode));
    add({ ...m.workshop, kind: "workshop", mod: m, area: slug, key: slug + "/" + m.workshop.id } satisfies WorkshopNode);
  });
  const allMarks: string[] = [];
  nodes.forEach(n => marksOf(n).forEach(mk => allMarks.push(n.key + ":" + mk.k)));
  const steps = nodes.filter((n): n is StepNode => n.kind === "step");
  const stats = {
    modulos: data.modules.length,
    temas: steps.length,
    livros: steps.filter(n => n.book).length,
    videos: steps.reduce((a, n) => a + (n.videos?.length || 0), 0),
  };
  return { slug, meta, data, nodes, byId, byKey, marksOf, allMarks, stats };
}

// Progresso de uma área a partir das marcações locais. `total` vem do cache
// local (gravado na primeira abertura da área); sem ele, só a contagem.
export function areaProgress(slug: string, marks: Record<string, { done: boolean }> | null | undefined, total: number | null | undefined) {
  const prefix = slug + "/";
  let done = 0;
  for (const [k, v] of Object.entries(marks || {})) if (k.startsWith(prefix) && v && v.done) done++;
  if (!total) return { done, total: null, pct: null };
  return { done, total, pct: Math.round(100 * Math.min(done, total) / total) };
}
