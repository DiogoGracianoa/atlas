// Simulado (RN19, RN20, RN26, RN27): montagem pela distribuição do quadro de
// provas, correção com pesos e histórico. Brancos contam como erro.
import type { Registros } from "../registros";
import { notaObjetiva } from "./desempenho";
import type { Concurso, Questao } from "./tipos";

export interface Falta { disciplina: string; disponiveis: number; exigidas: number }
export interface Montagem { questoes: string[]; parcial: boolean; faltas: Falta[] }

export function disponibilidade(c: Concurso, questoes: Questao[], discDe: (topico: string) => string | undefined): Falta[] {
  return c.prova.objetiva.disciplinas.map(d => ({
    disciplina: d.id, exigidas: d.questoes, disponiveis: questoes.filter(q => discDe(q.topico) === d.id).length,
  }));
}

/** Sorteia as questões de cada disciplina, até o número do quadro de provas. */
export function montarSimulado(c: Concurso, questoes: Questao[], discDe: (topico: string) => string | undefined, rnd: () => number = Math.random): Montagem {
  const disp = disponibilidade(c, questoes, discDe);
  const ids: string[] = [];
  for (const d of c.prova.objetiva.disciplinas) {
    const pool = questoes.filter(q => discDe(q.topico) === d.id).map(q => q.id);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j] as string, pool[i] as string]; }
    ids.push(...pool.slice(0, d.questoes));
  }
  return { questoes: ids, parcial: disp.some(f => f.disponiveis < f.exigidas), faltas: disp.filter(f => f.disponiveis < f.exigidas) };
}

export interface Correcao { acertos: Record<string, number>; nota: number; max: number; parcial: boolean }

/** Nota com os pesos; no parcial, o máximo é o das questões sorteadas. */
export function corrigir(c: Concurso, porId: Map<string, Questao>, ids: string[], respostas: Record<string, number>, discDe: (topico: string) => string | undefined, parcial: boolean): Correcao {
  const acertos: Record<string, number> = Object.fromEntries(c.prova.objetiva.disciplinas.map(d => [d.id, 0]));
  let max = 0;
  const peso = new Map(c.prova.objetiva.disciplinas.map(d => [d.id, d.peso]));
  for (const id of ids) {
    const q = porId.get(id);
    if (!q) continue;
    const d = discDe(q.topico) ?? "";
    max += peso.get(d) ?? 0;
    if (respostas[id] === q.gabarito) acertos[d] = (acertos[d] ?? 0) + 1;
  }
  if (!parcial) {
    const n = notaObjetiva(c, acertos);
    return { acertos, nota: n.nota, max: n.max, parcial };
  }
  const nota = Object.entries(acertos).reduce((a, [d, k]) => a + k * (peso.get(d) ?? 0), 0);
  return { acertos, nota, max, parcial };
}

export interface SimuladoFeito { id: string; dia: string; nota: number; max: number; parcial: boolean; acertos: Record<string, number> }

export function historicoSimulados(regs: Registros, area: string): SimuladoFeito[] {
  return regs.lista("simulado", area).map(r => ({
    id: r.id, dia: String(r.corpo.dia), nota: Number(r.corpo.nota), max: Number(r.corpo.max), parcial: r.corpo.parcial === true,
    acertos: (r.corpo.acertos ?? {}) as Record<string, number>,
  })).sort((a, b) => (a.dia < b.dia ? -1 : a.dia > b.dia ? 1 : 0));
}
