// Treino da discursiva (RN21): formato e critérios do edital, com nota sempre
// rotulada como autoavaliação.
import { useId, useState } from "react";
import { useRegistros, useServices } from "../../../app/context";
import { dataBr } from "../../../core/concurso/calendario";
import { Button } from "../../../ui/primitives";
import { useTitle } from "../components/parts";
import { numBr, textoFonte, useConcurso } from "./comum";
import p from "../Page.module.css";
import c from "./Concurso.module.css";
import { useEffect } from "react";
import type { CasoDiscursiva } from "../../../core/concurso/tipos";

export function Discursiva() {
  const { x, dia } = useConcurso();
  const { content } = useServices();
  const regs = useRegistros();
  const di = x.data.prova.discursiva;
  useTitle(`Discursiva · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  const [casos, setCasos] = useState<CasoDiscursiva[]>([]);
  useEffect(() => {
    let alive = true;
    content.loadDiscursiva(x.slug).then(l => { if (alive) setCasos(l); }, () => { /* sem casos publicados */ });
    return () => { alive = false; };
  }, [content, x.slug]);
  const [caso, setCaso] = useState("");
  const [texto, setTexto] = useState("");
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const ids = { caso: useId(), resp: useId(), base: useId() };
  if (!di) return <div className={p.page}><h1 className={p.h1}>Discursiva</h1><p className={p.muted}>Este concurso não tem prova discursiva no edital.</p></div>;

  const valores = di.criterios.map(k => ({ k, v: notas[k.id] === undefined || notas[k.id] === "" ? 0 : Number(String(notas[k.id]).replace(",", ".")) }));
  const invalidos = valores.filter(({ k, v }) => !(v >= 0 && v <= k.max) || Number.isNaN(v));
  const total = valores.reduce((a, { v }) => a + (Number.isFinite(v) ? v : 0), 0);
  const curto = (nome: string) => nome.split(/\s+e\s+|\s+\(/)[0] ?? nome;
  const atual = casos.find(k => k.id === caso);
  const salvar = () => {
    if (invalidos.length) return;
    regs.evento("discursiva", x.slug, { caso: caso || null, em: dia, criterios: Object.fromEntries(valores.map(({ k, v }) => [k.id, v])), total, texto: texto.slice(0, 4000) });
    setMsg("Autoavaliação salva.");
  };
  const feitos = regs.lista("discursiva", x.slug).sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Treino</p>
        <h1 className={p.h1}>Discursiva · treino</h1>
        <p className={p.lead}>{di.questoes} questões de caso prático, até {di.linhas} linhas cada, {numBr(di.pontos)} pontos por questão.</p>
        <p className={c.note}>Fonte: {textoFonte(x, di.fonte)}</p>
      </header>
      {casos.length > 0 && (
        <div className={c.form}>
          <label htmlFor={ids.caso}>Caso</label>
          <select id={ids.caso} className={c.select} value={caso} onChange={e => setCaso(e.target.value)}>
            <option value="">Tema livre</option>
            {casos.map(k => <option key={k.id} value={k.id}>{k.caso.slice(0, 80)}</option>)}
          </select>
        </div>
      )}
      {atual && <div className={p.callout}><p>{atual.caso}</p><p><b>{atual.pede}</b></p></div>}
      <div className={c.form}>
        <label htmlFor={ids.resp}>Resposta (até {di.linhas} linhas no papel)</label>
        <textarea id={ids.resp} className={c.textarea} value={texto} onChange={e => setTexto(e.target.value)} />
      </div>
      <fieldset className={c.alternativas}>
        <legend>Autoavaliação pelos critérios do edital</legend>
        {di.criterios.map(k => {
          const id = `${ids.base}-${k.id}`;
          const ruim = invalidos.some(({ k: kk }) => kk.id === k.id);
          return (
            <div key={k.id} className={c.form}>
              <label htmlFor={id}>{curto(k.nome)} (até {numBr(k.max)})</label>
              <input id={id} className={c.input} inputMode="decimal" value={notas[k.id] ?? ""} aria-invalid={ruim || undefined}
                onChange={e => setNotas({ ...notas, [k.id]: e.target.value })} />
              {ruim && <p className={c.erro}>{curto(k.nome)} vai até {numBr(k.max)}.</p>}
            </div>
          );
        })}
      </fieldset>
      <p className={c.big}>Total: {numBr(total)} de {numBr(di.pontos)} (autoavaliação)</p>
      {atual && <div className={c.box}><b>Espelho de resposta</b><ul className={p.ticks}>{atual.espelho.map(e => <li key={e}>{e}</li>)}</ul></div>}
      <div className={p.actions}><Button variant="primary" disabled={invalidos.length > 0} onClick={salvar}>Salvar autoavaliação</Button></div>
      <p role="status" className={c.ok}>{msg}</p>
      {feitos.length > 0 && (
        <section className={p.block} aria-label="Treinos anteriores">
          <h2 className={p.blockTitle}>Treinos anteriores</h2>
          <ul className={p.ticks}>{feitos.map(r => <li key={r.id}>{dataBr(String(r.corpo.em))} · {numBr(Number(r.corpo.total))} de {numBr(di.pontos)} (autoavaliação)</li>)}</ul>
        </section>
      )}
    </div>
  );
}
