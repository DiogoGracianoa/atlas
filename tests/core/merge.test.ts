// Cenários S01–S05, S11 (tombstone) e S12: regras de mescla na carga.
import { test } from "vitest";
import assert from "node:assert/strict";
import { mergeMark, mergeNote, planPull, normAt } from "../../src/core/merge";
import type { NoteRow, ProgressRow, State } from "../../src/core/types";

const fmt = (at: string) => "F(" + at.slice(11, 16) + ")";
const T = (hhmm: string) => "2026-11-04T" + hhmm + ":00.000Z";
const NOW = T("12:00");

test("normAt converte o formato do Postgres para ISO com milissegundos", () => {
  assert.equal(normAt("2026-11-04T10:05:00.123456+00:00"), "2026-11-04T10:05:00.123Z");
  assert.equal(normAt("2026-11-04 07:05:00-03"), "2026-11-04T10:05:00.000Z");
});

test("mergeMark: vence o horário mais recente", () => {
  assert.deepEqual(mergeMark({ done: true, at: T("10:00") }, { done: false, at: T("10:05") }), { take: "remote", upload: false });
  assert.deepEqual(mergeMark({ done: true, at: T("10:05") }, { done: false, at: T("10:00") }), { take: "local", upload: true });
  assert.deepEqual(mergeMark({ done: true, at: T("10:00") }, { done: true, at: T("10:00") }), { take: "same", upload: false });
  assert.deepEqual(mergeMark(undefined, { done: true, at: T("10:00") }), { take: "remote", upload: false });
  assert.deepEqual(mergeMark({ done: true, at: T("10:00") }, undefined), { take: "local", upload: true });
});

test("mergeNote: só o remoto mudou → remoto substitui sem marcador", () => {
  const base = { body: "X", at: T("09:00") };
  const r = mergeNote({ body: "X", at: T("09:00"), base }, { body: "Y", at: T("10:00") }, { now: NOW, fmt });
  assert.deepEqual(r, { entry: { body: "Y", at: T("10:00"), base: { body: "Y", at: T("10:00") } }, upload: false });
});

test("mergeNote: só o local mudou → sobe o local", () => {
  const base = { body: "X", at: T("09:00") };
  const r = mergeNote({ body: "X2", at: T("10:00"), base }, { body: "X", at: T("09:00") }, { now: NOW, fmt });
  assert.deepEqual(r, { entry: null, upload: true });
});

test("mergeNote: os dois mudaram → vence o mais recente e a outra versão é anexada", () => {
  const base = { body: "X", at: T("09:00") };
  const r = mergeNote({ body: "A", at: T("10:00"), base }, { body: "B", at: T("10:05") }, { now: NOW, fmt });
  assert.deepEqual(r, {
    entry: { body: "B\n\n— versão de outro aparelho (F(10:00)) —\nA", at: NOW, base: { body: "B", at: T("10:05") } },
    upload: true
  });
  const r2 = mergeNote({ body: "A", at: T("10:10"), base }, { body: "B", at: T("10:05") }, { now: NOW, fmt });
  assert.equal(r2.entry!.body, "A\n\n— versão de outro aparelho (F(10:05)) —\nB");
});

test("mergeNote: primeiro login com textos diferentes preserva os dois", () => {
  const r = mergeNote({ body: "local", at: T("08:00"), base: null }, { body: "remoto", at: T("09:00") }, { now: NOW, fmt });
  assert.equal(r.entry!.body, "remoto\n\n— versão de outro aparelho (F(08:00)) —\nlocal");
  assert.equal(r.upload, true);
});

test("mergeNote: textos iguais não geram marcador nem envio", () => {
  const r = mergeNote({ body: "igual", at: T("10:00"), base: null }, { body: "igual", at: T("10:05") }, { now: NOW, fmt });
  assert.deepEqual(r, { entry: { body: "igual", at: T("10:05"), base: { body: "igual", at: T("10:05") } }, upload: false });
});

test("mergeNote: nota local vazia sem base aceita o remoto", () => {
  const r = mergeNote({ body: "", at: T("11:00"), base: null }, { body: "R", at: T("09:00") }, { now: NOW, fmt });
  assert.deepEqual(r, { entry: { body: "R", at: T("09:00"), base: { body: "R", at: T("09:00") } }, upload: false });
});

test("mergeNote: sem remoto sobe o local; sem local aceita o remoto", () => {
  assert.deepEqual(mergeNote({ body: "a", at: T("10:00"), base: null }, undefined, { now: NOW, fmt }), { entry: null, upload: true });
  assert.deepEqual(mergeNote(undefined, { body: "r", at: T("10:00") }, { now: NOW, fmt }), { entry: { body: "r", at: T("10:00"), base: { body: "r", at: T("10:00") } }, upload: false });
});

test("planPull: 5 locais + 3 remotas distintas → 8 locais e 5 para subir", () => {
  const state: Pick<State, "marks" | "notes" | "lastAt"> = { marks: {}, notes: {}, lastAt: null };
  ["m1e1", "m1e2", "m1e3", "m1e4", "m1e5"].forEach(id => { state.marks["politica/" + id + ":def"] = { done: true, at: T("10:00") }; });
  const progress = ["m2e1", "m2e2", "m2e3"].map(id => ({ area: "politica", item_id: "politica/" + id, mark: "vid", done: true, updated_at: "2026-11-04T09:00:00+00:00" }));
  const plan = planPull(state, { progress, notes: [], prefs: null }, { now: NOW, fmt });
  assert.equal(plan.ops.filter(o => o.type === "mark").length, 3);
  assert.deepEqual(plan.ops[0], { type: "mark", key: "politica/m2e1:vid", value: { done: true, at: T("09:00") } });
  assert.equal(plan.uploads.length, 5);
  assert.deepEqual(plan.uploads[0], { table: "progress", row: { area: "politica", item_id: "politica/m1e1", mark: "def", done: true, updated_at: T("10:00") } });
});

test("planPull: notas e última posição", () => {
  const state = {
    marks: {},
    notes: { "politica/m1e1": { body: "local", at: T("10:00"), base: null } },
    lastAt: { route: "politica/m1e1", at: T("10:00") }
  };
  // Linhas do servidor trazem colunas além de RemoteData (ex.: area).
  const remote = {
    progress: [],
    notes: [{ area: "historia", item_id: "historia/m1e1", body: "h", updated_at: "2026-11-04T09:00:00+00:00" }],
    prefs: { last_at: "historia/m1e1", updated_at: "2026-11-04T11:00:00+00:00" }
  };
  const plan = planPull(state, remote, { now: NOW, fmt });
  assert.deepEqual(plan.ops, [
    { type: "note", key: "historia/m1e1", value: { body: "h", at: T("09:00"), base: { body: "h", at: T("09:00") } } },
    { type: "last", value: { route: "historia/m1e1", at: T("11:00") } }
  ]);
  assert.deepEqual(plan.uploads, [{ table: "notes", row: { area: "politica", item_id: "politica/m1e1", body: "local", updated_at: T("10:00") } }]);
});

test("planPull: última posição local mais nova sobe", () => {
  const state = { marks: {}, notes: {}, lastAt: { route: "politica/m2e3", at: T("11:00") } };
  const plan = planPull(state, { progress: [], notes: [], prefs: { last_at: "politica/m1e1", updated_at: "2026-11-04T10:00:00+00:00" } }, { now: NOW, fmt });
  assert.deepEqual(plan.uploads, [{ table: "prefs", row: { last_at: "politica/m2e3", updated_at: T("11:00") } }]);
});

test("planPull: depois de Zerar, linhas remotas antigas desconhecidas viram desmarcadas", () => {
  const state = { marks: {}, notes: {}, lastAt: null, resetAt: T("11:00") };
  const remote = {
    progress: [
      { area: "politica", item_id: "politica/m1e1", mark: "def", done: true, updated_at: "2026-11-04T10:00:00+00:00" },
      { area: "politica", item_id: "politica/m1e2", mark: "def", done: true, updated_at: "2026-11-04T11:30:00+00:00" }
    ],
    notes: [{ area: "politica", item_id: "politica/m1e1", body: "velha", updated_at: "2026-11-04T10:00:00+00:00" }],
    prefs: null
  };
  const plan = planPull(state, remote, { now: NOW, fmt });
  assert.deepEqual(plan.ops, [
    { type: "mark", key: "politica/m1e1:def", value: { done: false, at: T("11:00") } },
    { type: "mark", key: "politica/m1e2:def", value: { done: true, at: T("11:30") } },
    { type: "note", key: "politica/m1e1", value: { body: "", at: T("11:00"), base: null } }
  ]);
  assert.deepEqual(plan.uploads.map(u => {
    const row = u.row as Partial<ProgressRow & NoteRow>;
    return u.table + ":" + (row.mark || "") + ":" + (row.done ?? row.body);
  }), ["progress:def:false", "notes::"]);
});
