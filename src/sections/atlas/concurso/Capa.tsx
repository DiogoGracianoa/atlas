// Capa do preparatório: contagem regressiva (RN09), hoje (RN07, RN08),
// cobertura do edital (RN02), a prova com fontes (RN04) e progresso (RN14).
import { Link } from "react-router";
import { useRegistros } from "../../../app/context";
import { contagem, dataBr, textoContagem } from "../../../core/concurso/calendario";
import { obrigatorios, progressoDisciplina, progressoTotal, revisoesPendentes } from "../../../core/concurso/desempenho";
import { Progress } from "../../../ui/primitives";
import { Block, useTitle } from "../components/parts";
import { numBr, SessaoForm, textoFonte, useConcurso, useHoje } from "./comum";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

export function Capa() {
  const { x, agora, path, dia } = useConcurso();
  const regs = useRegistros();
  const h = useHoje();
  useTitle(`${x.meta.titulo ?? x.meta.nome} · Letrume`);
  const d = x.data;
  const cont = contagem(d, agora);
  const nomeAtiv = (f: string) => x.disciplinas.get(f)?.nome ?? d.atividades[f] ?? f;
  const pendentes = obrigatorios(d).filter(t => t.validacao !== "verificado");
  const refs = [...new Set(obrigatorios(d).map(t => t.fonte?.ref).filter((r): r is string => !!r))];
  const conferido = refs.flatMap(r => { const f = x.fontes.get(r); return f ? [`${f.documento}, ${f.versao}`] : []; }).join("; ");
  const total = progressoTotal(d, regs, x.slug);
  const revPend = revisoesPendentes(d, regs, x.slug, dia);
  const ob = d.prova.objetiva;
  const di = d.prova.discursiva;

  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Concursos · {d.concurso.banca}</p>
        <h1 className={p.h1}>{x.meta.titulo ?? x.meta.nome}</h1>
        <p className={p.lead}>{d.concurso.orgao} · {d.concurso.edital} · cargo {d.concurso.cargo.codigo}, {d.concurso.cargo.nome}</p>
      </header>

      <div className={c.box} role="group" aria-label="Contagem regressiva">
        <p className={c.big}>{textoContagem(cont)}</p>
        <p className={c.note}>{dataBr(d.prova.data)} · data prevista no edital (item {d.prova.fonte.item}), sujeita a retificação.</p>
      </div>

      <Block title="Hoje">
        <div className={c.box}>
          {h.fase === "antes" && (<>
            <p className={c.big}>{h.comecaEm === 1 ? "Começa em 1 dia" : `Começa em ${h.comecaEm} dias`}</p>
            <p>Semana 1 · {d.trilha.semanas[0]?.titulo} · a partir de {dataBr(d.trilha.inicio)}</p>
          </>)}
          {h.fase === "durante" && h.semana && (<>
            <p><b>Semana {h.semana.n}</b> · {h.semana.titulo}</p>
            <p>Foco do dia: {h.foco.map(nomeAtiv).join(", ")} <span className={c.sugestao}>Sugestão pedagógica</span></p>
            {h.topicos.length > 0 && (
              <ul className={c.topicos}>
                {h.topicos.map(t => <li key={t}><Link to={path("topico", t)}>{x.topicos.get(t)?.topico.titulo ?? t}</Link></li>)}
              </ul>
            )}
            {h.topicos.length === 0 && h.foco.some(f => x.disciplinas.has(f)) && <p className={c.note}>Os tópicos desta disciplina na semana já foram concluídos.</p>}
            {revPend.length > 0 && <p><Link to={path("revisoes")}>{revPend.length === 1 ? "1 revisão pendente" : `${revPend.length} revisões pendentes`}</Link></p>}
            <SessaoForm regs={regs} disciplina={h.foco.find(f => x.disciplinas.has(f)) ?? "geral"} topicos={h.topicos} />
          </>)}
          {h.fase === "depois" && <p>A trilha terminou em {dataBr(d.trilha.fim)}.</p>}
        </div>
      </Block>

      <Block title="Programa do edital">
        {pendentes.length === 0
          ? <p className={p.callout}>Programa conferido com {conferido}</p>
          : (
            <div className={p.callout}>
              <b>{pendentes.length === 1 ? "1 tópico pendente de conferência com o edital" : `${pendentes.length} tópicos pendentes de conferência com o edital`}</b>
              <ul className={c.topicos}>
                {pendentes.map(t => <li key={t.id}><Link to={path("topico", t.id)}>{t.titulo}</Link>{t.nota && <span className={c.estado}>{t.nota}</span>}</li>)}
              </ul>
            </div>
          )}
      </Block>

      <Block title="A prova">
        <p className={c.big}>{ob.questoes} questões objetivas</p>
        <ul className={p.ticks}>
          {ob.disciplinas.map(od => <li key={od.id}>{x.disciplinas.get(od.id)?.nome}: {od.questoes} questões, peso {od.peso}</li>)}
          <li>{ob.alternativas} alternativas por questão; aprovação com {ob.minimo}% dos pontos.</li>
        </ul>
        <p className={c.note}>Fonte: {textoFonte(x, ob.fonte)}</p>
        {di && (<>
          <p><b>Discursiva:</b> {di.questoes} questões de {numBr(di.pontos)} pontos, até {di.linhas} linhas cada; aprovação com {di.minimoPct}%.</p>
          <p className={c.note}>Fonte: {textoFonte(x, di.fonte)}</p>
        </>)}
        <p><b>Data:</b> {dataBr(d.prova.data)}{d.prova.turno ? `, ${d.prova.turno}` : ""}.</p>
        <p className={c.note}>Fonte: {textoFonte(x, d.prova.fonte)}</p>
      </Block>

      <Block title="Progresso">
        <Progress value={total.concluidos} max={total.total} label="Tópicos concluídos" />
        {d.disciplinas.map(dd => {
          const pr = progressoDisciplina(d, regs, x.slug, dd.id);
          return <Progress key={dd.id} value={pr.concluidos} max={pr.total} label={dd.nome} />;
        })}
        <p className={c.note}><Link to={path("painel")}>Ver o painel completo</Link></p>
      </Block>
    </div>
  );
}
