// Painel (RN22): progresso, taxa de acertos, tempo, revisões, simulados e
// temas mais fracos, todos calculados dos registros reais.
import { useId, type ReactNode } from "react";
import { Link } from "react-router";
import { useRegistros } from "../../../app/context";
import { dataBr } from "../../../core/concurso/calendario";
import { progressoDisciplina, progressoTotal, revisoes, taxaDisciplina, taxaGeral, temasFracos } from "../../../core/concurso/desempenho";
import { fmtMinutos, tempoSemana, tempoTotal } from "../../../core/concurso/estudo";
import { Progress } from "../../../ui/primitives";
import { useTitle } from "../components/parts";
import { numBr, pctTexto, useConcurso, useHoje } from "./comum";
import { historicoSimulados } from "./Simulado";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

function Regiao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const hid = useId();
  return <section aria-labelledby={hid} className={p.block}><h2 id={hid} className={p.blockTitle}>{titulo}</h2>{children}</section>;
}

export function Painel() {
  const { x, dia, path } = useConcurso();
  const regs = useRegistros();
  const h = useHoje();
  useTitle(`Painel · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  const d = x.data;
  const total = progressoTotal(d, regs, x.slug);
  const revs = revisoes(d, regs, x.slug);
  const sims = historicoSimulados(regs, x.slug);
  const fracos = temasFracos(d, regs, x.slug, 5);
  const semana = h.semana ?? h.semanaEmFoco;
  const tempo = semana ? tempoSemana(regs, d, x.slug, semana.n) : null;
  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Painel</p>
        <h1 className={p.h1}>Meu desempenho</h1>
      </header>
      <Regiao titulo="Progresso">
        <Progress value={total.concluidos} max={total.total} label={`Tópicos concluídos (${total.concluidos} de ${total.total})`} />
        {d.disciplinas.map(dd => { const pr = progressoDisciplina(d, regs, x.slug, dd.id); return <Progress key={dd.id} value={pr.concluidos} max={pr.total} label={`${dd.nome} (${pr.concluidos} de ${pr.total})`} />; })}
        <p className={c.note}>Conta só tópicos obrigatórios do edital marcados como concluídos.</p>
      </Regiao>
      <Regiao titulo="Taxa de acertos">
        <ul className={p.ticks}>
          <li>Geral: <b>{pctTexto(taxaGeral(regs, x.slug))}</b></li>
          {d.disciplinas.map(dd => <li key={dd.id}>{dd.nome}: <b>{pctTexto(taxaDisciplina(d, regs, x.slug, dd.id))}</b></li>)}
        </ul>
        <p className={c.note}>Questões de fixação. Respostas de simulado ficam no histórico de simulados.</p>
      </Regiao>
      <Regiao titulo="Tempo de estudo">
        <ul className={p.ticks}>
          {semana && tempo && <li>Semana {semana.n}: {fmtMinutos(tempo.realizado)} de {fmtMinutos(tempo.previsto)} previstos</li>}
          <li>Acumulado: {fmtMinutos(tempoTotal(regs, x.slug))}</li>
        </ul>
      </Regiao>
      <Regiao titulo="Revisões">
        <p>{revs.filter(r => !r.feita && r.dia <= dia).length} pendentes · {revs.filter(r => r.feita).length} feitas · <Link to={path("revisoes")}>ver revisões</Link></p>
      </Regiao>
      <Regiao titulo="Simulados">
        {!sims.length && <p className={p.muted}>Nenhum simulado feito.</p>}
        <ul className={p.ticks}>
          {sims.map((s, i) => {
            const ant = sims[i - 1];
            const delta = ant && !ant.parcial && !s.parcial ? s.nota - ant.nota : null;
            return (
              <li key={s.id}>{dataBr(s.dia)} · {s.parcial ? "parcial, " : ""}{numBr(s.nota)} de {numBr(s.max)}
                {delta !== null ? ` (${delta >= 0 ? "+" : ""}${numBr(delta)})` : ""}</li>
            );
          })}
        </ul>
      </Regiao>
      <Regiao titulo="Temas com desempenho mais baixo">
        {!fracos.length && <p className={p.muted}>Sem dados: responda questões para ver os temas mais fracos.</p>}
        <ol className={p.questions}>
          {fracos.map(f => <li key={f.topico}><Link to={path("topico", f.topico)}>{x.topicos.get(f.topico)?.topico.titulo}</Link> · {pctTexto(f.taxa)}</li>)}
        </ol>
      </Regiao>
    </div>
  );
}
