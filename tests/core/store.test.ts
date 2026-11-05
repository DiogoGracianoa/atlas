// Cenários L01, L02, L04, L05 e S11 (parte local): estado local v3.
import { test } from "vitest";
import assert from "node:assert/strict";
import { createStore, KEY, LEGACY_KEY } from "../../src/core/store";
import type { StoreEvent } from "../../src/core/types";

type BatchEvent = Extract<StoreEvent, { type: "batch" }>;

export function memoryStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string): string | null => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    dump: () => Object.fromEntries(m)
  };
}
const clock = (iso = "2026-11-04T10:00:00.000Z") => {
  let t = Date.parse(iso);
  return () => new Date(t += 1000).toISOString();
};

test("marcar grava no localStorage antes de retornar, com horário", () => {
  const storage = memoryStorage();
  const s = createStore({ storage, now: clock() });
  const events: StoreEvent[] = [];
  s.on(e => events.push(e));
  s.setMark("politica/m1e1", "def", true);
  const saved = JSON.parse(storage.getItem(KEY)!) as { marks: Record<string, unknown> };
  assert.deepEqual(saved.marks["politica/m1e1:def"], { done: true, at: "2026-11-04T10:00:01.000Z" });
  assert.equal(s.isDone("politica/m1e1", "def"), true);
  assert.deepEqual(events, [{ type: "mark", key: "politica/m1e1:def", item: "politica/m1e1", area: "politica", mark: "def", done: true, at: "2026-11-04T10:00:01.000Z" }]);
});

test("desmarcar mantém a entrada com done=false e horário novo", () => {
  const s = createStore({ storage: memoryStorage(), now: clock() });
  s.setMark("politica/m1e1", "def", true);
  s.setMark("politica/m1e1", "def", false);
  assert.deepEqual(s.state.marks["politica/m1e1:def"], { done: false, at: "2026-11-04T10:00:02.000Z" });
  assert.equal(s.isDone("politica/m1e1", "def"), false);
});

test("anotação grava texto e horário, preservando a base", () => {
  const storage = memoryStorage();
  const s = createStore({ storage, now: clock() });
  s.setNote("politica/m1e1", "abc");
  assert.deepEqual(s.state.notes["politica/m1e1"], { body: "abc", at: "2026-11-04T10:00:01.000Z", base: null });
  assert.equal(s.note("politica/m1e1"), "abc");
  assert.equal(s.note("politica/m9e9"), "");
  assert.equal((JSON.parse(storage.getItem(KEY)!) as { notes: Record<string, { body: string }> }).notes["politica/m1e1"]!.body, "abc");
});

test("preferências e totais ficam locais e não geram evento de sincronização", () => {
  const s = createStore({ storage: memoryStorage(), now: clock() });
  const events: string[] = [];
  s.on(e => events.push(e.type));
  s.setPref("size", "xl");
  s.setPref("theme", "dark");
  s.setPref("size", "gigante");
  s.setTotal("politica", 89);
  assert.equal(s.state.size, "xl");
  assert.equal(s.state.theme, "dark");
  assert.equal(s.state.totals.politica, 89);
  assert.deepEqual(events, ["pref", "pref", "local"]);
});

test("última posição gera evento próprio", () => {
  const s = createStore({ storage: memoryStorage(), now: clock() });
  const events: StoreEvent[] = [];
  s.on(e => events.push(e));
  s.setLastAt("politica/m2e3");
  assert.deepEqual(s.state.lastAt, { route: "politica/m2e3", at: "2026-11-04T10:00:01.000Z" });
  assert.equal(events[0]!.type, "last");
});

test("estado persiste entre instâncias", () => {
  const storage = memoryStorage();
  createStore({ storage, now: clock() }).setMark("politica/m1e1", "vid", true);
  const s2 = createStore({ storage, now: clock() });
  assert.equal(s2.isDone("politica/m1e1", "vid"), true);
});

test("migra a chave v2 uma vez, preservando a original", () => {
  const v2 = { done: { "m1e1:def": true, "m1of:do": true, "m1e2:vid": false }, notes: { m1e1: "nota antiga" }, at: "m2e3", size: "l", theme: "dark" };
  const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify(v2) });
  const s = createStore({ storage, now: () => "2026-11-04T12:00:00.000Z" });
  assert.deepEqual(s.state.marks, {
    "politica/m1e1:def": { done: true, at: "2026-11-04T12:00:00.000Z" },
    "politica/m1of:do": { done: true, at: "2026-11-04T12:00:00.000Z" }
  });
  assert.deepEqual(s.state.notes["politica/m1e1"], { body: "nota antiga", at: "2026-11-04T12:00:00.000Z", base: null });
  assert.deepEqual(s.state.lastAt, { route: "politica/m2e3", at: "2026-11-04T12:00:00.000Z" });
  assert.equal(s.state.size, "l");
  assert.equal(s.state.theme, "dark");
  assert.ok(storage.getItem(LEGACY_KEY), "chave v2 preservada");
  assert.ok(storage.getItem(KEY), "v3 gravado");
  // segunda carga não migra de novo
  s.setMark("politica/m1e1", "def", false);
  const s2 = createStore({ storage, now: () => "2026-11-05T00:00:00.000Z" });
  assert.equal(s2.isDone("politica/m1e1", "def"), false);
});

test("v2 corrompida é ignorada", () => {
  const s = createStore({ storage: memoryStorage({ [LEGACY_KEY]: "{oops" }), now: clock() });
  assert.deepEqual(s.state.marks, {});
});

test("v3 com campos inválidos é saneada", () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify({ v: 3, marks: { "politica/m1e1:def": { done: true, at: "x" }, "bad": 1, "politica/m1e2:def": { done: true, at: "2026-11-04T10:00:00.000Z" } }, notes: "x", size: "enorme" }) });
  const s = createStore({ storage, now: clock() });
  assert.deepEqual(Object.keys(s.state.marks), ["politica/m1e2:def"]);
  assert.deepEqual(s.state.notes, {});
  assert.equal(s.state.size, "m");
});

test("localStorage indisponível: segue em memória", () => {
  const broken = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } };
  const s = createStore({ storage: broken, now: clock() });
  s.setMark("politica/m1e1", "def", true);
  assert.equal(s.isDone("politica/m1e1", "def"), true);
});

test("zerar desmarca tudo e esvazia anotações com horário novo, em lote", () => {
  const s = createStore({ storage: memoryStorage(), now: clock() });
  s.setMark("politica/m1e1", "def", true);
  s.setMark("historia/m1e1", "book", true);
  s.setMark("politica/m1e2", "def", false);
  s.setNote("politica/m1e1", "texto");
  const events: StoreEvent[] = [];
  s.on(e => events.push(e));
  s.resetAll();
  assert.deepEqual(Object.values(s.state.marks).map(m => m.done), [false, false, false]);
  assert.equal(s.state.notes["politica/m1e1"]!.body, "");
  assert.equal(events.length, 1);
  assert.equal(events[0]!.type, "batch");
  assert.equal((events[0] as BatchEvent).ops.length, 4);
  const t = s.state.marks["politica/m1e1:def"]!.at;
  assert.ok(t > "2026-11-04T10:00:04.000Z");
});

test("applyOps aplica e emite um único lote", () => {
  const s = createStore({ storage: memoryStorage(), now: clock() });
  const events: StoreEvent[] = [];
  s.on(e => events.push(e));
  s.applyOps([
    { type: "mark", key: "politica/m1e1:def", value: { done: true, at: "2026-11-04T09:00:00.000Z" } },
    { type: "note", key: "politica/m1e1", value: { body: "n", at: "2026-11-04T09:00:00.000Z" } }
  ]);
  assert.equal(s.isDone("politica/m1e1", "def"), true);
  assert.deepEqual(s.state.notes["politica/m1e1"], { body: "n", at: "2026-11-04T09:00:00.000Z", base: null });
  assert.equal(events.length, 1);
  assert.equal((events[0] as BatchEvent).ops.length, 2);
});
