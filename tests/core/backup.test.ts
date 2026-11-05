// Cenários B01–B04: exportar v3, importar v2/v3 por mescla.
import { test } from "vitest";
import assert from "node:assert/strict";
import { exportBackup, planImport } from "../../src/core/backup";
import { conflictBody } from "../../src/core/merge";
import type { Op } from "../../src/core/types";

type MarkOp = Extract<Op, { type: "mark" }>;
type NoteOp = Extract<Op, { type: "note" }>;

const fmt = () => "04/11/2026 10:00";
const NOW = "2026-11-04T15:00:00.000Z";

const state = () => ({
  marks: {
    "politica/m1e1:def": { done: true, at: "2026-11-04T10:00:00.000Z" },
    "historia/m1e1:vid": { done: false, at: "2026-11-04T11:00:00.000Z" }
  },
  notes: {
    "politica/m1e1": { body: "A", at: "2026-11-04T10:00:00.000Z", base: null },
    "historia/m2of": { body: "", at: "2026-11-04T10:00:00.000Z", base: null }
  },
  lastAt: { route: "politica/m1e1", at: "2026-11-04T10:00:00.000Z" }
});

test("exporta v3 com todas as áreas e horários, sem base", () => {
  const out = exportBackup(state(), NOW);
  assert.equal(out.app, "Atlas de Estudos");
  assert.equal(out.version, 3);
  assert.equal(out.exportedAt, NOW);
  assert.deepEqual(out.marks, state().marks);
  assert.deepEqual(out.notes, {
    "politica/m1e1": { body: "A", at: "2026-11-04T10:00:00.000Z" },
    "historia/m2of": { body: "", at: "2026-11-04T10:00:00.000Z" }
  });
  assert.equal(out.lastAt!.route, "politica/m1e1");
});

test("v2: mescla marcações, prefixa politica/ e usa o horário da importação", () => {
  const v2 = { app: "Atlas de Estudos", version: 2, done: { "m1e2:def": true, "m1e1:def": true, "m1e3:vid": false }, notes: {}, at: "m1e2" };
  const ops = planImport(state(), v2, { now: NOW, fmt });
  assert.deepEqual(ops, [{ type: "mark", key: "politica/m1e2:def", value: { done: true, at: NOW } }]);
});

test("v2: chaves fora do formato ou desconhecidas são ignoradas", () => {
  const v2 = { done: { "m1e2:def": true, "x:def": true, "m1e2:zzz": true, "m1e9:def": true }, notes: { "../x": "n" } };
  const ops = planImport({ marks: {}, notes: {} }, v2, { now: NOW, fmt, isKnownItem: (k) => k !== "politica/m1e9" });
  assert.deepEqual(ops.map(o => (o as MarkOp).key), ["politica/m1e2:def"]);
});

test("v3: só substitui o que for mais recente; nada ausente é apagado", () => {
  const v3 = {
    version: 3,
    marks: {
      "politica/m1e1:def": { done: false, at: "2026-11-04T09:00:00.000Z" },
      "historia/m1e1:vid": { done: true, at: "2026-11-04T12:00:00.000Z" },
      "historia/m3e1:def": { done: true, at: "2026-11-01T00:00:00.000Z" },
      "historia/m3e2:def": { done: true, at: "data ruim" }
    },
    notes: {}
  };
  const ops = planImport(state(), v3, { now: NOW, fmt });
  assert.deepEqual(ops, [
    { type: "mark", key: "historia/m1e1:vid", value: { done: true, at: "2026-11-04T12:00:00.000Z" } },
    { type: "mark", key: "historia/m3e1:def", value: { done: true, at: "2026-11-01T00:00:00.000Z" } }
  ]);
});

test("v2: anotação importada vence e a local divergente é anexada", () => {
  const ops = planImport(state(), { done: {}, notes: { m1e1: "B", m1e2: "nova" } }, { now: NOW, fmt });
  assert.deepEqual(ops, [
    { type: "note", key: "politica/m1e1", value: { body: conflictBody("B", "A", "2026-11-04T10:00:00.000Z", fmt), at: NOW } },
    { type: "note", key: "politica/m1e2", value: { body: "nova", at: NOW } }
  ]);
  assert.equal((ops[0] as NoteOp).value.body, "B\n\n— versão de outro aparelho (04/11/2026 10:00) —\nA");
});

test("anotação igual ou mais antiga não gera operação", () => {
  const v3 = { version: 3, marks: {}, notes: { "politica/m1e1": { body: "Z", at: "2026-11-04T09:00:00.000Z" } } };
  assert.deepEqual(planImport(state(), v3, { now: NOW, fmt }), []);
  assert.deepEqual(planImport(state(), { done: {}, notes: { m1e1: "A" } }, { now: NOW, fmt }), []);
});

test("anotação acima de 200 000 caracteres é cortada", () => {
  const ops = planImport({ marks: {}, notes: {} }, { done: {}, notes: { m1e1: "x".repeat(200005) } }, { now: NOW, fmt });
  assert.equal((ops[0] as NoteOp).value.body.length, 200000);
});

test("arquivo sem estrutura reconhecida é recusado", () => {
  for (const bad of [null, 1, {}, { done: [], notes: {} }, { version: 3, marks: {} }, { done: {}, notes: "x" }]) {
    assert.throws(() => planImport(state(), bad, { now: NOW, fmt }), /estrutura/);
  }
});

test("conflictBody: lados vazios não geram marcador", () => {
  assert.equal(conflictBody("B", "", "2026-11-04T10:00:00.000Z", fmt), "B");
  assert.equal(conflictBody("", "A", "2026-11-04T10:00:00.000Z", fmt), "— versão de outro aparelho (04/11/2026 10:00) —\nA");
  assert.equal(conflictBody("A", "A", "2026-11-04T10:00:00.000Z", fmt), "A");
});
