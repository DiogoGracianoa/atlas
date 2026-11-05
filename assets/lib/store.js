// Estado local (v3). Única porta de escrita: grava no localStorage antes de
// retornar e só depois avisa os assinantes (RN07). Cada entrada guarda o
// horário da edição, base para a mescla entre aparelhos.
import { LEGACY_AREA } from "./routes.js";
import { validAt } from "./merge.js";

export const KEY = "atlas-v3";
export const LEGACY_KEY = "atlas-estudos-v2";
const SIZES = ["s", "m", "l", "xl"];
const THEMES = ["auto", "light", "dark"];
const MARK_KEY = /^[a-z0-9-]+\/[A-Za-z0-9_-]+:(def|vid|book|do)$/;
const ITEM_KEY = /^[a-z0-9-]+\/[A-Za-z0-9_-]+$/;

const empty = () => ({ v: 3, marks: {}, notes: {}, lastAt: null, resetAt: null, totals: {}, size: "m", theme: "auto" });
const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);

function sanitize(p) {
  const s = empty();
  if (!isObj(p)) return s;
  if (isObj(p.marks)) for (const [k, v] of Object.entries(p.marks)) {
    if (MARK_KEY.test(k) && isObj(v) && typeof v.done === "boolean" && validAt(v.at)) s.marks[k] = { done: v.done, at: v.at };
  }
  if (isObj(p.notes)) for (const [k, v] of Object.entries(p.notes)) {
    if (!ITEM_KEY.test(k) || !isObj(v) || typeof v.body !== "string" || !validAt(v.at)) continue;
    const base = isObj(v.base) && typeof v.base.body === "string" && validAt(v.base.at) ? { body: v.base.body, at: v.base.at } : null;
    s.notes[k] = { body: v.body, at: v.at, base };
  }
  if (isObj(p.lastAt) && ITEM_KEY.test(p.lastAt.route || "") && validAt(p.lastAt.at)) s.lastAt = { route: p.lastAt.route, at: p.lastAt.at };
  if (validAt(p.resetAt)) s.resetAt = p.resetAt;
  if (isObj(p.totals)) for (const [k, v] of Object.entries(p.totals)) if (Number.isInteger(v) && v > 0) s.totals[k] = v;
  if (SIZES.includes(p.size)) s.size = p.size;
  if (THEMES.includes(p.theme)) s.theme = p.theme;
  return s;
}

function fromV2(p, now) {
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
  if (SIZES.includes(p.size)) s.size = p.size;
  if (THEMES.includes(p.theme)) s.theme = p.theme;
  return s;
}

const read = (storage, k) => { try { return storage.getItem(k); } catch (e) { return null; } };
const parse = (raw) => { try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };

export function createStore({ storage, now = () => new Date().toISOString() }) {
  let state;
  const raw = read(storage, KEY);
  if (raw) state = sanitize(parse(raw));
  else {
    state = (read(storage, LEGACY_KEY) && fromV2(parse(read(storage, LEGACY_KEY)), now())) || empty();
  }
  const subs = new Set();
  const save = () => { try { storage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* segue em memória */ } };
  const emit = (e) => subs.forEach(fn => { try { fn(e); } catch (err) { console.error(err); } });
  if (!raw) save();

  const splitItem = (item) => item.slice(0, item.indexOf("/"));

  function setMark(item, mark, done) {
    const key = item + ":" + mark;
    const at = now();
    state.marks[key] = { done: !!done, at };
    save();
    emit({ type: "mark", key, item, area: splitItem(item), mark, done: !!done, at });
  }

  function setNote(item, body) {
    const at = now();
    const prev = state.notes[item];
    state.notes[item] = { body: String(body), at, base: prev ? prev.base : null };
    save();
    emit({ type: "note", key: item, item, area: splitItem(item), body: String(body), at });
  }

  function setPref(name, value) {
    if (name === "size" && !SIZES.includes(value)) return;
    if (name === "theme" && !THEMES.includes(value)) return;
    if (name !== "size" && name !== "theme") return;
    state[name] = value;
    save();
    emit({ type: "pref", name, value });
  }

  function setLastAt(route) {
    if (!ITEM_KEY.test(route)) return;
    state.lastAt = { route, at: now() };
    save();
    emit({ type: "last", route, at: state.lastAt.at });
  }

  function setTotal(slug, n) {
    if (state.totals[slug] === n) return;
    state.totals[slug] = n;
    save();
    emit({ type: "local" });
  }

  // Aplica operações já decididas (importação, sincronização) num único lote.
  function applyOps(ops, { silent = false } = {}) {
    if (!ops.length) return;
    for (const op of ops) {
      if (op.type === "mark") state.marks[op.key] = { done: op.value.done, at: op.value.at };
      else if (op.type === "note") {
        const prev = state.notes[op.key];
        state.notes[op.key] = { body: op.value.body, at: op.value.at, base: op.value.base !== undefined ? op.value.base : (prev ? prev.base : null) };
      } else if (op.type === "last") state.lastAt = { route: op.value.route, at: op.value.at };
    }
    save();
    emit({ type: "batch", ops, silent });
  }

  function resetAll() {
    const at = now();
    state.resetAt = at;
    const ops = [];
    for (const key of Object.keys(state.marks)) ops.push({ type: "mark", key, value: { done: false, at } });
    for (const key of Object.keys(state.notes)) ops.push({ type: "note", key, value: { body: "", at } });
    applyOps(ops);
  }

  // Registra a última versão confirmada pelo servidor (sem avisar ninguém).
  function setNoteBase(item, base) {
    const n = state.notes[item];
    if (!n) return;
    n.base = { body: base.body, at: base.at };
    save();
  }

  return {
    get state() { return state; },
    on: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    isDone: (item, mark) => !!(state.marks[item + ":" + mark] && state.marks[item + ":" + mark].done),
    note: (item) => (state.notes[item] ? state.notes[item].body : ""),
    setMark, setNote, setPref, setLastAt, setTotal, applyOps, resetAll, setNoteBase
  };
}
