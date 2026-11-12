// Backup JSON: exporta v3 (todas as áreas, com horários) e importa v2 ou v3
// por mescla — uma entrada do arquivo só substitui a local se for mais recente
// e nada ausente do arquivo é apagado (RN26).
import { LEGACY_AREA } from "./legacy";
import { conflictBody, fmtStamp, validAt, type FormatTime } from "./merge";
import type { IsoTime, LastAt, MarkEntry, Op, State } from "./types";
import { registroValido, type Registro } from "./registros";

export const NOTE_MAX = 200000;
const MARKS = ["def", "vid", "book", "do"];
const ITEM_V3 = /^[a-z0-9-]+\/[A-Za-z0-9_-]+$/;
const ITEM_V2 = /^m\d+(e\d+|of)$/;

export interface BackupV3 {
  app: string;
  version: 3;
  exportedAt: IsoTime;
  marks: Record<string, MarkEntry>;
  notes: Record<string, { body: string; at: IsoTime }>;
  lastAt: LastAt | null;
}

/** v4 (KB4): v3 + registros do preparatório, por "tipo:id". */
export interface BackupV4 extends Omit<BackupV3, "version"> {
  version: 4;
  registros: Record<string, { area: string; corpo: Record<string, unknown>; at: IsoTime }>;
}

export function exportBackup(state: Partial<State>, now: IsoTime): BackupV3;
export function exportBackup(state: Partial<State>, now: IsoTime, registros: Registro[]): BackupV4;
export function exportBackup(state: Partial<State>, now: IsoTime, registros?: Registro[]): BackupV3 | BackupV4 {
  const notes: BackupV3["notes"] = {};
  for (const [k, n] of Object.entries(state.notes || {})) notes[k] = { body: n.body, at: n.at };
  const v3: BackupV3 = {
    app: "Letrume",
    version: 3,
    exportedAt: now,
    marks: { ...(state.marks || {}) },
    notes,
    lastAt: state.lastAt || null,
  };
  if (!registros) return v3;
  const regs: BackupV4["registros"] = {};
  for (const r of registros) regs[r.tipo + ":" + r.id] = { area: r.area, corpo: r.corpo, at: r.at };
  return { ...v3, version: 4, registros: regs };
}

/** Registros válidos de um backup v4 (vazio nas versões anteriores). */
export function planImportRegistros(o: unknown): Registro[] {
  if (!isObj(o) || o.version !== 4 || !isObj(o.registros)) return [];
  const out: Registro[] = [];
  for (const [k, v] of Object.entries(o.registros)) {
    const i = k.indexOf(":");
    if (i < 1 || !isObj(v)) continue;
    const r = { tipo: k.slice(0, i), id: k.slice(i + 1), area: v.area, corpo: v.corpo, at: v.at };
    if (registroValido(r)) out.push(r);
  }
  return out;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

interface Normalized {
  marks: Record<string, MarkEntry>;
  notes: Record<string, { body: string; at: IsoTime }>;
}

// Converte qualquer versão suportada em { marks:{key:{done,at}}, notes:{key:{body,at}} }.
function normalize(o: unknown, now: IsoTime): Normalized {
  if (!isObj(o)) throw new Error("estrutura");
  const marks: Normalized["marks"] = {}, notes: Normalized["notes"] = {};
  if (o.version === 3 || o.version === 4) {
    if (!isObj(o.marks) || !isObj(o.notes)) throw new Error("estrutura");
    for (const [k, v] of Object.entries(o.marks)) {
      const [item, mark] = k.split(":");
      if (ITEM_V3.test(item || "") && MARKS.includes(mark || "") && isObj(v) && typeof v.done === "boolean" && validAt(v.at)) marks[k] = { done: v.done, at: v.at };
    }
    for (const [k, v] of Object.entries(o.notes)) {
      if (ITEM_V3.test(k) && isObj(v) && typeof v.body === "string" && validAt(v.at)) notes[k] = { body: v.body, at: v.at };
    }
    return { marks, notes };
  }
  if (!isObj(o.done) || !isObj(o.notes)) throw new Error("estrutura");
  for (const [k, v] of Object.entries(o.done)) {
    const [id, mark] = k.split(":");
    if (v === true && ITEM_V2.test(id || "") && MARKS.includes(mark || "")) marks[LEGACY_AREA + "/" + k] = { done: true, at: now };
  }
  for (const [k, v] of Object.entries(o.notes)) {
    if (ITEM_V2.test(k) && typeof v === "string") notes[LEGACY_AREA + "/" + k] = { body: v, at: now };
  }
  return { marks, notes };
}

// Planeja as operações de importação sem alterar o estado.
// `isKnownItem("politica/m1e1")` permite descartar itens que não existem.
export function planImport(
  state: Partial<State>,
  o: unknown,
  { now, fmt = fmtStamp, isKnownItem = () => true }: { now: IsoTime; fmt?: FormatTime; isKnownItem?: (item: string) => boolean },
): Op[] {
  const inc = normalize(o, now);
  const ops: Op[] = [];
  for (const [key, v] of Object.entries(inc.marks)) {
    if (!isKnownItem(key.split(":")[0] || "")) continue;
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
