// Simulado no portal (RN19, RN20, RN26, RN27): sorteio pelo quadro de provas,
// tempo da prova, retomada após recarregar (só local) e histórico.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRegistros, useServices } from "../../../app/context";
import { dataBr } from "../../../core/concurso/calendario";
import { responder } from "../../../core/concurso/desempenho";
import { corrigir, historicoSimulados, montarSimulado, type Correcao } from "../../../core/concurso/simulado";
import type { Questao } from "../../../core/concurso/tipos";
import { Button } from "../../../ui/primitives";
import { useTitle } from "../components/parts";
import { disciplinasPublicadas, numBr, textoFonte, useConcurso, useQuestoes } from "./comum";
import { LETRAS, origemTexto } from "./Questoes";
import p from "../Page.module.css";
import c from "./Concurso.module.css";

export { historicoSimulados };

interface Ativo { id: string; inicio: number; fim: number; questoes: string[]; respostas: Record<string, number>; parcial: boolean }
const chave = (slug: string) => "atlas-simulado-ativo:" + slug;

function lerAtivo(storage: { getItem(k: string): string | null }, slug: string): Ativo | null {
  try {
    const a = JSON.parse(storage.getItem(chave(slug)) || "null") as Ativo | null;
    return a && Array.isArray(a.questoes) && typeof a.fim === "number" ? a : null;
  } catch { return null; }
}

const relogio = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function Simulado() {
  const { x, dia } = useConcurso();
  const { storage, agora, registros: regs } = useServices();
  useRegistros();
  useTitle(`Simulado · ${x.meta.titulo ?? x.meta.nome} · Letrume`);
  const qs = useQuestoes(x, disciplinasPublicadas(x));
  const [ativo, setAtivo] = useState<Ativo | null>(() => lerAtivo(storage, x.slug));
  const [resultado, setResultado] = useState<Correcao | null>(null);
  const [i, setI] = useState(0);
  const [, tick] = useState(0);
  const discDe = (t: string) => x.topicos.get(t)?.disciplina.id;
  const lista = useMemo(() => (qs.status === "ready" ? qs.data : []), [qs]);
  const porId = useMemo(() => new Map(lista.map(q => [q.id, q])), [lista]);
  const previa = useMemo(() => montarSimulado(x.data, lista, discDe), [lista]); // eslint-disable-line react-hooks/exhaustive-deps
  const ob = x.data.prova.objetiva;
  const sigla = (d: string) => x.disciplinas.get(d)?.sigla ?? d;

  const salvar = (a: Ativo | null) => {
    setAtivo(a);
    try { if (a) storage.setItem(chave(x.slug), JSON.stringify(a)); else storage.setItem(chave(x.slug), "null"); } catch { /* sem armazenamento */ }
  };

  const encerrar = (a: Ativo) => {
    const corr = corrigir(x.data, porId, a.questoes, a.respostas, discDe, a.parcial);
    for (const id of a.questoes) {
      const q = porId.get(id);
      if (q) responder(regs, x.slug, q, a.respostas[id] ?? -1, dia, "simulado", a.id);
    }
    regs.put("simulado", a.id, x.slug, { dia, inicio: new Date(a.inicio).toISOString(), fim: agora(), parcial: a.parcial, questoes: a.questoes, acertos: corr.acertos, nota: corr.nota, max: corr.max });
    salvar(null);
    setResultado(corr);
  };

  const restante = ativo ? ativo.fim - Date.parse(agora()) : 0;
  // Tempo esgotado: encerra no próximo segundo (também depois de recarregar).
  const encerrarRef = useRef(encerrar);
  useEffect(() => { encerrarRef.current = encerrar; });
  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => {
      tick(n => n + 1);
      if (Date.parse(agora()) >= ativo.fim) encerrarRef.current(ativo);
    }, 1000);
    return () => clearInterval(t);
  }, [ativo, agora]);

  if (qs.status === "loading") return <p className={p.muted} role="status" style={{ padding: "24px var(--gutter)" }}>Carregando questões…</p>;
  if (qs.status === "error") return <p className={p.muted} role="alert" style={{ padding: "24px var(--gutter)" }}>Não foi possível carregar as questões. Confira a conexão.</p>;

  if (ativo) {
    const q = porId.get(ativo.questoes[i] ?? "");
    return (
      <div className={[p.page, c.texto].join(" ")}>
        <header className={p.itemHead}>
          <p className={p.kicker}>Simulado{ativo.parcial ? " parcial" : ""}</p>
          <h1 className={p.h1}>Questão {i + 1} de {ativo.questoes.length}</h1>
          <p role="timer" aria-live="off" className={c.timer}>Tempo restante: {relogio(restante)}</p>
        </header>
        {q && <QuestaoSimulado q={q} marcada={ativo.respostas[q.id]} onMarcar={k => salvar({ ...ativo, respostas: { ...ativo.respostas, [q.id]: k } })} />}
        <div className={p.actions}>
          <Button disabled={i === 0} onClick={() => setI(i - 1)}>Anterior</Button>
          <Button disabled={i + 1 >= ativo.questoes.length} onClick={() => setI(i + 1)}>Próxima</Button>
          <Button variant="primary" onClick={() => encerrar(ativo)}>Encerrar e corrigir</Button>
        </div>
      </div>
    );
  }

  const iniciar = () => {
    const m = montarSimulado(x.data, lista, discDe);
    const ini = Date.parse(agora());
    setI(0);
    setResultado(null);
    salvar({ id: "sim-" + ini.toString(36) + Math.random().toString(36).slice(2, 7), inicio: ini, fim: ini + ob.duracaoMin * 60000, questoes: m.questoes, respostas: {}, parcial: m.parcial });
  };
  const sims = historicoSimulados(regs, x.slug);

  return (
    <div className={p.page}>
      <header className={p.hero}>
        <p className={p.kicker}>Simulado</p>
        <h1 className={p.h1}>Simulado da objetiva</h1>
        <p className={p.lead}>{ob.questoes} questões na distribuição do quadro de provas, com {Math.floor(ob.duracaoMin / 60)} h de tempo (no dia, esse tempo inclui a discursiva). Questões autorais.</p>
        <p className={c.note}>Fonte da distribuição: {textoFonte(x, ob.fonte)}</p>
      </header>
      {resultado && (
        <div className={c.box} role="status">
          <p className={c.big}>{resultado.parcial ? `Nota parcial: ${numBr(resultado.nota)} de ${numBr(resultado.max)} pontos` : `Nota: ${numBr(resultado.nota)} de ${numBr(resultado.max)} pontos`}</p>
          <p>{Object.entries(resultado.acertos).map(([d, k]) => `${sigla(d)} ${k}`).join(" · ")}</p>
          {!resultado.parcial && <p className={c.note}>Referência do edital: mínimo de {numBr((resultado.max * ob.minimo) / 100)} pontos.</p>}
        </div>
      )}
      <div className={c.box}>
        {previa.parcial
          ? <p>Simulado parcial: {previa.faltas.map(f => `${sigla(f.disciplina)} ${f.disponiveis} de ${f.exigidas}`).join(", ")}</p>
          : <p>Simulado completo: {ob.questoes} questões.</p>}
        {previa.parcial && <p className={c.note}>Faltam questões publicadas; a nota sai como parcial e não é comparada à referência do edital.</p>}
        <Button variant="primary" disabled={!previa.questoes.length} onClick={iniciar}>Iniciar simulado</Button>
      </div>
      <section className={p.block} aria-label="Histórico de simulados">
        <h2 className={p.blockTitle}>Histórico</h2>
        {!sims.length && <p className={p.muted}>Nenhum simulado feito.</p>}
        <ul className={p.ticks}>
          {sims.map((s, k) => {
            const ant = sims[k - 1];
            const delta = ant && !ant.parcial && !s.parcial ? s.nota - ant.nota : null;
            return <li key={s.id}>{dataBr(s.dia)} · {s.parcial ? "parcial, " : ""}{numBr(s.nota)} de {numBr(s.max)}{delta !== null ? ` (${delta >= 0 ? "+" : ""}${numBr(delta)})` : ""}</li>;
          })}
        </ul>
      </section>
    </div>
  );
}

function QuestaoSimulado({ q, marcada, onMarcar }: { q: Questao; marcada: number | undefined; onMarcar: (k: number) => void }) {
  const name = useId();
  return (
    <>
      <p className={c.note}>Origem: {origemTexto(q)}</p>
      <p className={p.prose}>{q.enunciado}</p>
      <fieldset className={c.alternativas}>
        <legend>Alternativas</legend>
        {q.alternativas.map((alt, k) => (
          <label key={k} htmlFor={`${name}-${k}`} className={c.alt}>
            <input id={`${name}-${k}`} type="radio" name={name} checked={marcada === k} onChange={() => onMarcar(k)} />
            <span>{LETRAS[k]}) {alt}</span>
          </label>
        ))}
      </fieldset>
    </>
  );
}
