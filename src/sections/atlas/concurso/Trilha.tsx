// Trilha de dez semanas (RN05, RN06, RN10, RN11): datas, tópicos por
// disciplina com o estado, revisões da semana, metas como sugestão e tempo
// previsto × realizado.
import { useId } from "react";
import { Link } from "react-router";
import { useRegistros } from "../../../app/context";
import { dataBr, ordemDaTrilha } from "../../../core/concurso/calendario";
import { estadoTopico, fmtMinutos, ROTULO_ESTADO, semanaEfetiva, tempoSemana } from "../../../core/concurso/estudo";
import type { Semana } from "../../../core/concurso/tipos";
import { useTitle } from "../components/parts";
import { corDisciplina, Sugestao, useConcurso, useHoje } from "./comum";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

export function Trilha() {
  const { x } = useConcurso();
  const h = useHoje();
  useTitle(`Trilha · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Trilha de estudos</p>
        <h1 className={p.h1}>{x.data.trilha.semanas.length} semanas</h1>
        <p className={p.lead}>De {dataBr(x.data.trilha.inicio)} a {dataBr(x.data.trilha.fim)}. Cronograma, metas e rotina são sugestões pedagógicas; o programa vem do edital.</p>
      </header>
      <ul className={c.lista}>
        {x.data.trilha.semanas.map(s => <li key={s.n}><SemanaCard s={s} atual={h.semana?.n === s.n} /></li>)}
      </ul>
    </div>
  );
}

function SemanaCard({ s, atual }: { s: Semana; atual: boolean }) {
  const { x, path } = useConcurso();
  const regs = useRegistros();
  const hid = useId();
  const ids = ordemDaTrilha(x.data).filter(id => semanaEfetiva(regs, x.data, x.slug, id) === s.n);
  const tempo = tempoSemana(regs, x.data, x.slug, s.n);
  return (
    <section className={c.semana} aria-labelledby={hid} aria-current={atual ? "true" : undefined}>
      <h3 id={hid}>Semana {s.n} · {s.titulo}</h3>
      <p className={c.note}>{dataBr(s.inicio)} a {dataBr(s.fim)}</p>
      <div className={c.meta}><span>{s.meta}</span><Sugestao /></div>
      <p className={c.note}>Tempo: <span>{fmtMinutos(tempo.realizado)} de {fmtMinutos(tempo.previsto)}</span></p>
      <div className={c.discs}>
        {x.data.disciplinas.map(d => {
          const novos = ids.filter(id => x.topicos.get(id)?.disciplina.id === d.id);
          const rev = (s.revisar ?? []).filter(id => x.topicos.get(id)?.disciplina.id === d.id);
          const nota = s.notas?.[d.id];
          if (!novos.length && !rev.length && !nota) return null;
          return (
            <div key={d.id} className={c.disc} style={{ ["--accent" as string]: corDisciplina(x.slug, d.id) }}>
              <b>{d.nome}</b>
              {nota && <p className={c.note}>{nota}</p>}
              {novos.length > 0 && (
                <ul className={c.topicos}>
                  {novos.map(id => (
                    <li key={id}>
                      <Link to={path("topico", id)}>{x.topicos.get(id)?.topico.titulo}</Link>
                      <span className={c.estado}>{ROTULO_ESTADO[estadoTopico(regs, x.slug, id).estado]}</span>
                    </li>
                  ))}
                </ul>
              )}
              {rev.length > 0 && <p className={c.note}>Revisar: {rev.map(id => x.topicos.get(id)?.topico.titulo).join("; ")}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
