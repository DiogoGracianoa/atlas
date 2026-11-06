// Capa da área: abertura, rota de três passos, números e módulos com progresso.
import { Link } from "react-router";
import { useAppState } from "../../../app/context";
import { Progress } from "../../../ui/primitives";
import { useAtlas } from "../AtlasLayout";
import { BackupNote, useTitle } from "../components/parts";
import { areaMarks, doneCount, fillTemplate, moduleNodes, moduleProgress, tradition } from "../model";
import s from "../Page.module.css";

export function Capa() {
  const { area: a, paths } = useAtlas();
  const state = useAppState();
  useTitle(a ? (a.meta.tituloPdf || a.meta.nome) : "Atlas");
  if (!a) return null;
  const capa = a.meta.capa;
  const p = areaMarks(a, state);
  const pct = p.total ? Math.round((100 * p.done) / p.total) : 0;

  return (
    <div className={s.page} style={{ ["--accent" as string]: tradition(a, a.data.modules[0]?.steps[0]?.tradition ?? "").color }}>
      <header className={s.hero}>
        {capa?.rotulo && <p className={s.kicker}>{capa.rotulo}</p>}
        <h1 className={s.h1}>{a.meta.titulo || a.meta.nome}</h1>
        <p className={s.lead}>{fillTemplate(capa?.lead, a.stats)}</p>
      </header>

      {capa?.passos?.length ? (
        <ol className={s.route}>
          {capa.passos.map(p => <li key={p.t}><b>{p.t}</b><span>{p.d}</span></li>)}
        </ol>
      ) : null}

      <dl className={s.stats}>
        <div><dt>do percurso concluído</dt><dd>{pct}%</dd></div>
        <div><dt>livros no roteiro</dt><dd>{a.stats.livros}</dd></div>
        <div><dt>vídeos e playlists</dt><dd>{a.stats.videos}</dd></div>
      </dl>

      <section aria-labelledby="capa-modulos">
      <h2 id="capa-modulos" className={s.sectionTitle}>Módulos</h2>
      <div className={s.modules}>
        {a.data.modules.map(m => {
          const mp = moduleProgress(a, state, m);
          const color = tradition(a, m.steps[0]?.tradition ?? "").color;
          const partial = mp.done > 0 && mp.done < mp.total;
          return (
            <details key={m.id} className={s.modCard} style={{ ["--accent" as string]: color }} open={partial}>
              <summary>
                <span className={s.modMeta}>Módulo {String(m.number).padStart(2, "0")} · {m.level}</span>
                <span className={s.modName}>{m.name}</span>
                <span className={s.modSub}>{m.subtitle}</span>
                <Progress value={mp.done} max={mp.total} label={`Módulo ${m.number}`} />
              </summary>
              <ul className={s.modItems}>
                {moduleNodes(a, m).map(n => {
                  const d = doneCount(a, state, n), t = a.marksOf(n).length;
                  return (
                    <li key={n.key}>
                      <Link to={paths.itemPath(n.key)} data-status={d === t ? "full" : d ? "part" : "none"}>
                        <span className={s.dot} aria-hidden="true" />
                        {n.kind === "workshop" ? "Oficina do módulo" : n.title}
                        {d === t && <span className="visually-hidden"> (concluído)</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
      </section>
      <BackupNote />
    </div>
  );
}
