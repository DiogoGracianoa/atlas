// Peças comuns às telas do preparatório: carga do concurso, contexto, "hoje",
// textos de fonte (RN01, RN04) e o formulário de sessão de estudo (RN11).
import { createContext, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useRegistros, useServices } from "../../../app/context";
import type { ConcursoIndex } from "../../../core/content";
import { dataBr, diaLocal, hoje as calcHoje, type Hoje } from "../../../core/concurso/calendario";
import { estadoTopico, fmtMinutos, registrarSessao, semanaEfetiva } from "../../../core/concurso/estudo";
import type { Questao, RefFonte, Teoria, Validacao } from "../../../core/concurso/tipos";
import type { Registros } from "../../../core/registros";
import { Button } from "../../../ui/primitives";
import type { Loadable } from "../data";
import c from "./Concurso.module.css";

export interface ConcursoCtx {
  x: ConcursoIndex;
  base: string;
  /** Dia local (AAAA-MM-DD) no fuso da prova. */
  dia: string;
  agora: string;
  path(pagina?: string, id?: string): string;
}

const Ctx = createContext<ConcursoCtx | null>(null);
export const ConcursoProvider = ({ value, children }: { value: ConcursoCtx; children: ReactNode }) => <Ctx.Provider value={value}>{children}</Ctx.Provider>;
export function useConcurso(): ConcursoCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useConcurso fora do preparatório");
  return v;
}

function useLoad<T>(key: string, load: () => Promise<T>): Loadable<T> {
  const [state, setState] = useState<{ key: string; value: Loadable<T> }>({ key: "", value: { status: "loading" } });
  useEffect(() => {
    let alive = true;
    load().then(
      v => { if (alive) setState({ key, value: { status: "ready", data: v } }); },
      (e: unknown) => { if (alive) setState({ key, value: { status: "error", error: e instanceof Error ? e : new Error(String(e)) } }); },
    );
    return () => { alive = false; };
    // `key` resume as dependências de `load`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state.value : { status: "loading" };
}

export function useConcursoIndex(slug: string): Loadable<ConcursoIndex> {
  const { content } = useServices();
  return useLoad("c:" + slug, () => content.loadManifest().then(() => content.loadConcurso(slug)));
}

/** Teoria de um tópico publicado (null enquanto carrega ou se não houver). */
export function useTeoria(x: ConcursoIndex, topico: string): Loadable<Teoria | null> {
  const { content } = useServices();
  const node = x.topicos.get(topico);
  const disc = node?.disciplina.id ?? "";
  const pub = !!node?.topico.publicado;
  return useLoad(`t:${x.slug}:${disc}:${topico}:${pub}`, async () => (pub ? (await content.loadTeoria(x.slug, disc))[topico] ?? null : null));
}

/** Disciplinas com ao menos um tópico publicado. */
export const disciplinasPublicadas = (x: ConcursoIndex) =>
  x.data.disciplinas.filter(d => d.modulos.some(m => m.topicos.some(t => t.publicado))).map(d => d.id);

/** Questões de tópicos publicados, das disciplinas pedidas. */
export function useQuestoes(x: ConcursoIndex, disciplinas: string[]): Loadable<Questao[]> {
  const { content } = useServices();
  const ds = disciplinas.filter(d => disciplinasPublicadas(x).includes(d));
  return useLoad(`q:${x.slug}:${ds.join(",")}`, async () => {
    const listas = await Promise.all(ds.map(d => content.loadQuestoes(x.slug, d)));
    return listas.flat().filter(q => x.topicos.get(q.topico)?.topico.publicado);
  });
}

export function useHoje(): Hoje {
  const { x, agora } = useConcurso();
  const regs = useRegistros();
  return useMemo(() => calcHoje(x.data, agora, {
    semanaDe: id => semanaEfetiva(regs, x.data, x.slug, id),
    concluido: id => estadoTopico(regs, x.slug, id).estado === "concluido",
  }), [x, agora, regs, regs.versao]); // eslint-disable-line react-hooks/exhaustive-deps
}

export const diaDe = (x: ConcursoIndex, agora: string) => diaLocal(agora, x.data.prova.fuso);

/* ---------- fontes (RN01, RN04) ---------- */

export function textoFonte(x: ConcursoIndex, ref: RefFonte | undefined, { comData = false } = {}): string {
  if (!ref) return "sem fonte";
  const f = x.fontes.get(ref.ref);
  if (!f) return "fonte desconhecida";
  const onde = ref.pagina ? `p. ${ref.pagina}` : ref.item ? `item ${ref.item}` : "";
  return [`${f.documento}, ${f.versao}${comData ? `, de ${dataBr(f.data)}` : ""}`, onde].filter(Boolean).join(comData ? " · " : ", ");
}

export const ROTULO_VALIDACAO: Record<Validacao, string> = {
  verificado: "Verificado", pendente: "Pendente de conferência", divergente: "Divergente do edital",
};

export function Selo({ v }: { v: Validacao | undefined }) {
  if (!v) return <span className={c.selo} data-v="opcional">Reforço opcional</span>;
  return <span className={c.selo} data-v={v}>{ROTULO_VALIDACAO[v]}</span>;
}

export function Sugestao() {
  return <span className={c.sugestao}>Sugestão pedagógica</span>;
}

export const corDisciplina = (slug: string, d: string) => `var(--trad-${slug}-${d})`;

/* ---------- sessão de estudo (RN11) ---------- */

export function SessaoForm({ regs, disciplina, topicos }: { regs: Registros; disciplina: string; topicos: string[] }) {
  const { x, dia } = useConcurso();
  const id = useId();
  const [min, setMin] = useState("60");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const salvar = () => {
    const minutos = Number(min);
    try {
      registrarSessao(regs, x.slug, { disciplina, topicos, data: dia, minutos });
      setMsg({ ok: true, text: `Sessão de ${fmtMinutos(minutos)} registrada.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Não foi possível registrar." });
    }
  };
  return (
    <div className={c.form}>
      <label htmlFor={id}>Minutos estudados</label>
      <div className={c.row}>
        <input id={id} type="number" inputMode="numeric" min={1} max={1440} value={min} onChange={e => setMin(e.target.value)} className={c.input} />
        <Button variant="primary" onClick={salvar}>Registrar sessão</Button>
      </div>
      <p role="status" className={msg && !msg.ok ? c.erro : c.ok}>{msg?.text ?? ""}</p>
    </div>
  );
}

export const pctTexto = (t: { pct: number; acertos: number; total: number } | null) => (t ? `${t.pct}% (${t.acertos} de ${t.total})` : "Sem dados");
export const numBr = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
