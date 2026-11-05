// Funções puras do atlas usadas pelas telas: rótulos, progresso, busca,
// prompt do tutor e cores de tradição.
import type { AreaIndex, AreaMeta, AreaStats, ItemNode, Module, State, StepNode } from "../../core/types";

export const itemName = (n: ItemNode): string => (n.kind === "workshop" ? "Oficina do módulo " + n.mod.number : n.title);
export const itemPath = (key: string): string => "/atlas/" + key;

export const isDone = (state: State, key: string, mark: string): boolean => !!state.marks[key + ":" + mark]?.done;

export function doneCount(a: AreaIndex, state: State, n: ItemNode): number {
  return a.marksOf(n).filter(mk => isDone(state, n.key, mk.k)).length;
}

export function moduleNodes(a: AreaIndex, m: Module): ItemNode[] {
  return [...m.steps.map(s => a.byId[s.id]), a.byId[m.workshop.id]].filter((n): n is ItemNode => !!n);
}

export function moduleProgress(a: AreaIndex, state: State, m: Module): { done: number; total: number } {
  let done = 0, total = 0;
  for (const n of moduleNodes(a, m)) { total += a.marksOf(n).length; done += doneCount(a, state, n); }
  return { done, total };
}

export function areaMarks(a: AreaIndex, state: State): { done: number; total: number } {
  const done = a.allMarks.filter(k => state.marks[k]?.done).length;
  return { done, total: a.allMarks.length };
}

export const fillTemplate = (s: string | undefined, stats: AreaStats): string =>
  String(s || "").replace(/\{(temas|modulos|livros|videos)\}/g, (_, k: keyof AreaStats) => String(stats[k]));

/** Texto pesquisável de um item (mesmos campos do app antigo). */
export function haystack(n: ItemNode): string {
  const parts = n.kind === "step"
    ? [n.title, n.tagline, n.definition.join(" "), n.concepts.map(c => c.t + " " + c.d).join(" "),
      n.book ? n.book.title + " " + n.book.author : "", (n.videos || []).map(v => v.title).join(" ")]
    : [n.title, n.exercise, n.brief];
  return parts.join(" ").toLowerCase();
}

/** Módulos com itens que casam com a busca (todos, sem busca). */
export function searchModules(a: AreaIndex, q: string): { mod: Module; items: ItemNode[] }[] {
  const query = q.trim().toLowerCase();
  const out: { mod: Module; items: ItemNode[] }[] = [];
  for (const m of a.data.modules) {
    const nodes = moduleNodes(a, m);
    if (!query) { out.push({ mod: m, items: nodes }); continue; }
    const hits = nodes.filter(n => haystack(n).includes(query));
    if (hits.length) out.push({ mod: m, items: hits });
    else if (m.name.toLowerCase().includes(query)) out.push({ mod: m, items: nodes });
  }
  return out;
}

/* ---------- cores de tradição (vêm do manifesto) ---------- */

export const tradVar = (area: string, trad: string) => `--trad-${area}-${trad}`;

export function tradition(a: AreaIndex, key: string): { nome: string; color: string } {
  const t = a.meta.tradicoes || {};
  const k = t[key] ? key : Object.keys(t)[0] || "";
  return { nome: t[k]?.nome ?? "", color: `var(${tradVar(a.slug, k)})` };
}

export function itemTradition(a: AreaIndex, n: ItemNode) {
  const key = n.kind === "workshop" ? n.mod.steps[0]?.tradition ?? "" : n.tradition;
  return tradition(a, key);
}

/** CSS com as cores de tradição da área nos temas claro e escuro. */
export function traditionCss(meta: AreaMeta): string {
  const t = Object.entries(meta.tradicoes || {});
  const lightVars = t.map(([k, v]) => `${tradVar(meta.slug, k)}: ${v.cor};`).join(" ");
  const darkVars = t.map(([k, v]) => `${tradVar(meta.slug, k)}: ${v.corEscura};`).join(" ");
  return `:root { ${lightVars} }\n@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${darkVars} } }\n:root[data-theme="dark"] { ${darkVars} }`;
}

/* ---------- tutor por IA (mesmo prompt do app antigo) ---------- */

const RULES = "\n\nRegras: (1) faça uma pergunta por vez e espere minha resposta; (2) apresente cada argumento e cada crítica em sua versão mais forte, distinguindo o que é fato, o que é interpretação e o que é juízo de valor; (3) não invente citações, páginas, números nem o conteúdo específico de um vídeo que você não acessou; (4) depois das minhas respostas, dê retorno construtivo e aponte lacunas; (5) ao final, peça uma síntese escrita minha e faça três perguntas de verificação. Comece agora com a primeira pergunta.";

export function promptFor(a: AreaIndex, n: ItemNode): string {
  const base = a.meta.promptBase || "";
  if (n.kind === "workshop") {
    return base + "MÓDULO: " + n.mod.name + "\nETAPA: oficina de síntese do módulo.\nEXERCÍCIO: " + n.exercise +
      "\n\nATIVIDADE: conduza esta oficina comigo de forma interativa, uma questão por vez, pedindo justificativas e ajudando a organizar a síntese final." + RULES;
  }
  const s: StepNode = n;
  const conc = (s.concepts || []).map(c => c.t).join(", ");
  const trads = a.meta.tradicoes || {};
  return base + "MÓDULO: " + s.mod.name + "\nTEMA: " + s.title + " — " + s.tagline +
    "\nTRADIÇÃO: " + (trads[s.tradition] ? trads[s.tradition]?.nome : "") +
    "\nCONCEITOS QUE ESTUDEI: " + conc +
    (s.book ? "\nLIVRO: " + s.book.title + ", de " + s.book.author : "") +
    "\n\nATIVIDADE: antes de explicar qualquer coisa, pergunte o que eu já entendi do tema. Depois faça três perguntas graduais sobre os conceitos acima, apresente um caso concreto para eu analisar e só então corrija. Em seguida, apresente a objeção mais forte ao que eu disse." + RULES;
}

/** Rótulo de um item a partir da chave, sem precisar da área carregada. */
export function labelFromId(id: string): string {
  const m = /^m(\d+)(?:e(\d+)|of)$/.exec(id);
  if (!m) return id;
  return m[2] ? "Módulo " + m[1] + ", tema " + m[2] : "Oficina do módulo " + m[1];
}
