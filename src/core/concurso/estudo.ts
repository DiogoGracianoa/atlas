// Ações e leituras do estudo de um concurso sobre os registros (K-R1):
// estado do tópico (RN12, RN13), replanejamento com histórico (RN10) e
// sessões de estudo (RN11).
import type { Registros } from "../registros";
import type { Concurso } from "./tipos";

export type EstadoTopico = "nao-iniciado" | "em-andamento" | "concluido" | "revisao-necessaria";
export type Confianca = "baixa" | "media" | "alta";
export const ESTADOS: readonly EstadoTopico[] = ["nao-iniciado", "em-andamento", "concluido", "revisao-necessaria"];
export const CONFIANCAS: readonly Confianca[] = ["baixa", "media", "alta"];
export const ROTULO_ESTADO: Record<EstadoTopico, string> = {
  "nao-iniciado": "Não iniciado", "em-andamento": "Em andamento", concluido: "Concluído", "revisao-necessaria": "Revisão necessária",
};
export const ROTULO_CONFIANCA: Record<Confianca, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };

export interface SituacaoTopico {
  estado: EstadoTopico;
  /** Dia (AAAA-MM-DD) em que a leitura foi concluída, ou null. */
  leitura: string | null;
  confianca: Confianca | null;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const idTopico = (area: string, topico: string) => area + "/" + topico;

export function estadoTopico(regs: Registros, area: string, topico: string): SituacaoTopico {
  const c = regs.get("topico", idTopico(area, topico))?.corpo ?? {};
  const estado = ESTADOS.includes(c.estado as EstadoTopico) ? (c.estado as EstadoTopico) : "nao-iniciado";
  const leitura = typeof c.leitura === "string" && ISO.test(c.leitura) ? c.leitura : null;
  const confianca = CONFIANCAS.includes(c.confianca as Confianca) ? (c.confianca as Confianca) : null;
  return { estado, leitura, confianca };
}

function atualizar(regs: Registros, area: string, topico: string, mudanca: Partial<SituacaoTopico>) {
  const atual = estadoTopico(regs, area, topico);
  regs.put("topico", idTopico(area, topico), area, { ...atual, ...mudanca });
}

export function definirEstado(regs: Registros, area: string, topico: string, estado: EstadoTopico) {
  if (!ESTADOS.includes(estado)) throw new Error("Estado inválido: " + estado);
  atualizar(regs, area, topico, { estado });
}

/** RN13: só registra a leitura; estado e confiança não mudam. `dia` null desfaz. */
export function marcarLeitura(regs: Registros, area: string, topico: string, dia: string | null) {
  if (dia !== null && !ISO.test(dia)) throw new Error("Data inválida: " + dia);
  atualizar(regs, area, topico, { leitura: dia });
}

export function definirConfianca(regs: Registros, area: string, topico: string, confianca: Confianca | null) {
  if (confianca !== null && !CONFIANCAS.includes(confianca)) throw new Error("Confiança inválida: " + confianca);
  atualizar(regs, area, topico, { confianca });
}

/* ---------- replanejamento (RN10) ---------- */

export const semanaPlanejada = (c: Concurso, topico: string): number | null =>
  c.trilha.semanas.find(s => s.topicos.includes(topico))?.n ?? null;

interface Mudanca { de: number; para: number; em: string }

function mudancas(regs: Registros, area: string, topico: string): (Mudanca & { at: string })[] {
  return regs.lista("replanejamento", area)
    .filter(r => r.corpo.topico === topico)
    .map(r => ({ de: Number(r.corpo.de), para: Number(r.corpo.para), em: String(r.corpo.em), at: r.at }))
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

export function semanaEfetiva(regs: Registros, c: Concurso, area: string, topico: string): number | null {
  const m = mudancas(regs, area, topico);
  return m.length ? (m[m.length - 1] as Mudanca).para : semanaPlanejada(c, topico);
}

export function historicoTopico(regs: Registros, c: Concurso, area: string, topico: string): { planejada: number | null; mudancas: Mudanca[] } {
  return { planejada: semanaPlanejada(c, topico), mudancas: mudancas(regs, area, topico).map(({ de, para, em }) => ({ de, para, em })) };
}

export function replanejar(regs: Registros, c: Concurso, area: string, topico: string, para: number, dia: string) {
  const n = c.trilha.semanas.length;
  if (!Number.isInteger(para) || para < 1 || para > n) throw new Error(`Semana fora da trilha (1 a ${n}).`);
  const de = semanaEfetiva(regs, c, area, topico);
  if (de === null) throw new Error("Tópico fora da trilha.");
  if (de === para) return;
  regs.evento("replanejamento", area, { topico, de, para, em: dia });
}

/* ---------- sessões (RN11) ---------- */

export interface Sessao { disciplina: string; topicos: string[]; data: string; minutos: number }

export function registrarSessao(regs: Registros, area: string, s: Sessao) {
  if (!ISO.test(s.data)) throw new Error("Data inválida.");
  if (!Number.isInteger(s.minutos) || s.minutos <= 0 || s.minutos > 1440) throw new Error("Duração deve ficar entre 1 minuto e 24 horas.");
  regs.evento("sessao", area, { disciplina: s.disciplina, topicos: s.topicos, data: s.data, minutos: s.minutos });
}

export function sessoes(regs: Registros, area: string): (Sessao & { id: string })[] {
  return regs.lista("sessao", area).map(r => ({
    id: r.id, disciplina: String(r.corpo.disciplina), topicos: Array.isArray(r.corpo.topicos) ? (r.corpo.topicos as string[]) : [],
    data: String(r.corpo.data), minutos: Number(r.corpo.minutos) || 0,
  })).sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
}

/** Horas previstas por semana: a do plano do estudante ou a da trilha. */
export function horasSemana(regs: Registros, c: Concurso, area: string): number {
  const h = Number(regs.get("plano", area)?.corpo.horasSemana);
  return h > 0 && h <= 168 ? h : c.trilha.horasSemana;
}

export function definirHorasSemana(regs: Registros, area: string, horas: number) {
  if (!(horas > 0 && horas <= 168)) throw new Error("Horas por semana entre 0 e 168.");
  regs.put("plano", area, area, { horasSemana: horas });
}

export function tempoSemana(regs: Registros, c: Concurso, area: string, n: number): { realizado: number; previsto: number } {
  const s = c.trilha.semanas.find(x => x.n === n);
  const realizado = s ? sessoes(regs, area).filter(x => x.data >= s.inicio && x.data <= s.fim).reduce((a, x) => a + x.minutos, 0) : 0;
  return { realizado, previsto: Math.round(horasSemana(regs, c, area) * 60) };
}

export function tempoTotal(regs: Registros, area: string): number {
  return sessoes(regs, area).reduce((a, x) => a + x.minutos, 0);
}

/** "150" → "2 h 30"; "60" → "1 h"; "45" → "45 min". */
export function fmtMinutos(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}
