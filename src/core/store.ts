// Estado local (v3). Única porta de escrita: grava no localStorage antes de
// retornar e só depois avisa os assinantes (RN07). Cada entrada guarda o
// horário da edição, base para a mescla entre aparelhos.
import { LEGACY_AREA } from "./legacy";
import { validAt } from "./merge";
import type { IsoTime, MarkKind, NoteBase, Op, Size, State, StorageLike, StoreEvent, Theme } from "./types";

export const KEY = "atlas-v3";
export const LEGACY_KEY = "atlas-estudos-v2";
const SIZES: readonly Size[] = ["s", "m", "l", "xl"];
const THEMES: readonly Theme[] = ["auto", "light", "dark"];
const MARK_KEY = /^[a-z0-9-]+\/[A-Za-z0-9_-]+:(def|vid|book|do)$/;
const ITEM_KEY = /^[a-z0-9-]+\/[A-Za-z0-9_-]+$/;

const empty = (): State => ({ v: 3, marks: {}, notes: {}, lastAt: null, resetAt: null, totals: {}, size: "m", theme: "auto" });
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const isSize = (v: unknown): v is Size => SIZES.includes(v as Size);
const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme);

function sanitize(p: unknown): State {
  const s = empty();
  if (!isObj(p)) return s;
  if (isObj(p.marks)) for (const [k, v] of Object.entries(p.marks)) {
    if (MARK_KEY.test(k) && isObj(v) && typeof v.done === "boolean" && validAt(v.at)) s.marks[k] = { done: v.done, at: v.at };
  }
  if (isObj(p.notes)) for (const [k, v] of Object.entries(p.notes)) {
    if (!ITEM_KEY.test(k) || !isObj(v) || typeof v.body !== "string" || !validAt(v.at)) continue;
    const b = v.base;
    const base: NoteBase | null = isObj(b) && typeof b.body === "string" && validAt(b.at) ? { body: b.body, at: b.at } : null;
    s.notes[k] = { body: v.body, at: v.at, base };
  }
  const last = p.lastAt;
  if (isObj(last) && typeof last.route === "string" && ITEM_KEY.test(last.route) && validAt(last.at)) s.lastAt = { route: last.route, at: last.at };
  if (validAt(p.resetAt)) s.resetAt = p.resetAt;
  if (isObj(p.totals)) for (const [k, v] of Object.entries(p.totals)) if (Number.isInteger(v) && (v as number) > 0) s.totals[k] = v as number;
  if (isSize(p.size)) s.size = p.size;
  if (isTheme(p.theme)) s.theme = p.theme;
  return s;
}

function fromV2(p: unknown, now: IsoTime): State | null {
  const s = empty();
  if (!isObj(p)) return null;
  if (isObj(p.done)) for (const [k, v] of Object.entries(p.done)) {
    const key = LEGACY_AREA + "/" + k;
    if (v === true && MARK_KEY.test(key)) s.marks[key] = { done: true, at: now };
  }
  if (isObj(p.notes)) for (const [k, v] of Object.entries(p.notes)) {
    const key = LEGACY_AREA + "/" + k;
    if (typeof v === "string" && ITEM_KEY.test(key)) s.notes[key] = { body: v, at: now, base: null };
  }
  if (typeof p.at === "string" && ITEM_KEY.test(LEGACY_AREA + "/" + p.at)) s.lastAt = { route: LEGACY_AREA + "/" + p.at, at: now };
  if (isSize(p.size)) s.size = p.size;
  if (isTheme(p.theme)) s.theme = p.theme;
  return s;
}

const read = (storage: StorageLike, k: string): string | null => { try { return storage.getItem(k); } catch { return null; } };
const parse = (raw: string | null): unknown => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };

export interface Store {
  readonly state: State;
  on(fn: (e: StoreEvent) => void): () => void;
  isDone(item: string, mark: MarkKind): boolean;
  note(item: string): string;
  setMark(item: string, mark: MarkKind, done: boolean): void;
  setNote(item: string, body: string): void;
  setPref(name: "size" | "theme", value: string): void;
  setLastAt(route: string): void;
  setTotal(slug: string, n: number): void;
  applyOps(ops: Op[], opts?: { silent?: boolean }): void;
  resetAll(): void;
  setNoteBase(item: string, base: NoteBase): void;
}

export function createStore({ storage, now = () => new Date().toISOString() }: { storage: StorageLike; now?: () => IsoTime }): Store {
  let state: State;
  const raw = read(storage, KEY);
  if (raw) state = sanitize(parse(raw));
  else {
    state = (read(storage, LEGACY_KEY) && fromV2(parse(read(storage, LEGACY_KEY)), now())) || empty();
  }
  const subs = new Set<(e: StoreEvent) => void>();
  const save = () => { try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* segue em memória */ } };
  const emit = (e: StoreEvent) => subs.forEach(fn => { try { fn(e); } catch (err) { console.error(err); } });
  if (!raw) save();

  const splitItem = (item: string) => item.slice(0, item.indexOf("/"));

  function setMark(item: string, mark: MarkKind, done: boolean) {
    const key = item + ":" + mark;
    const at = now();
    state.marks[key] = { done: !!done, at };
    save();
    emit({ type: "mark", key, item, area: splitItem(item), mark, done: !!done, at });
  }

  function setNote(item: string, body: string) {
    const at = now();
    const prev = state.notes[item];
    state.notes[item] = { body: String(body), at, base: prev ? prev.base : null };
    save();
    emit({ type: "note", key: item, item, area: splitItem(item), body: String(body), at });
  }

  function setPref(name: "size" | "theme", value: string) {
    if (name === "size") {
      if (!isSize(value)) return;
      state.size = value;
    } else if (name === "theme") {
      if (!isTheme(value)) return;
      state.theme = value;
    } else return;
    save();
    emit({ type: "pref", name, value: value as Size | Theme });
  }

  function setLastAt(route: string) {
    if (!ITEM_KEY.test(route)) return;
    state.lastAt = { route, at: now() };
    save();
    emit({ type: "last", route, at: state.lastAt.at });
  }

  function setTotal(slug: string, n: number) {
    if (state.totals[slug] === n) return;
    state.totals[slug] = n;
    save();
    emit({ type: "local" });
  }

  // Aplica operações já decididas (importação, sincronização) num único lote.
  function applyOps(ops: Op[], { silent = false }: { silent?: boolean } = {}) {
    if (!ops.length) return;
    for (const op of ops) {
      if (op.type === "mark") state.marks[op.key] = { done: op.value.done, at: op.value.at };
      else if (op.type === "note") {
        const prev = state.notes[op.key];
        state.notes[op.key] = { body: op.value.body, at: op.value.at, base: op.value.base !== undefined ? op.value.base : (prev ? prev.base : null) };
      } else state.lastAt = { route: op.value.route, at: op.value.at };
    }
    save();
    emit({ type: "batch", ops, silent });
  }

  function resetAll() {
    const at = now();
    state.resetAt = at;
    const ops: Op[] = [];
    for (const key of Object.keys(state.marks)) ops.push({ type: "mark", key, value: { done: false, at } });
    for (const key of Object.keys(state.notes)) ops.push({ type: "note", key, value: { body: "", at } });
    applyOps(ops);
  }

  // Registra a última versão confirmada pelo servidor (sem avisar ninguém).
  function setNoteBase(item: string, base: NoteBase) {
    const n = state.notes[item];
    if (!n) return;
    n.base = { body: base.body, at: base.at };
    save();
  }

  return {
    get state() { return state; },
    on: (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
    isDone: (item, mark) => !!state.marks[item + ":" + mark]?.done,
    note: (item) => state.notes[item]?.body ?? "",
    setMark, setNote, setPref, setLastAt, setTotal, applyOps, resetAll, setNoteBase,
  };
}
