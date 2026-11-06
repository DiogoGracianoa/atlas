// Menu do atlas: seletor de área, busca (na área ou em todas), módulos com
// progresso e lista de itens com o atual destacado.
import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAppState, useServices } from "../../../app/context";
import type { AreaIndex, AreaMeta, ItemNode, Module, State } from "../../../core/types";
import { areaProgress } from "../../../core/content";
import type { AtlasContext } from "../AtlasLayout";
import { areaMarks, doneCount, moduleProgress, searchModules } from "../model";
import type { Paths } from "../paths";
import { Progress } from "../../../ui/primitives";
import { AtlasTools } from "./AtlasTools";
import s from "../Atlas.module.css";

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
  return (
    <details className={s.navModule} open={forceOpen || hasCurrent}>
      <summary>
        <span className={s.navModNum}>{mod.number}</span>
        <span className={s.navModName}>{mod.name}</span>
        <span className={s.navModCount} aria-label={`${p.done} de ${p.total} marcos`}>{p.done}/{p.total}</span>
      </summary>
      <ul className={s.navList}>
        {items.map(n => <ItemLink key={n.key} a={a} n={n} state={state} current={n.key === currentKey} paths={paths} onNavigate={onNavigate} />)}
      </ul>
    </details>
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
  const selectId = useId(), searchId = useId();
  const q = query.trim();
  const currentKey = area && itemId ? area.slug + "/" + itemId : null;
  const isGroup = (a: AreaMeta) => !!a.subtemas?.length;
  const isOpen = (a: AreaMeta) => a.status === "disponivel" && !!a.arquivo && !isGroup(a);
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

  const searchAllButton = q && !all && (
    <button type="button" className={s.searchAll} onClick={() => setAll(true)}>
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
    body = (
      <>
        {searchAllButton}
        <ul className={s.navList}>
          {manifest.areas.map(function linha(a: AreaMeta): React.ReactNode {
            if (isGroup(a)) {
              return (
                <li key={a.slug}>
                  {a.status === "disponivel"
                    ? <Link to={"/atlas/" + a.slug} className={s.navItem} onClick={onNavigate}><span>{a.nome}</span></Link>
                    : <span className={s.navItem} aria-disabled="true" data-soon><span>{a.nome}</span><small>em breve</small></span>}
                  <ul className={s.navSubList}>{(a.subtemas ?? []).map(linha)}</ul>
                </li>
              );
            }
            const p = areaProgress(a.slug, state.marks, state.totals[a.slug]);
            return (
              <li key={a.slug}>
                {isOpen(a) ? (
                  <Link to={paths.areaPath(a.slug)} className={s.navItem} onClick={onNavigate}>
                    <span>{a.nome}</span>
                    {p.pct !== null && <span className={s.navModCount}>{p.pct}%</span>}
                  </Link>
                ) : (
                  <span className={s.navItem} aria-disabled="true" data-soon>
                    <span>{a.nome}</span><small>em breve</small>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <nav className={s.nav} aria-label="Conteúdo do atlas">
      <div className={s.navTop}>
        <label htmlFor={selectId} className={s.navLabel}>Área</label>
        <select
          id={selectId}
          className={s.select}
          value={area ? area.slug : ""}
          onChange={e => { onNavigate?.(); void navigate(e.target.value ? paths.areaPath(e.target.value) : "/atlas"); }}
        >
          <option value="">Mapa do Atlas</option>
          {manifest.areas.map(a => {
            const opcao = (x: AreaMeta) => <option key={x.slug} value={x.slug} disabled={!isOpen(x)}>{x.nome}{isOpen(x) ? "" : " — em breve"}</option>;
            return isGroup(a)
              ? <optgroup key={a.slug} label={a.nome}>{(a.subtemas ?? []).map(opcao)}</optgroup>
              : opcao(a);
          })}
        </select>
        <label htmlFor={searchId} className={s.navLabel}>Buscar</label>
        <input
          id={searchId}
          type="search"
          className={s.search}
          placeholder={area ? "Buscar nesta área" : "Buscar"}
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) { setAll(false); setAllAreas(null); } }}
        />
        {area && (
          <div className={s.navMeta}>
            <Progress value={areaMarks(area, state).done} max={areaMarks(area, state).total} label="Progresso na área" />
            <Link to={paths.areaPath(area.slug)} onClick={onNavigate}>Visão geral da área</Link>
          </div>
        )}
      </div>
      <div className={s.navBody}>{body}</div>
      <AtlasTools area={area} onAction={onNavigate} onPrint={onPrint} />
    </nav>
  );
}

