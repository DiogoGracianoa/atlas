// Menu do atlas: seletor de área, busca (na área ou em todas), resumo da área,
// módulos com anel de progresso e temas em linha do tempo. Só aparece o que
// existe: áreas e subtemas planejados ficam de fora (extensão de 2026-11-06).
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAppState, useServices } from "../../../app/context";
import type { AreaIndex, AreaMeta, ItemNode, Module, State } from "../../../core/types";
import { areaProgress } from "../../../core/content";
import { ProgressRing } from "../../../ui/ProgressRing";
import type { AtlasContext } from "../AtlasLayout";
import { areaMarks, doneCount, leafColors, moduleProgress, searchModules, tradition } from "../model";
import type { Paths } from "../paths";
import { AreaPicker } from "./AreaPicker";
import { AtlasTools } from "./AtlasTools";
import s from "../Atlas.module.css";

const isGroup = (a: AreaMeta) => !!a.subtemas?.length;
const isOpen = (a: AreaMeta) => a.status === "disponivel" && !!a.arquivo && !isGroup(a);
const groupOpen = (a: AreaMeta) => isGroup(a) && (a.subtemas ?? []).some(isOpen);

function ItemLink({ a, n, state, current, paths, onNavigate }: { a: AreaIndex; n: ItemNode; state: State; current: boolean; paths: Paths; onNavigate?: () => void }) {
  const done = doneCount(a, state, n), total = a.marksOf(n).length;
  const status = done === total ? "concluído" : done ? "em andamento" : "";
  return (
    <li>
      <Link to={paths.itemPath(n.key)} className={s.navItem} aria-current={current ? "page" : undefined} data-status={done === total ? "full" : done ? "part" : "none"} onClick={onNavigate}>
        <span className={s.dot} aria-hidden="true" />
        <span>{n.kind === "workshop" ? "Oficina do módulo" : n.title}</span>
        {status && <span className="visually-hidden">({status})</span>}
      </Link>
    </li>
  );
}

function ModuleGroup({ a, mod, items, state, currentKey, forceOpen, paths, onNavigate }: {
  a: AreaIndex; mod: Module; items: ItemNode[]; state: State; currentKey: string | null; forceOpen: boolean; paths: Paths; onNavigate?: () => void;
}) {
  const p = moduleProgress(a, state, mod);
  const hasCurrent = items.some(n => n.key === currentKey);
  const cor = tradition(a, mod.steps[0]?.tradition ?? "").color;
  return (
    <details className={s.navModule} open={forceOpen || hasCurrent} style={{ ["--accent" as string]: cor }}>
      <summary>
        <ProgressRing value={p.done} max={p.total} label={`${p.done} de ${p.total} marcos`} size={30} color={cor} showLabel={false} />
        <span className={s.navModText}>
          <span className={s.navModKicker}>Módulo {mod.number}</span>
          <span className={s.navModName}>{mod.name}</span>
        </span>
        <svg className={s.navChevron} viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </summary>
      <ul className={s.navList}>
        {items.map(n => <ItemLink key={n.key} a={a} n={n} state={state} current={n.key === currentKey} paths={paths} onNavigate={onNavigate} />)}
      </ul>
    </details>
  );
}

function Busca({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder: string; id: string }) {
  const input = useRef<HTMLInputElement>(null);
  // Atalho "/" foca a busca (fora de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (!input.current || input.current.offsetParent === null) return; // menu escondido
      e.preventDefault();
      input.current.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className={s.searchBox}>
      <svg className={s.searchIcon} viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      <label htmlFor={id} className="visually-hidden">Buscar</label>
      <input
        ref={input}
        id={id}
        type="search"
        className={s.search}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape" && value) { e.stopPropagation(); onChange(""); } }}
      />
      {value
        ? <button type="button" className={s.searchClear} onClick={() => { onChange(""); input.current?.focus(); }} aria-label="Limpar busca">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        : <kbd className={s.kbd} aria-hidden="true">/</kbd>}
    </div>
  );
}

export function AtlasNav({ ctx, onNavigate, onPrint }: { ctx: AtlasContext; onNavigate?: () => void; onPrint?: () => void }) {
  const { manifest, area, paths, itemId } = ctx;
  const { content } = useServices();
  const state = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const [allAreas, setAllAreas] = useState<(AreaIndex | null)[] | null>(null);
  const searchId = useId();
  const q = query.trim();
  const currentKey = area && itemId ? area.slug + "/" + itemId : null;
  // folhas disponíveis (áreas simples e subtemas): onde a busca em todas procura
  const availableAreas = manifest.areas.flatMap(a => (isGroup(a) ? a.subtemas ?? [] : [a])).filter(isOpen);

  useEffect(() => {
    if (!all || !q) return;
    let alive = true;
    void Promise.all(availableAreas.map(a => content.loadArea(a.slug).catch(() => null))).then(list => { if (alive) setAllAreas(list); });
    return () => { alive = false; };
    // availableAreas deriva do manifesto, que não muda durante a sessão
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, content]);

  const mudarBusca = (v: string) => { setQuery(v); if (!v.trim()) { setAll(false); setAllAreas(null); } };

  const searchAllButton = q && !all && (
    <button type="button" className={s.searchAll} onClick={() => setAll(true)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      Buscar “{q}” em todas as áreas
    </button>
  );

  let body;
  if (all && q) {
    body = !allAreas ? <p className={s.navEmpty} role="status">Buscando…</p> : availableAreas.map((meta, i) => {
      const a = allAreas[i];
      const groups = a ? searchModules(a, q) : [];
      return (
        <section key={meta.slug} aria-label={`Resultados em ${meta.nome}`}>
          <h3 className={s.navGroup}>{meta.nome}</h3>
          {!a ? <p className={s.navEmpty}>Sem conexão para buscar nesta área.</p>
            : !groups.length ? <p className={s.navEmpty}>Nada encontrado.</p>
            : groups.map(g => <ModuleGroup key={g.mod.id} a={a} mod={g.mod} items={g.items} state={state} currentKey={currentKey} forceOpen paths={paths} onNavigate={onNavigate} />)}
        </section>
      );
    });
  } else if (area) {
    const groups = searchModules(area, q);
    body = (
      <>
        {groups.length ? groups.map(g => (
          <ModuleGroup key={g.mod.id} a={area} mod={g.mod} items={g.items} state={state} currentKey={currentKey} forceOpen={!!q} paths={paths} onNavigate={onNavigate} />
        )) : <p className={s.navEmpty}>Nada encontrado nesta área.</p>}
        {searchAllButton}
      </>
    );
  } else {
    const linha = (a: AreaMeta, indent = false): React.ReactNode => {
      const p = areaProgress(a.slug, state.marks, state.totals[a.slug]);
      return (
        <li key={a.slug}>
          <Link to={isGroup(a) ? "/atlas/" + a.slug : paths.areaPath(a.slug)} className={[s.navArea, indent && s.navAreaSub].filter(Boolean).join(" ")} onClick={onNavigate}>
            <span className={s.navSwatch} style={{ background: isGroup(a) ? "var(--warm)" : leafColors(a)[0] }} aria-hidden="true" />
            <span className={s.navAreaName}>{a.nome}</span>
            {!isGroup(a) && p.pct !== null && <span className={s.navPct}>{p.pct}%</span>}
          </Link>
        </li>
      );
    };
    body = (
      <>
        {searchAllButton}
        <ul className={s.navList}>
          {manifest.areas.filter(a => isOpen(a) || groupOpen(a)).flatMap(a => (isGroup(a)
            ? [linha(a), ...(a.subtemas ?? []).filter(isOpen).map(sub => linha(sub, true))]
            : [linha(a)]))}
        </ul>
      </>
    );
  }

  const prog = area ? areaMarks(area, state) : null;

  return (
    <nav className={s.nav} aria-label="Conteúdo do atlas">
      <div className={s.navTop}>
        <AreaPicker
          manifest={manifest}
          value={area ? area.slug : ctx.group ? ctx.group.slug : ""}
          onChange={v => { onNavigate?.(); void navigate(v ? (manifest.areas.some(a => a.slug === v && isGroup(a)) ? "/atlas/" + v : paths.areaPath(v)) : "/atlas"); }}
        />
        <Busca id={searchId} value={query} onChange={mudarBusca} placeholder={area ? "Buscar nesta área" : "Buscar temas"} />
        {area && prog && (
          <Link to={paths.areaPath(area.slug)} className={s.areaSummary} onClick={onNavigate}>
            <ProgressRing value={prog.done} max={prog.total} label="Progresso na área" size={40} color="var(--success)" />
            <span className={s.areaSummaryText}>
              <b>Visão geral da área</b>
              <span>{prog.done} de {prog.total} marcos</span>
            </span>
          </Link>
        )}
      </div>
      <div className={s.navBody}>{body}</div>
      <AtlasTools area={area} onAction={onNavigate} onPrint={onPrint} />
    </nav>
  );
}
