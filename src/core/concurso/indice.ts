// Índice de um concurso carregado (K-C1): tópicos, disciplinas e fontes por id.
import type { AreaMeta } from "../types";
import type { Concurso, Disciplina, Fonte, Modulo, Topico } from "./tipos";

export interface TopicoNode { topico: Topico; disciplina: Disciplina; modulo: Modulo }

export interface ConcursoIndex {
  slug: string;
  meta: AreaMeta;
  data: Concurso;
  topicos: Map<string, TopicoNode>;
  disciplinas: Map<string, Disciplina>;
  fontes: Map<string, Fonte>;
}

export function indexConcurso(slug: string, meta: AreaMeta, data: Concurso): ConcursoIndex {
  if (!data || !Array.isArray(data.disciplinas) || !data.trilha || !data.prova) throw new Error("Concurso inválido: " + slug);
  const topicos = new Map<string, TopicoNode>();
  const disciplinas = new Map<string, Disciplina>();
  for (const d of data.disciplinas) {
    disciplinas.set(d.id, d);
    for (const m of d.modulos) for (const t of m.topicos) topicos.set(t.id, { topico: t, disciplina: d, modulo: m });
  }
  return { slug, meta, data, topicos, disciplinas, fontes: new Map(data.fontes.map(f => [f.id, f])) };
}
