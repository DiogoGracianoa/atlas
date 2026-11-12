// Cálculos de desempenho do preparatório sobre os registros (K-R1): progresso
// (RN14, RN03), tentativas e taxa (RN16), caderno de erros (RN17), revisões
// espaçadas (RN18), nota da objetiva (RN19) e temas fracos (RN22).
//
// Até a resposta à P9 da visão, só as questões de fixação entram na taxa e no
// caderno; respostas de simulado ficam registradas com origem "simulado".
import type { Registro, Registros } from "../registros";
import { disciplinaPorTopico, ordemDaTrilha, somarDias } from "./calendario";
import { estadoTopico } from "./estudo";
import type { Concurso, Topico } from "./tipos";

export interface Progresso { concluidos: number; total: number; pct: number }
export interface Taxa { acertos: number; total: number; pct: number }

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

/** Tópicos obrigatórios (não opcionais) do concurso, por disciplina. */
export function obrigatorios(c: Concurso, disciplina?: string): Topico[] {
  return c.disciplinas
    .filter(d => disciplina === undefined || d.id === disciplina)
    .flatMap(d => d.modulos.flatMap(m => m.topicos))
    .filter(t => !t.opcional);
}

function progresso(c: Concurso, regs: Registros, area: string, disciplina?: string): Progresso {
  const ts = obrigatorios(c, disciplina);
  const concluidos = ts.filter(t => estadoTopico(regs, area, t.id).estado === "concluido").length;
  return { concluidos, total: ts.length, pct: pct(concluidos, ts.length) };
}
export const progressoDisciplina = (c: Concurso, regs: Registros, area: string, d: string) => progresso(c, regs, area, d);
export const progressoTotal = (c: Concurso, regs: Registros, area: string) => progresso(c, regs, area);

/* ---------- tentativas (RN16, RN24) ---------- */

export interface Tentativa {
  id: string;
  questao: string;
  topico: string;
  marcada: number;
  acerto: boolean;
  /** Dia local da resposta. */
  em: string;
  at: string;
  origem: "fixacao" | "simulado";
  simulado?: string;
}

const paraTentativa = (r: Registro): Tentativa => ({
  id: r.id, questao: String(r.corpo.questao), topico: String(r.corpo.topico), marcada: Number(r.corpo.marcada),
  acerto: r.corpo.acerto === true, em: String(r.corpo.em), at: r.at,
  origem: r.corpo.origem === "simulado" ? "simulado" : "fixacao",
  ...(typeof r.corpo.simulado === "string" ? { simulado: r.corpo.simulado } : {}),
});

const porHorario = (a: { at: string }, b: { at: string }) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0);

export function tentativas(regs: Registros, area: string, { incluirSimulado = false } = {}): Tentativa[] {
  return regs.lista("tentativa", area).map(paraTentativa)
    .filter(t => incluirSimulado || t.origem === "fixacao")
    .sort(porHorario);
}

/** Registra a resposta e devolve se acertou. `marcada` −1 = em branco. */
export function responder(
  regs: Registros, area: string, q: { id: string; topico: string; gabarito: number }, marcada: number, dia: string,
  origem: "fixacao" | "simulado" = "fixacao", simulado?: string,
): boolean {
  const acerto = marcada === q.gabarito;
  regs.evento("tentativa", area, { questao: q.id, topico: q.topico, marcada, acerto, em: dia, origem, ...(simulado ? { simulado } : {}) });
  return acerto;
}

function taxa(ts: Tentativa[]): Taxa | null {
  if (!ts.length) return null;
  const acertos = ts.filter(t => t.acerto).length;
  return { acertos, total: ts.length, pct: pct(acertos, ts.length) };
}
export const taxaTopico = (regs: Registros, area: string, topico: string) => taxa(tentativas(regs, area).filter(t => t.topico === topico));
export const taxaGeral = (regs: Registros, area: string) => taxa(tentativas(regs, area));
export function taxaDisciplina(c: Concurso, regs: Registros, area: string, disciplina: string): Taxa | null {
  const disc = disciplinaPorTopico(c);
  return taxa(tentativas(regs, area).filter(t => disc.get(t.topico) === disciplina));
}

/* ---------- caderno de erros (RN17) ---------- */

export interface ItemCaderno { questao: string; topico: string; errouEm: string; anotacao: string }

const idErro = (area: string, questao: string) => area + "/" + questao;

export function cadernoDeErros(regs: Registros, area: string): ItemCaderno[] {
  const ultima = new Map<string, Tentativa>();
  for (const t of tentativas(regs, area)) ultima.set(t.questao, t);
  const out: ItemCaderno[] = [];
  for (const t of ultima.values()) {
    if (t.acerto) continue;
    const e = regs.get("erro", idErro(area, t.questao))?.corpo ?? {};
    if (typeof e.revisadaApos === "string" && e.revisadaApos >= t.at) continue;
    out.push({ questao: t.questao, topico: t.topico, errouEm: t.em, anotacao: typeof e.anotacao === "string" ? e.anotacao : "" });
  }
  return out.sort((a, b) => (a.errouEm < b.errouEm ? 1 : a.errouEm > b.errouEm ? -1 : 0));
}

export function anotarErro(regs: Registros, area: string, questao: string, anotacao: string) {
  const atual = regs.get("erro", idErro(area, questao))?.corpo ?? {};
  regs.put("erro", idErro(area, questao), area, { ...atual, anotacao: anotacao.slice(0, 4000) });
}

/** Tira a questão do caderno até um novo erro. */
export function marcarErroRevisado(regs: Registros, area: string, questao: string) {
  const ult = tentativas(regs, area).filter(t => t.questao === questao).pop();
  if (!ult) return;
  const atual = regs.get("erro", idErro(area, questao))?.corpo ?? {};
  regs.put("erro", idErro(area, questao), area, { ...atual, revisadaApos: ult.at });
}

/* ---------- revisões espaçadas (RN18) ---------- */

export interface Revisao { topico: string; n: number; dia: string; feita: boolean }
const idRevisao = (area: string, topico: string, n: number) => `${area}/${topico}/${n}`;

export function revisoes(c: Concurso, regs: Registros, area: string): Revisao[] {
  const ordem = new Map(ordemDaTrilha(c).map((id, i) => [id, i]));
  const out: Revisao[] = [];
  for (const id of disciplinaPorTopico(c).keys()) {
    const leitura = estadoTopico(regs, area, id).leitura;
    if (!leitura) continue;
    for (const n of c.revisao.dias) {
      const dia = somarDias(leitura, n);
      if (dia > c.trilha.fim) continue;
      out.push({ topico: id, n, dia, feita: !!regs.get("revisao", idRevisao(area, id, n)) });
    }
  }
  return out.sort((a, b) => (a.dia !== b.dia ? (a.dia < b.dia ? -1 : 1) : (ordem.get(a.topico) ?? 0) - (ordem.get(b.topico) ?? 0)));
}

export const revisoesPendentes = (c: Concurso, regs: Registros, area: string, hoje: string) =>
  revisoes(c, regs, area).filter(r => !r.feita && r.dia <= hoje);

export function marcarRevisao(regs: Registros, area: string, topico: string, n: number, dia: string) {
  regs.put("revisao", idRevisao(area, topico, n), area, { feitaEm: dia });
}

/* ---------- nota (RN19) ---------- */

export interface Nota { nota: number; max: number; minimo: number; aprovado: boolean }

export function notaObjetiva(c: Concurso, acertos: Record<string, number>): Nota {
  let nota = 0, max = 0;
  for (const d of c.prova.objetiva.disciplinas) {
    const a = acertos[d.id] ?? 0;
    if (!Number.isInteger(a) || a < 0 || a > d.questoes) throw new Error(`Acertos de ${d.id} fora de 0 a ${d.questoes}.`);
    nota += a * d.peso;
    max += d.questoes * d.peso;
  }
  const minimo = (max * c.prova.objetiva.minimo) / 100;
  return { nota, max, minimo, aprovado: nota >= minimo };
}

/* ---------- temas fracos (RN22) ---------- */

export function temasFracos(c: Concurso, regs: Registros, area: string, n = 5): { topico: string; taxa: Taxa }[] {
  return ordemDaTrilha(c)
    .map(topico => ({ topico, taxa: taxaTopico(regs, area, topico) }))
    .filter((x): x is { topico: string; taxa: Taxa } => x.taxa !== null)
    .sort((a, b) => a.taxa.pct - b.taxa.pct)
    .slice(0, n);
}
