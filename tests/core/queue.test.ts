// Cenários S06, S07, S10 (parte da fila): persistência, coalescência, confirmação.
import { test } from "vitest";
import assert from "node:assert/strict";
import { createQueue, QUEUE_KEY, classify, rowKey } from "../../src/core/queue";
import type { NoteRow, ProgressRow, QueueOp, StorageLike } from "../../src/core/types";

function memoryStorage(): StorageLike & { removeItem(k: string): void } {
  const m = new Map<string, string>();
  return { getItem: k => (m.has(k) ? m.get(k)! : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
const mark = (id: string, done: boolean, at: string): QueueOp => ({ table: "progress", row: { area: "politica", item_id: "politica/" + id, mark: "def", done, updated_at: at } });
const note = (id: string, body: string, at: string): QueueOp => ({ table: "notes", row: { area: "politica", item_id: "politica/" + id, body, updated_at: at } });

test("fila persiste no localStorage e sobrevive a nova instância", () => {
  const storage = memoryStorage();
  const q = createQueue({ storage });
  q.put(mark("m1e1", true, "2026-11-04T10:00:00.000Z"));
  q.put(note("m1e1", "a", "2026-11-04T10:00:01.000Z"));
  q.put({ table: "prefs", row: { last_at: "politica/m1e1", updated_at: "2026-11-04T10:00:02.000Z" } });
  assert.equal(q.size(), 3);
  assert.ok(JSON.parse(storage.getItem(QUEUE_KEY)!));
  const q2 = createQueue({ storage });
  assert.deepEqual(q2.list().map(i => i.key), ["p|politica/m1e1|def", "n|politica/m1e1", "f"]);
});

test("coalesce por chave: fica só a operação mais recente", () => {
  const q = createQueue({ storage: memoryStorage() });
  q.put(note("m1e1", "a", "2026-11-04T10:00:00.000Z"));
  q.put(note("m1e1", "ab", "2026-11-04T10:00:01.000Z"));
  q.put(note("m1e1", "velho", "2026-11-04T09:00:00.000Z"));
  assert.equal(q.size(), 1);
  assert.equal((q.list()[0]!.row as NoteRow).body, "ab");
});

test("ack só remove se a operação não foi substituída enquanto subia", () => {
  const q = createQueue({ storage: memoryStorage() });
  q.put(mark("m1e1", true, "2026-11-04T10:00:00.000Z"));
  const sent = q.list()[0]!;
  q.put(mark("m1e1", false, "2026-11-04T10:00:05.000Z"));
  q.ack(sent.key, sent.row.updated_at);
  assert.equal(q.size(), 1);
  assert.equal((q.list()[0]!.row as ProgressRow).done, false);
  q.ack(sent.key, "2026-11-04T10:00:05.000Z");
  assert.equal(q.size(), 0);
});

test("fila corrompida no armazenamento começa vazia", () => {
  const storage = memoryStorage();
  storage.setItem(QUEUE_KEY, "{oops");
  assert.equal(createQueue({ storage }).size(), 0);
});

test("rowKey identifica linhas devolvidas pelo servidor", () => {
  assert.equal(rowKey("progress", { item_id: "politica/m1e1", mark: "vid" }), "p|politica/m1e1|vid");
  assert.equal(rowKey("notes", { item_id: "politica/m1e1" }), "n|politica/m1e1");
  assert.equal(rowKey("prefs", {}), "f");
});

test("classify separa sucesso, nova tentativa e descarte", () => {
  assert.equal(classify({ error: null, status: 201 }), "ok");
  for (const status of [0, 401, 408, 429, 500, 503]) assert.equal(classify({ error: { message: "x" }, status }), "retry", String(status));
  for (const status of [400, 403, 404, 409, 422]) assert.equal(classify({ error: { message: "x" }, status }), "drop", String(status));
  assert.equal(classify({ error: { message: "TypeError: Failed to fetch" } }), "retry");
});
