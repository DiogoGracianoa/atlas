// Backup JSON: exporta v3 (todas as áreas, com horários) e importa v2 ou v3
// por mescla — uma entrada do arquivo só substitui a local se for mais recente
// e nada ausente do arquivo é apagado (RN26).
import { LEGACY_AREA } from "./routes.js";
import { conflictBody, fmtStamp, validAt } from "./merge.js";

export const NOTE_MAX = 200000;
const MARKS = ["def", "vid", "book", "do"];
const ITEM_V3 = /^[a-z0-9-]+\/[A-Za-z0-9_-]+$/;
const ITEM_V2 = /^m\d+(e\d+|of)$/;

export function exportBackup(state, now) {
  const notes = {};
  for (const [k, n] of Object.entries(state.notes || {})) notes[k] = { body: n.body, at: n.at };
  return {
    app: "Atlas de Estudos",
    version: 3,
    exportedAt: now,
    marks: { ...(state.marks || {}) },
    notes,
    lastAt: state.lastAt || null
  };
}

const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

// Converte qualquer versão suportada em { marks:{key:{done,at}}, notes:{key:{body,at}} }.
function normalize(o, now) {
  if (!isObj(o)) throw new Error("estrutura");
  if (o.version === 3) {
    if (!isObj(o.marks) || !isObj(o.notes)) throw new Error("estrutura");
    const marks = {}, notes = {};
    for (const [k, v] of Object.entries(o.marks)) {
      const [item, mark] = k.split(":");
      if (ITEM_V3.test(item || "") && MARKS.includes(mark) && isObj(v) && typeof v.done === "boolean" && validAt(v.at)) marks[k] = { done: v.done, at: v.at };
    }
    for (const [k, v] of Object.entries(o.notes)) {
      if (ITEM_V3.test(k) && isObj(v) && typeof v.body === "string" && validAt(v.at)) notes[k] = { body: v.body, at: v.at };
    }
    return { marks, notes };
  }
  if (!isObj(o.done) || !isObj(o.notes)) throw new Error("estrutura");
  const marks = {}, notes = {};
  for (const [k, v] of Object.entries(o.done)) {
    const [id, mark] = k.split(":");
    if (v === true && ITEM_V2.test(id || "") && MARKS.includes(mark)) marks[LEGACY_AREA + "/" + k] = { done: true, at: now };
  }
  for (const [k, v] of Object.entries(o.notes)) {
    if (ITEM_V2.test(k) && typeof v === "string") notes[LEGACY_AREA + "/" + k] = { body: v, at: now };
  }
  return { marks, notes };
}

// Planeja as operações de importação sem alterar o estado.
// `isKnownItem("politica/m1e1")` permite descartar itens que não existem.
export function planImport(state, o, { now, fmt = fmtStamp, isKnownItem = () => true }) {
  const inc = normalize(o, now);
  const ops = [];
  for (const [key, v] of Object.entries(inc.marks)) {
    if (!isKnownItem(key.split(":")[0])) continue;
    const cur = (state.marks || {})[key];
    if (cur && (v.at <= cur.at || v.done === cur.done)) continue;
    if (!cur && !v.done) continue;
    ops.push({ type: "mark", key, value: { done: v.done, at: v.at } });
  }
  for (const [key, v] of Object.entries(inc.notes)) {
    if (!isKnownItem(key)) continue;
    const body = v.body.slice(0, NOTE_MAX);
    const cur = (state.notes || {})[key];
    if (!cur) {
      if (body) ops.push({ type: "note", key, value: { body, at: v.at } });
      continue;
    }
    if (v.at <= cur.at || body === cur.body) continue;
    const merged = conflictBody(body, cur.body, cur.at, fmt).slice(0, NOTE_MAX);
    ops.push({ type: "note", key, value: { body: merged, at: merged === body ? v.at : now } });
  }
  return ops;
}
