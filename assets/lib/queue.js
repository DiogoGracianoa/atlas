// Fila de saída persistida no localStorage (RN11). Uma operação por linha
// remota: uma nova escrita na mesma linha substitui a anterior (coalescência).
export const QUEUE_KEY = "atlas-v3-queue";
export const TABLES = ["progress", "notes", "prefs"];

export function rowKey(table, row) {
  if (table === "progress") return "p|" + row.item_id + "|" + row.mark;
  if (table === "notes") return "n|" + row.item_id;
  return "f";
}

export function createQueue({ storage, key = QUEUE_KEY }) {
  let items = {};
  try {
    const p = JSON.parse(storage.getItem(key) || "{}");
    if (p && typeof p === "object" && !Array.isArray(p)) {
      for (const [k, op] of Object.entries(p)) {
        if (op && TABLES.includes(op.table) && op.row && typeof op.row.updated_at === "string") items[k] = op;
      }
    }
  } catch (e) { items = {}; }
  const save = () => { try { storage.setItem(key, JSON.stringify(items)); } catch (e) { /* segue em memória */ } };

  return {
    put(op) {
      const k = rowKey(op.table, op.row);
      const cur = items[k];
      if (cur && cur.row.updated_at > op.row.updated_at) return;
      items[k] = { table: op.table, row: { ...op.row } };
      save();
    },
    list: () => Object.entries(items).map(([k, op]) => ({ key: k, table: op.table, row: op.row })),
    // Remove só se a operação guardada ainda é a que foi enviada.
    ack(k, at) {
      if (items[k] && items[k].row.updated_at === at) { delete items[k]; save(); }
    },
    size: () => Object.keys(items).length
  };
}

// Resposta do supabase-js ({ error, status }) → ok | retry | drop.
// Rede (status 0), sessão (401), limite (408/429) e servidor (5xx) tentam de novo;
// os demais 4xx indicam operação inválida, que repetir não resolve.
export function classify(res) {
  if (!res || !res.error) return "ok";
  const s = res.status || 0;
  if (s === 0 || s >= 500 || s === 401 || s === 408 || s === 429) return "retry";
  return "drop";
}
