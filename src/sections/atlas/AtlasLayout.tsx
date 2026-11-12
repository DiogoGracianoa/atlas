// Moldura do atlas: resolve a rota contra o manifesto (KR1 v1.2), carrega o
// currículo da folha (área ou subtema) sob demanda, injeta as cores de
// tradição e desenha o menu (lateral fixo no PC, gaveta no celular).
//
//   /atlas/:a            área simples → capa · agrupador → lista de subtemas
//   /atlas/:a/:b         área simples → item b · agrupador → capa do subtema b
//   /atlas/:a/:b/:c      agrupador → item c do subtema b
import { useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useOutletContext, useParams } from "react-router";
import type { AreaIndex, AreaMeta, Manifest } from "../../core/types";
import { RedirectWithToast } from "../../app/RedirectWithToast";
import { useAppState } from "../../app/context";
import { Sheet } from "../../ui/Sheet";
import { useArea, useManifest } from "./data";
import { areaMarks, traditionCss } from "./model";
import { createPaths, type Paths } from "./paths";
import { AtlasNav } from "./components/AtlasNav";
import { RoteiroImpresso, usePrint } from "./print/RoteiroImpresso";
import s from "./Atlas.module.css";

export type AtlasView = "mapa" | "grupo" | "capa" | "item" | "concurso";

export interface AtlasContext {
  manifest: Manifest;
  /** Folha aberta (área simples ou subtema); null no mapa e no agrupador. */
  area: AreaIndex | null;
  /** Agrupador da rota (página do agrupador ou subtema aberto), ou null. */
  group: AreaMeta | null;
  /** ID curto do item aberto, se houver. */
  itemId: string | null;
  /** Concurso (K-C1): slug, página e id da rota /atlas/{grupo}/{concurso}/{página}/{id}. */
  concurso?: { slug: string; pagina: string | null; id: string | null };
  view: AtlasView;
  paths: Paths;
}

export const useAtlas = () => useOutletContext<AtlasContext>();

const available = (m: AreaMeta | undefined | null) => !!(m && m.status === "disponivel" && m.arquivo && !m.subtemas?.length);

type Resolved =
  | { kind: "ok"; view: AtlasView; leaf?: string; group: AreaMeta | null; itemId: string | null; concurso?: AtlasContext["concurso"] }
  | { kind: "redirect"; to: string; message?: string };

function resolve(manifest: Manifest | null, a?: string, b?: string, c?: string, d?: string): Resolved {
  if (!a) return { kind: "ok", view: "mapa", group: null, itemId: null };
  const top = manifest?.areas.find(x => x.slug === a);
  if (!manifest) return { kind: "ok", view: "mapa", group: null, itemId: null };
  // Planejado se comporta como inexistente: o site só mostra o que existe.
  const visivel = top && (top.subtemas?.length ? top.status === "disponivel" && top.subtemas.some(available) : available(top));
  if (!top || !visivel) return { kind: "redirect", to: "/atlas", message: "Área não encontrada." };
  if (top.subtemas?.length) {
    if (!b) return { kind: "ok", view: "grupo", group: top, itemId: null };
    const sub = top.subtemas.find(x => x.slug === b);
    if (!sub || !available(sub)) return { kind: "redirect", to: "/atlas/" + a, message: "Subtema não encontrado." };
    if (sub.tipo === "concurso") return { kind: "ok", view: "concurso", group: top, itemId: null, concurso: { slug: sub.slug, pagina: c ?? null, id: d ?? null } };
    if (d) return { kind: "redirect", to: "/atlas/" + a + "/" + b };
    return { kind: "ok", view: c ? "item" : "capa", leaf: b, group: top, itemId: c ?? null };
  }
  if (c || d) return { kind: "redirect", to: "/atlas/" + a };
  return { kind: "ok", view: b ? "item" : "capa", leaf: a, group: null, itemId: b ?? null };
}

function Carregando() {
  return <p className={s.loading} role="status">Carregando…</p>;
}

export function AtlasLayout() {
  const { area: a, b, c, d } = useParams();
  const manifest = useManifest();
  const data = manifest.status === "ready" ? manifest.data : null;
  const r = resolve(data, a, b, c, d);
  const leaf = r.kind === "ok" ? r.leaf : undefined;
  const area = useArea(leaf, !!leaf);
  const paths = useMemo(() => createPaths(data), [data]);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const state = useAppState();
  const current = leaf && area.status === "ready" ? area.data : null;
  const { printing, print } = usePrint(current);

  if (manifest.status === "loading") return <Carregando />;
  if (manifest.status === "error") {
    return <p className={s.loading} role="alert">Não foi possível carregar o atlas. Confira a conexão e tente de novo.</p>;
  }
  if (r.kind === "redirect") {
    return r.message ? <RedirectWithToast to={r.to} message={r.message} /> : <Navigate to={r.to} replace />;
  }
  const backTo = r.group ? "/atlas/" + r.group.slug : "/atlas";
  if (leaf && area.status === "error") return <RedirectWithToast to={backTo} message="Esta área precisa de conexão na primeira abertura." />;
  if (leaf && area.status === "loading") return <Carregando />;

  const ctx: AtlasContext = { manifest: manifest.data, area: current, group: r.group, itemId: r.itemId, view: r.view, paths, concurso: r.concurso };
  // Concurso: telas próprias, sem o menu de módulos do atlas.
  if (r.view === "concurso") {
    return (
      <div className={s.concursoShell}>
        <style>{manifest.data.areas.flatMap(x => (x.subtemas?.length ? x.subtemas : [x])).map(traditionCss).join("\n")}</style>
        <Outlet context={ctx} />
      </div>
    );
  }
  const prog = current ? areaMarks(current, state) : null;
  const pct = prog && prog.total ? Math.round((100 * prog.done) / prog.total) : null;
  const title = current ? current.meta.nome : r.group ? r.group.nome : "Mapa do Atlas";

  return (
    <div className={s.shell}>
      {/* cores de todas as folhas: o mapa e os agrupadores também usam */}
      <style>{manifest.data.areas.flatMap(x => (x.subtemas?.length ? x.subtemas : [x])).map(traditionCss).join("\n")}</style>
      <aside className={s.sidebar} aria-label="Navegação do atlas">
        <AtlasNav ctx={ctx} onPrint={print} />
      </aside>
      <div className={s.content}>
        <div className={s.bar}>
          <button type="button" className={s.menuButton} onClick={() => setMenuOpen(true)} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <span>{title}</span>
          </button>
          {pct !== null && <span className={s.barPct} aria-label={`${pct}% da área concluída`}>{pct}%</span>}
        </div>
        {pct !== null && <div className={s.topline} aria-hidden="true"><i style={{ width: pct + "%" }} /></div>}
        <Outlet context={ctx} />
      </div>
      <Sheet open={menuOpen} side="left" title={current ? current.meta.nome : r.group ? r.group.nome : "Atlas de estudos"} onClose={() => setMenuOpen(false)}>
        <AtlasNav ctx={ctx} onNavigate={() => setMenuOpen(false)} onPrint={print} key={location.pathname} />
      </Sheet>
      {printing && <RoteiroImpresso a={printing} />}
    </div>
  );
}
