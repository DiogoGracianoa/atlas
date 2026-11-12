// Calendário do preparatório (RN07–RN09): dia local no fuso da prova, semana
// da trilha, foco do dia pela rotina e contagem regressiva. Funções puras; o
// relógio vem de fora.
import type { Concurso, DiaSemana, Semana } from "./tipos";

const DIAS: DiaSemana[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const MS_DIA = 86400000;

/** Data AAAA-MM-DD do instante `now` no fuso informado. */
export function diaLocal(now: string, fuso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now));
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const utc = (dia: string) => Date.parse(dia + "T00:00:00Z");
/** Dias de `a` até `b` (b − a), ambos AAAA-MM-DD. */
export const diasEntre = (a: string, b: string) => Math.round((utc(b) - utc(a)) / MS_DIA);
export const diaDaSemana = (dia: string): DiaSemana => DIAS[new Date(utc(dia)).getUTCDay()] as DiaSemana;
export const somarDias = (dia: string, n: number) => new Date(utc(dia) + n * MS_DIA).toISOString().slice(0, 10);
/** "2027-01-24" → "24/01/2027". */
export const dataBr = (dia: string) => dia.split("-").reverse().join("/");

export interface Plano {
  /** Semana efetiva do tópico (com replanejamentos), ou null fora da trilha. */
  semanaDe(id: string): number | null;
  concluido(id: string): boolean;
}

export interface Hoje {
  dia: string;
  diaSemana: DiaSemana;
  fase: "antes" | "durante" | "depois";
  /** Dias até o início da trilha (só na fase "antes"). */
  comecaEm: number | null;
  /** Semana corrente; null fora da trilha. */
  semana: Semana | null;
  /** Semana a mostrar: a corrente, ou a 1 antes do início; null depois. */
  semanaEmFoco: Semana | null;
  /** Disciplinas ou atividades da rotina para o dia. */
  foco: string[];
  /** Tópicos da semana em foco, das disciplinas do dia, não concluídos. */
  topicos: string[];
}

export function semanaNaData(c: Concurso, dia: string): Semana | null {
  return c.trilha.semanas.find(s => s.inicio <= dia && dia <= s.fim) ?? null;
}

/** Disciplina de cada tópico do concurso. */
export function disciplinaPorTopico(c: Concurso): Map<string, string> {
  const m = new Map<string, string>();
  for (const d of c.disciplinas) for (const mo of d.modulos) for (const t of mo.topicos) m.set(t.id, d.id);
  return m;
}

/** Tópicos na ordem da trilha original (semana 1 primeiro). */
export const ordemDaTrilha = (c: Concurso) => c.trilha.semanas.flatMap(s => s.topicos);

export function hoje(c: Concurso, now: string, plano: Plano): Hoje {
  const dia = diaLocal(now, c.prova.fuso);
  const diaSemana = diaDaSemana(dia);
  const fase = dia < c.trilha.inicio ? "antes" : dia > c.trilha.fim ? "depois" : "durante";
  const semana = fase === "durante" ? semanaNaData(c, dia) : null;
  const semanaEmFoco = fase === "antes" ? c.trilha.semanas[0] ?? null : semana;
  const foco = c.rotina[diaSemana]?.foco ?? [];
  const disc = disciplinaPorTopico(c);
  const topicos = semanaEmFoco && fase === "durante"
    ? ordemDaTrilha(c).filter(id => plano.semanaDe(id) === semanaEmFoco.n && foco.includes(disc.get(id) ?? "") && !plano.concluido(id))
    : [];
  return { dia, diaSemana, fase, comecaEm: fase === "antes" ? diasEntre(dia, c.trilha.inicio) : null, semana, semanaEmFoco, foco, topicos };
}

export type Contagem = { tipo: "faltam"; dias: number } | { tipo: "hoje" } | { tipo: "realizada"; data: string };

export function contagem(c: Concurso, now: string): Contagem {
  const n = diasEntre(diaLocal(now, c.prova.fuso), c.prova.data);
  if (n > 0) return { tipo: "faltam", dias: n };
  if (n === 0) return { tipo: "hoje" };
  return { tipo: "realizada", data: c.prova.data };
}

export function textoContagem(x: Contagem): string {
  if (x.tipo === "faltam") return x.dias === 1 ? "Falta 1 dia" : `Faltam ${x.dias} dias`;
  if (x.tipo === "hoje") return "A prova é hoje";
  return "Prova realizada em " + dataBr(x.data);
}
