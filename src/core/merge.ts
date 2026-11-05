// Regras de mescla entre versões de uma mesma entrada.
// Horários são ISO 8601 UTC; comparação lexicográfica equivale à cronológica.
import type { IsoTime, MarkEntry, NoteBase, NoteEntry, NoteRow, Op, PrefsRow, ProgressRow, LastAt, QueueOp, State } from "./types";

export type FormatTime = (at: IsoTime) => string;

export const validAt = (at: unknown): at is string => typeof at === "string" && !Number.isNaN(Date.parse(at));

const pad = (n: number) => String(n).padStart(2, "0");
export function fmtStamp(at: IsoTime): string {
  const d = new Date(at);
  return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// Texto vencedor seguido da versão perdedora, com marcador datado (RN31).
export function conflictBody(winner: string | null | undefined, loser: string | null | undefined, loserAt: IsoTime, fmt: FormatTime = fmtStamp): string {
  const w = winner || "";
  const l = loser || "";
  if (!l || l === w) return w;
  const marker = "— versão de outro aparelho (" + fmt(loserAt) + ") —\n" + l;
  return w ? w + "\n\n" + marker : marker;
}

// Horário vindo do Postgres ("2026-11-04T10:05:00.123456+00:00") no mesmo
// formato do aparelho ("2026-11-04T10:05:00.123Z"), para comparar como texto.
export const normAt = (at: string): IsoTime => new Date(at).toISOString();

export type MarkDecision = { take: "local" | "remote" | "same" | "none"; upload: boolean };

// Marcação: vence o horário mais recente; empate com valor diferente fica com o remoto.
export function mergeMark(local: MarkEntry | undefined | null, remote: MarkEntry | undefined | null): MarkDecision {
  if (!remote) return local ? { take: "local", upload: true } : { take: "none", upload: false };
  if (!local) return { take: "remote", upload: false };
  if (remote.at > local.at) return { take: "remote", upload: false };
  if (local.at > remote.at) return { take: "local", upload: true };
  return remote.done === local.done ? { take: "same", upload: false } : { take: "remote", upload: false };
}

export interface RemoteNote {
  body: string;
  at: IsoTime;
}

// Anotação (RN10 + RN31). `local.base` é o último texto confirmado pelo
// servidor; com ele dá para saber se cada lado mudou desde a última sincronização.
// Retorna `entry` (novo valor local, com base) ou null, e se é preciso subir.
export function mergeNote(
  local: NoteEntry | undefined | null,
  remote: RemoteNote | undefined | null,
  { now, fmt = fmtStamp }: { now: IsoTime; fmt?: FormatTime },
): { entry: NoteEntry | null; upload: boolean } {
  if (!remote) return { entry: null, upload: !!local };
  const rb: NoteBase = { body: remote.body, at: remote.at };
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

const sameNote = (a: NoteEntry | undefined, b: NoteEntry): boolean =>
  !!a && a.body === b.body && a.at === b.at &&
  (a.base ? !!b.base && a.base.body === b.base.body && a.base.at === b.base.at : !b.base);

const areaOf = (item: string) => item.slice(0, item.indexOf("/"));

export const markRow = (key: string, v: MarkEntry): ProgressRow => {
  const i = key.lastIndexOf(":");
  const item = key.slice(0, i);
  return { area: areaOf(item), item_id: item, mark: key.slice(i + 1), done: v.done, updated_at: v.at };
};
export const noteRow = (item: string, v: { body: string; at: IsoTime }): NoteRow =>
  ({ area: areaOf(item), item_id: item, body: v.body, updated_at: v.at });
export const prefsRow = (v: LastAt): PrefsRow => ({ last_at: v.route, updated_at: v.at });

/** Linhas como chegam do servidor (com `user_id` e horário do Postgres). */
export interface RemoteData {
  progress?: { area?: string; item_id: string; mark: string; done: boolean; updated_at: string }[] | null;
  notes?: { area?: string; item_id: string; body: string | null; updated_at: string }[] | null;
  prefs?: { last_at: string | null; updated_at: string } | null;
}

// Compara o estado local com as linhas do servidor e decide o que aplicar
// localmente (ops) e o que subir (uploads). `state.resetAt` marca um Zerar:
// linha remota desconhecida e anterior a ele conta como desmarcada.
export function planPull(
  state: Pick<State, "marks" | "notes" | "lastAt" | "resetAt"> | Partial<State>,
  { progress = [], notes = [], prefs = null }: RemoteData,
  { now, fmt = fmtStamp }: { now: IsoTime; fmt?: FormatTime },
): { ops: Op[]; uploads: QueueOp[] } {
  const ops: Op[] = [];
  const uploads: QueueOp[] = [];
  const resetAt = state.resetAt || null;
  const lm = state.marks || {}, ln = state.notes || {};

  const rm: Record<string, MarkEntry> = {};
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
    if (d.take === "remote" && remote) ops.push({ type: "mark", key, value: remote });
    if (d.upload && local) uploads.push({ table: "progress", row: markRow(key, local) });
  }

  const rn: Record<string, RemoteNote> = {};
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
    const up = d.entry || local;
    if (d.upload && up) uploads.push({ table: "notes", row: noteRow(key, up) });
  }

  const ll = state.lastAt || null;
  const rl = prefs && prefs.last_at ? { route: prefs.last_at, at: normAt(prefs.updated_at) } : null;
  if (rl && (!ll || rl.at > ll.at)) ops.push({ type: "last", value: rl });
  else if (ll && (!rl || ll.at > rl.at)) uploads.push({ table: "prefs", row: prefsRow(ll) });

  return { ops, uploads };
}
