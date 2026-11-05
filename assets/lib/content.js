// Manifesto de áreas, carga sob demanda dos currículos e índice por área.
// O ID canônico de um item é "area/id" (ex.: "politica/m1e1"); o currículo
// mantém os IDs curtos.

export function createContent({ fetchJSON, manifestUrl = "content/areas.json" }) {
  let manifest = null;
  const cache = new Map(); // slug -> Promise<Area>
  const done = new Set();

  async function loadManifest() {
    if (!manifest) {
      const m = await fetchJSON(manifestUrl);
      manifest = { areas: Array.isArray(m && m.areas) ? m.areas.filter(a => a && typeof a.slug === "string") : [] };
    }
    return manifest;
  }
  const areas = () => (manifest ? manifest.areas : []);
  const area = (slug) => areas().find(a => a.slug === slug) || null;
  const isAvailable = (slug) => {
    const a = area(slug);
    return !!(a && a.status === "disponivel" && a.arquivo);
  };

  function loadArea(slug) {
    if (!isAvailable(slug)) return Promise.reject(new Error("Área indisponível: " + slug));
    if (!cache.has(slug)) {
      const meta = area(slug);
      const p = fetchJSON(meta.arquivo).then(data => {
        const a = indexArea(meta, data);
        done.add(slug);
        return a;
      });
      p.catch(() => cache.delete(slug));
      cache.set(slug, p);
    }
    return cache.get(slug);
  }

  return { loadManifest, areas, area, isAvailable, loadArea, isLoaded: (slug) => done.has(slug) };
}

export function marksOf(n) {
  if (n.kind === "workshop") return [{ k: "do", label: "Fazer a oficina" }];
  const out = [{ k: "def", label: "Ler a definição" }];
  if (n.videos && n.videos.length) out.push({ k: "vid", label: "Assistir ao vídeo" });
  if (n.book) out.push({ k: "book", label: "Ler o livro" });
  return out;
}

export function indexArea(meta, data) {
  const slug = meta.slug;
  const nodes = [];
  const byId = {};
  const byKey = {};
  const add = (n, kind, mod) => {
    n.mod = mod; n.kind = kind; n.area = slug; n.key = slug + "/" + n.id;
    nodes.push(n); byId[n.id] = n; byKey[n.key] = n;
  };
  data.modules.forEach(m => {
    m.steps.forEach(s => add(s, "step", m));
    add(m.workshop, "workshop", m);
  });
  const allMarks = [];
  nodes.forEach(n => marksOf(n).forEach(mk => allMarks.push(n.key + ":" + mk.k)));
  const steps = nodes.filter(n => n.kind === "step");
  const stats = {
    modulos: data.modules.length,
    temas: steps.length,
    livros: steps.filter(n => n.book).length,
    videos: steps.reduce((a, n) => a + ((n.videos && n.videos.length) || 0), 0)
  };
  return { slug, meta, data, nodes, byId, byKey, marksOf, allMarks, stats };
}

// Progresso de uma área a partir das marcações locais. `total` vem do cache
// local (gravado na primeira abertura da área); sem ele, só a contagem.
export function areaProgress(slug, marks, total) {
  const prefix = slug + "/";
  let done = 0;
  for (const [k, v] of Object.entries(marks || {})) if (k.startsWith(prefix) && v && v.done) done++;
  if (!total) return { done, total: null, pct: null };
  return { done, total, pct: Math.round(100 * Math.min(done, total) / total) };
}
