// Página do agrupador (RN01): lista os subtemas disponíveis da área, com link e
// progresso. Planejados não aparecem (extensão de 2026-11-06).
import { useId } from "react";
import { Link } from "react-router";
import { useAppState } from "../../../app/context";
import { areaProgress } from "../../../core/content";
import { Tag } from "../../../ui/primitives";
import { Arte } from "../../../ui/Arte";
import { ProgressRing } from "../../../ui/ProgressRing";
import { leafColors } from "../model";
import { useAtlas } from "../AtlasLayout";
import { BackupNote, useTitle } from "../components/parts";
import s from "../Page.module.css";

export function Grupo() {
  const { group, paths } = useAtlas();
  const state = useAppState();
  const hid = useId();
  useTitle(group ? `${group.nome} · Atlas` : "Atlas");
  if (!group) return null;
  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={s.kicker}>Atlas de estudos</p>
        <h1 className={s.h1}>{group.nome}</h1>
        {group.resumo && <p className={s.lead}>{group.resumo}</p>}
      </header>
      <h2 id={hid} className="visually-hidden">Subtemas</h2>
      <ul className={s.areas} aria-labelledby={hid}>
        {/* só o que existe: subtemas planejados não aparecem */}
        {(group.subtemas ?? []).filter(sub => sub.status === "disponivel" && !!sub.arquivo).map(sub => {
          const p = areaProgress(sub.slug, state.marks, state.totals[sub.slug]);
          return (
            <li key={sub.slug}>
              <Link to={paths.areaPath(sub.slug)} className={s.areaCard}>
                <Arte seed={sub.slug} colors={leafColors(sub)} height={96} className={s.cardArt} />
                <div className={s.cardRow}>
                  <div className={s.cardText}>
                    <Tag>Subtema</Tag>
                    <h3>{sub.nome}</h3>
                    {sub.resumo && <p>{sub.resumo}</p>}
                  </div>
                  {p.total ? <ProgressRing value={p.done} max={p.total} label={`Progresso em ${sub.nome}`} size={58} color="var(--success)" /> : null}
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
