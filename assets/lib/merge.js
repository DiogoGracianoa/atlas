// Regras de mescla entre versões de uma mesma entrada.
// Horários são ISO 8601 UTC; comparação lexicográfica equivale à cronológica.

export const validAt = (at) => typeof at === "string" && !Number.isNaN(Date.parse(at));

const pad = (n) => String(n).padStart(2, "0");
export function fmtStamp(at) {
  const d = new Date(at);
  return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// Texto vencedor seguido da versão perdedora, com marcador datado (RN31).
export function conflictBody(winner, loser, loserAt, fmt = fmtStamp) {
  winner = winner || "";
  loser = loser || "";
  if (!loser || loser === winner) return winner;
  const marker = "— versão de outro aparelho (" + fmt(loserAt) + ") —\n" + loser;
  return winner ? winner + "\n\n" + marker : marker;
}

// Horário vindo do Postgres ("2026-11-04T10:05:00.123456+00:00") no mesmo
// formato do aparelho ("2026-11-04T10:05:00.123Z"), para comparar como texto.
export const normAt = (at) => new Date(at).toISOString();

// Marcação: vence o horário mais recente; empate com valor diferente fica com o remoto.
export function mergeMark(local, remote) {
  if (!remote) return local ? { take: "local", upload: true } : { take: "none", upload: false };
  if (!local) return { take: "remote", upload: false };
  if (remote.at > local.at) return { take: "remote", upload: false };
  if (local.at > remote.at) return { take: "local", upload: true };
  return remote.done === local.done ? { take: "same", upload: false } : { take: "remote", upload: false };
}

// Anotação (RN10 + RN31). `local.base` é o último texto confirmado pelo
// servidor; com ele dá para saber se cada lado mudou desde a última sincronização.
// Retorna `entry` (novo valor local, com base) ou null, e se é preciso subir.
export function mergeNote(local, remote, { now, fmt = fmtStamp }) {
  if (!remote) return { entry: null, upload: !!local };
  const rb = { body: remote.body, at: remote.at };
  const take = () => ({ entry: { body: remote.body, at: remote.at, base: rb }, upload: false });
  if (!local) return take();
  if (local.body === remote.body) {
    return { entry: { body: local.body, at: local.at > remote.at ? local.at : remote.at, base: rb }, upload: local.at > remote.at };
  }
  const base = local.base;
  if (!base && local.body === "") return take();
  const localDirty = !base || local.body !== base.body;
  const remoteChanged = !base || base.at !== remote.at;
  if (!localDirty) return take();
  if (!remoteChanged) return { entry: null, upload: true };
  const localWins = local.at > remote.at;
  const body = localWins
    ? conflictBody(local.body, remote.body, remote.at, fmt)
    : conflictBody(remote.body, local.body, local.at, fmt);
  return { entry: { body, at: now, base: rb }, upload: true };
}

const sameNote = (a, b) => !!a && a.body === b.body && a.at === b.at &&
  (a.base ? !!b.base && a.base.body === b.base.body && a.base.at === b.base.at : !b.base);

const areaOf = (item) => item.slice(0, item.indexOf("/"));
export const markRow = (key, v) => {
  const i = key.lastIndexOf(":");
  const item = key.slice(0, i);
  return { area: areaOf(item), item_id: item, mark: key.slice(i + 1), done: v.done, updated_at: v.at };
};
export const noteRow = (item, v) => ({ area: areaOf(item), item_id: item, body: v.body, updated_at: v.at });
export const prefsRow = (v) => ({ last_at: v.route, updated_at: v.at });

// Compara o estado local com as linhas do servidor e decide o que aplicar
// localmente (ops) e o que subir (uploads). `state.resetAt` marca um Zerar:
// linha remota desconhecida e anterior a ele conta como desmarcada.
export function planPull(state, { progress = [], notes = [], prefs = null }, { now, fmt = fmtStamp }) {
  const ops = [];
  const uploads = [];
  const resetAt = state.resetAt || null;
  const lm = state.marks || {}, ln = state.notes || {};

  const rm = {};
  for (const r of progress || []) rm[r.item_id + ":" + r.mark] = { done: !!r.done, at: normAt(r.updated_at) };
  const markKeys = [...new Set([...Object.keys(rm), ...Object.keys(lm)])];
  for (const key of markKeys) {
    const local = lm[key], remote = rm[key];
    if (!local && remote && resetAt && remote.at < resetAt) {
      if (remote.done) {
        const v = { done: false, at: resetAt };
        ops.push({ type: "mark", key, value: v });
        uploads.push({ table: "progress", row: markRow(key, v) });
      } else ops.push({ type: "mark", key, value: remote });
      continue;
    }
    const d = mergeMark(local, remote);
    if (d.take === "remote") ops.push({ type: "mark", key, value: remote });
    if (d.upload) uploads.push({ table: "progress", row: markRow(key, local) });
  }

  const rn = {};
  for (const r of notes || []) rn[r.item_id] = { body: r.body || "", at: normAt(r.updated_at) };
  const noteKeys = [...new Set([...Object.keys(rn), ...Object.keys(ln)])];
  for (const key of noteKeys) {
    const local = ln[key], remote = rn[key];
    if (!local && remote && resetAt && remote.at < resetAt) {
      if (remote.body) {
        const v = { body: "", at: resetAt, base: null };
        ops.push({ type: "note", key, value: v });
        uploads.push({ table: "notes", row: noteRow(key, v) });
      } else ops.push({ type: "note", key, value: { ...remote, base: { ...remote } } });
      continue;
    }
    const d = mergeNote(local, remote, { now, fmt });
    if (d.entry && !sameNote(local, d.entry)) ops.push({ type: "note", key, value: d.entry });
    if (d.upload) uploads.push({ table: "notes", row: noteRow(key, d.entry || local) });
  }

  const ll = state.lastAt || null;
  const rl = prefs && prefs.last_at ? { route: prefs.last_at, at: normAt(prefs.updated_at) } : null;
  if (rl && (!ll || rl.at > ll.at)) ops.push({ type: "last", value: rl });
  else if (ll && (!rl || ll.at > rl.at)) uploads.push({ table: "prefs", row: prefsRow(ll) });

  return { ops, uploads };
}
