// Fila de saída persistida no localStorage (RN11). Uma operação por linha
// remota: uma nova escrita na mesma linha substitui a anterior (coalescência).
import type { QueueItem, QueueOp, StorageLike, Table } from "./types";

export const QUEUE_KEY = "atlas-v3-queue";
export const TABLES: readonly Table[] = ["progress", "notes", "prefs"];

export function rowKey(table: Table, row: { item_id?: string; mark?: string }): string {
  if (table === "progress") return "p|" + row.item_id + "|" + row.mark;
  if (table === "notes") return "n|" + row.item_id;
  return "f";
}

export interface Queue {
  put(op: QueueOp): void;
  list(): QueueItem[];
  ack(key: string, at: string): void;
  size(): number;
}

const isValid = (op: unknown): op is QueueOp => {
  if (!op || typeof op !== "object") return false;
  const o = op as { table?: unknown; row?: { updated_at?: unknown } };
  return TABLES.includes(o.table as Table) && !!o.row && typeof o.row.updated_at === "string";
};

export function createQueue({ storage, key = QUEUE_KEY }: { storage: StorageLike; key?: string }): Queue {
  // Map: chaves dinâmicas sem `delete obj[k]`; serializa como objeto (formato K4).
  let items = new Map<string, QueueOp>();
  try {
    const p: unknown = JSON.parse(storage.getItem(key) || "{}");
    if (p && typeof p === "object" && !Array.isArray(p)) {
      for (const [k, op] of Object.entries(p)) if (isValid(op)) items.set(k, op);
    }
  } catch { items = new Map(); }
  const save = () => { try { storage.setItem(key, JSON.stringify(Object.fromEntries(items))); } catch { /* segue em memória */ } };

  return {
    put(op) {
      const k = rowKey(op.table, op.row as { item_id?: string; mark?: string });
      const cur = items.get(k);
      if (cur && cur.row.updated_at > op.row.updated_at) return;
      items.set(k, { table: op.table, row: { ...op.row } } as QueueOp);
      save();
    },
    list: () => [...items].map(([k, op]) => ({ key: k, ...op }) as QueueItem),
    // Remove só se a operação guardada ainda é a que foi enviada.
    ack(k, at) {
      if (items.get(k)?.row.updated_at === at) { items.delete(k); save(); }
    },
    size: () => items.size,
  };
}

export interface ResultLike {
  error?: unknown;
  status?: number;
}

// Resposta do supabase-js ({ error, status }) → ok | retry | drop.
// Rede (status 0), sessão (401), limite (408/429) e servidor (5xx) tentam de novo;
// os demais 4xx indicam operação inválida, que repetir não resolve.
export function classify(res: ResultLike | null | undefined): "ok" | "retry" | "drop" {
  if (!res || !res.error) return "ok";
  const s = res.status || 0;
  if (s === 0 || s >= 500 || s === 401 || s === 408 || s === 429) return "retry";
  return "drop";
}
