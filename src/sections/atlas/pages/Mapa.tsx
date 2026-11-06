// Mapa do Atlas: áreas com progresso, "em breve" para as planejadas e o
// atalho "Continuar de onde parei".
import { useEffect, useId, useState } from "react";
import { Link } from "react-router";
import { useAppState, useServices } from "../../../app/context";
import { areaProgress } from "../../../core/content";
import { Tag } from "../../../ui/primitives";
import { Arte } from "../../../ui/Arte";
import { ProgressRing } from "../../../ui/ProgressRing";
import { useAtlas } from "../AtlasLayout";
import { BackupNote, useTitle } from "../components/parts";
import { itemName, labelFromId, leafColors } from "../model";
import type { AreaMeta } from "../../../core/types";
import s from "../Page.module.css";

/** Nome do item: o título, se a área já está em cache; senão, "Módulo 2, tema 3". */
function useItemLabel(slug: string, id: string): string {
  const { content } = useServices();
  const key = slug + "/" + id;
  const [resolved, setResolved] = useState<{ key: string; label: string } | null>(null);
  useEffect(() => {
    if (!content.isLoaded(slug)) return;
    let alive = true;
    void content.loadArea(slug).then(a => {
      const n = a.byId[id];
      if (alive && n) setResolved({ key: slug + "/" + id, label: itemName(n) });
    });
    return () => { alive = false; };
  }, [content, slug, id]);
  return resolved?.key === key ? resolved.label : labelFromId(id);
}

function Continuar({ slug, id, nome }: { slug: string; id: string; nome: string }) {
  const label = useItemLabel(slug, id);
  const { paths } = useAtlas();
  return (
    <Link to={paths.itemPath(slug + "/" + id)} className={s.continue}>
      <span><b>Continuar de onde parei</b><span>{nome} · {label}</span></span>
      <i aria-hidden="true">→</i>
    </Link>
  );
}

export function Mapa() {
  const { manifest } = useAtlas();
  const state = useAppState();
  const hid = useId();
  useTitle("Mapa do Atlas · Atlas");
  const isGroup = (a: AreaMeta) => !!a.subtemas?.length;
  const folhaAberta = (a: AreaMeta) => a.status === "disponivel" && !!a.arquivo;
  // só o que existe: agrupador aparece se tiver subtema disponível; planejado não aparece
  const aberta = (a: AreaMeta) => (isGroup(a) ? a.status === "disponivel" && (a.subtemas ?? []).some(folhaAberta) : folhaAberta(a));
  const disponiveis = manifest.areas.filter(aberta);
  // folhas: áreas simples e subtemas (onde vive o progresso)
  const folhas = manifest.areas.flatMap(a => (isGroup(a) ? a.subtemas ?? [] : [a]));

  const [lastSlug = "", lastId = ""] = state.lastAt ? state.lastAt.route.split("/") : [];
  const lastMeta = folhas.find(a => a.slug === lastSlug && a.status === "disponivel");

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={s.kicker}>Atlas de estudos</p>
        <h1 className={s.h1}>Mapa do Atlas</h1>
        <p className={s.lead}>Escolha uma área. Cada área é uma trilha própria, com a explicação de cada tema, o vídeo e o livro, e o seu progresso.</p>
      </header>
      {lastMeta && lastId && <Continuar slug={lastSlug} id={lastId} nome={lastMeta.nome} />}
      <h2 id={hid} className="visually-hidden">Áreas</h2>
      <ul className={s.areas} aria-labelledby={hid}>
        {disponiveis.map(a => {
          // agrupador: soma o progresso dos subtemas (RN04)
          const p = (isGroup(a) ? (a.subtemas ?? []).filter(folhaAberta) : [a])
            .map(x => areaProgress(x.slug, state.marks, state.totals[x.slug]))
            .reduce((acc, x) => ({ done: acc.done + x.done, total: acc.total + (x.total ?? 0) }), { done: 0, total: 0 });
          return (
            <li key={a.slug}>
              <Link to={"/atlas/" + a.slug} className={s.areaCard}>
                <Arte seed={a.slug} colors={(isGroup(a) ? (a.subtemas ?? []).filter(folhaAberta) : [a]).flatMap(leafColors)} height={96} className={s.cardArt} />
                <div className={s.cardRow}>
                  <div className={s.cardText}>
                    <Tag>{isGroup(a) ? `${(a.subtemas ?? []).filter(folhaAberta).length} ${(a.subtemas ?? []).filter(folhaAberta).length === 1 ? "subtema" : "subtemas"}` : "Área"}</Tag>
                    <h3>{a.nome}</h3>
                    {a.resumo && <p>{a.resumo}</p>}
                  </div>
                  {p.total
                    ? <ProgressRing value={p.done} max={p.total} label={`Progresso em ${a.nome}`} size={58} color="var(--success)" />
                    : null}
                </div>
                {!p.total && <span className={s.muted}>{p.done} {p.done === 1 ? "marco concluído" : "marcos concluídos"}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <BackupNote />
    </div>
  );
}
