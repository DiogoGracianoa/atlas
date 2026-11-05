// Moldura do atlas: resolve a área da rota contra o manifesto (KR1), carrega
// o currículo sob demanda, injeta as cores de tradição e desenha o menu
// (lateral fixo no PC, gaveta no celular).
import { useState } from "react";
import { Outlet, useLocation, useOutletContext, useParams } from "react-router";
import type { AreaIndex, Manifest } from "../../core/types";
import { RedirectWithToast } from "../../app/RedirectWithToast";
import { useAppState } from "../../app/context";
import { Sheet } from "../../ui/Sheet";
import { useArea, useManifest } from "./data";
import { areaMarks, traditionCss } from "./model";
import { AtlasNav } from "./components/AtlasNav";
import s from "./Atlas.module.css";

export interface AtlasContext {
  manifest: Manifest;
  /** Área aberta (null no mapa). */
  area: AreaIndex | null;
}

export const useAtlas = () => useOutletContext<AtlasContext>();

function Carregando() {
  return <p className={s.loading} role="status">Carregando…</p>;
}

export function AtlasLayout() {
  const { area: slug } = useParams();
  const manifest = useManifest();
  const meta = manifest.status === "ready" && slug ? manifest.data.areas.find(a => a.slug === slug) ?? null : null;
  const available = !!(meta && meta.status === "disponivel" && meta.arquivo);
  const area = useArea(slug, available);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const state = useAppState();

  if (manifest.status === "loading") return <Carregando />;
  if (manifest.status === "error") {
    return <p className={s.loading} role="alert">Não foi possível carregar o atlas. Confira a conexão e tente de novo.</p>;
  }
  if (slug && !meta) return <RedirectWithToast to="/atlas" message="Área não encontrada." />;
  if (slug && !available) return <RedirectWithToast to="/atlas" message="Esta área ainda não está disponível." />;
  if (slug && area.status === "error") return <RedirectWithToast to="/atlas" message="Esta área precisa de conexão na primeira abertura." />;
  if (slug && area.status === "loading") return <Carregando />;

  const current = slug && area.status === "ready" ? area.data : null;
  const ctx: AtlasContext = { manifest: manifest.data, area: current };
  const prog = current ? areaMarks(current, state) : null;
  const pct = prog && prog.total ? Math.round((100 * prog.done) / prog.total) : null;

  return (
    <div className={s.shell}>
      {current && <style>{traditionCss(current.meta)}</style>}
      <aside className={s.sidebar} aria-label="Navegação do atlas">
        <AtlasNav ctx={ctx} />
      </aside>
      <div className={s.content}>
        <div className={s.bar}>
          <button type="button" className={s.menuButton} onClick={() => setMenuOpen(true)} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <span>{current ? current.meta.nome : "Mapa do Atlas"}</span>
          </button>
          {pct !== null && <span className={s.barPct} aria-label={`${pct}% da área concluída`}>{pct}%</span>}
        </div>
        {pct !== null && <div className={s.topline} aria-hidden="true"><i style={{ width: pct + "%" }} /></div>}
        <Outlet context={ctx} />
      </div>
      <Sheet open={menuOpen} side="left" title={current ? current.meta.nome : "Atlas de estudos"} onClose={() => setMenuOpen(false)}>
        <AtlasNav ctx={ctx} onNavigate={() => setMenuOpen(false)} key={location.pathname} />
      </Sheet>
    </div>
  );
}
