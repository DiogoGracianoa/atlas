// Camada de sincronização com o Supabase (offline-first).
//
// - O app funciona sem ela: o supabase-js é importado sob demanda (chunk à
//   parte) e qualquer falha (sem configuração, sem rede) deixa o app local.
// - Escrita local primeiro: o store grava no localStorage e avisa; aqui cada
//   mudança vira uma operação por linha numa fila persistida (RN07, RN08, RN11).
// - Marcações sobem na hora; anotações e última posição com debounce (RN09).
// - Ao abrir, ao voltar ao primeiro plano e ao reconectar: busca tudo, mescla
//   por entrada (vence o mais recente, anotações divergentes são preservadas)
//   e só então envia a fila (RN10, RN24, RN31).
import { planPull, markRow, noteRow, prefsRow, fmtStamp, type FormatTime, type RemoteData } from "./merge";
import { createQueue, classify, rowKey, TABLES, type ResultLike } from "./queue";
import type { Store } from "./store";
import type { IsoTime, QueueItem, StorageLike, StoreEvent, Table } from "./types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE = /^\d{6,10}$/;
const AUTH_PARAMS = ["code", "error", "error_code", "error_description"];
const CONFLICT: Record<Table, string> = { progress: "user_id,item_id,mark", notes: "user_id,item_id", prefs: "user_id" };

/* ---------- fronteira com o supabase-js (só o que o app usa) ---------- */

export interface Session {
  user: { id: string; email?: string | null };
}
export interface ErrorLike {
  message?: string;
  status?: number;
}
export interface QueryResult extends ResultLike {
  data?: unknown;
  error?: ErrorLike | null;
}
export interface TableClient {
  select(columns?: string): PromiseLike<QueryResult>;
  upsert(rows: object[], opts?: { onConflict?: string }): { select(): PromiseLike<QueryResult> };
}
export interface AuthClient {
  getSession(): PromiseLike<{ data?: { session?: Session | null } | null }>;
  onAuthStateChange(cb: (event: string, session: Session | null) => void): unknown;
  signInWithOtp(args: { email: string; options: { shouldCreateUser: boolean; emailRedirectTo: string } }): PromiseLike<{ error?: ErrorLike | null }>;
  verifyOtp(args: { email: string; token: string; type: "email" }): PromiseLike<{ data?: { session?: Session | null } | null; error?: ErrorLike | null }>;
  signOut(args: { scope: "local" }): PromiseLike<unknown>;
}
export interface SupabaseLike {
  auth: AuthClient;
  from(table: string): TableClient;
}
export interface SupabaseModule {
  createClient(url: string, key: string, opts: { auth: Record<string, unknown> }): SupabaseLike;
}

/**
 * Carrega o supabase-js do pacote npm, num chunk separado (RN13). O cast é a
 * única ponte entre o tipo completo do cliente e a fronteira mínima acima.
 */
export const defaultLoader = async (): Promise<SupabaseModule> =>
  (await import("@supabase/supabase-js")) as unknown as SupabaseModule;

/* ---------- ambiente ---------- */

export interface SyncWindow {
  navigator?: { onLine?: boolean };
  location?: { origin: string; pathname: string; search: string; hash: string };
  history?: { state?: unknown; replaceState(data: unknown, unused: string, url: string): void };
  document?: { visibilityState: string; addEventListener(type: string, fn: () => void): void };
  addEventListener?(type: string, fn: () => void): void;
}

export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}

export type SyncStatus = "nao-sincronizado" | "offline" | "sincronizando" | "sincronizado";

export interface SyncState {
  status: SyncStatus;
  /** Cliente Supabase carregado. */
  available: boolean;
  reason: "sem-config" | "sem-modulo" | null;
  user: { id: string; email: string } | null;
  linkError: "expirado" | "falhou" | null;
}

export type AuthError = "email" | "codigo" | "indisponivel" | "remoto" | "invalido";
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

export interface Sync {
  readonly state: SyncState;
  init(): Promise<void>;
  requestCode(email: string): Promise<AuthResult>;
  verifyCode(email: string, code: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  pull(opts?: { force?: boolean }): Promise<void>;
  flush(): Promise<void>;
  whenIdle(): Promise<void>;
  pending(): number;
  subscribe(fn: (s: SyncState) => void): () => void;
  readonly client: SupabaseLike | null;
}

export interface SyncOptions {
  config: { url?: string; anonKey?: string } | null;
  store: Store;
  win?: SyncWindow;
  storage?: StorageLike;
  loadSupabase?: () => Promise<SupabaseModule>;
  now?: () => IsoTime;
  nowMs?: () => number;
  timers?: Timers;
  fmt?: FormatTime;
  debounceMs?: number;
  minPullMs?: number;
  retryMs?: number;
}

const defaultTimers: Timers = {
  setTimeout: (f, ms) => setTimeout(f, ms),
  clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
};

export function createSync({
  config, store,
  win = globalThis.window as SyncWindow | undefined,
  storage = globalThis.localStorage,
  loadSupabase = defaultLoader,
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  timers = defaultTimers,
  fmt = fmtStamp,
  debounceMs = 800,
  minPullMs = 15000,
  retryMs = 30000,
}: SyncOptions): Sync {
  let client: SupabaseLike | null = null;
  let loading: Promise<void> | null = null;
  let lastUserId: string | null = null;
  const subs = new Set<(s: SyncState) => void>();
  const state: SyncState = {
    status: "nao-sincronizado",
    available: false,
    reason: null,
    user: null,
    linkError: null,
  };

  const online = () => !win || !win.navigator || win.navigator.onLine !== false;
  const configured = () => !!(config && config.url && config.anonKey);
  const queue = configured() ? createQueue({ storage }) : null;

  let busy = 0;          // operações de rede em andamento
  let netError = false;  // última tentativa falhou por rede/servidor
  let flushing: Promise<void> | null = null, flushAgain = false;
  let pulling: Promise<void> | null = null, pullAgain = false;
  let needsPull = false;
  let lastPull = -Infinity;
  let debounceT: unknown = null, retryT: unknown = null;

  function recompute() {
    let s: SyncStatus;
    if (!online() || (netError && state.user)) s = "offline";
    else if (!state.user) s = "nao-sincronizado";
    else if (busy > 0 || (queue && queue.size() > 0)) s = "sincronizando";
    else s = "sincronizado";
    state.status = s;
    subs.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
  }

  const canTalk = (): boolean => !!(client && state.user && online());

  function onSession(session: Session | null | undefined) {
    state.user = session && session.user ? { id: session.user.id, email: session.user.email || "" } : null;
    const id = state.user ? state.user.id : null;
    const changed = id !== lastUserId;
    lastUserId = id;
    recompute();
    if (id && changed) void pull({ force: true });
  }

  // Lê e remove da URL os parâmetros do retorno do link mágico, preservando a rota.
  function cleanAuthParams() {
    if (!win || !win.location || !win.location.search || !win.history) return;
    const params = new URLSearchParams(win.location.search);
    if (!AUTH_PARAMS.some(p => params.has(p))) return;
    if (params.has("error") || params.has("error_code")) {
      state.linkError = params.get("error_code") === "otp_expired" ? "expirado" : "falhou";
    }
    AUTH_PARAMS.forEach(p => params.delete(p));
    const rest = params.toString();
    // Mantém o estado do roteador (chave da entrada, usada na rolagem).
    win.history.replaceState(win.history.state ?? null, "", win.location.pathname + (rest ? "?" + rest : "") + win.location.hash);
  }

  async function connect(): Promise<boolean> {
    if (client) return true;
    if (!configured() || !config) { state.reason = "sem-config"; return false; }
    if (!loading) {
      const { url, anonKey } = config as { url: string; anonKey: string };
      loading = (async () => {
        const mod = await loadSupabase();
        const c = mod.createClient(url, anonKey, {
          auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        });
        const { data } = await c.auth.getSession();
        client = c;
        state.available = true;
        state.reason = null;
        cleanAuthParams();
        c.auth.onAuthStateChange((_event, session) => onSession(session));
        onSession(data && data.session);
      })().catch((err: unknown) => {
        loading = null;
        state.available = false;
        state.reason = "sem-modulo";
        console.warn("Sincronização indisponível:", err instanceof Error ? err.message : err);
      });
    }
    await loading;
    return !!client;
  }

  /* ---------- fila e envio ---------- */
  function enqueueFromEvent(e: StoreEvent) {
    if (!queue) return;
    if (e.type === "mark") { queue.put({ table: "progress", row: markRow(e.key, { done: e.done, at: e.at }) }); void flush(); }
    else if (e.type === "note") { queue.put({ table: "notes", row: noteRow(e.item, { body: e.body, at: e.at }) }); debounceFlush(); }
    else if (e.type === "last") { queue.put({ table: "prefs", row: prefsRow({ route: e.route, at: e.at }) }); debounceFlush(); }
    else if (e.type === "batch" && !e.silent) {
      for (const op of e.ops) {
        if (op.type === "mark") queue.put({ table: "progress", row: markRow(op.key, op.value) });
        else if (op.type === "note") queue.put({ table: "notes", row: noteRow(op.key, op.value) });
        else queue.put({ table: "prefs", row: prefsRow(op.value) });
      }
      void flush();
    } else return;
    recompute();
  }
  store.on(enqueueFromEvent);

  function debounceFlush() {
    if (debounceT) timers.clearTimeout(debounceT);
    debounceT = timers.setTimeout(() => { debounceT = null; void flush(); }, debounceMs);
  }
  function scheduleRetry() {
    if (retryT) return;
    retryT = timers.setTimeout(() => { retryT = null; void pull({ force: true }); }, retryMs);
  }

  async function send(table: Table, items: QueueItem[], uid: string): Promise<QueryResult> {
    const rows = items.map(i => ({ user_id: uid, ...i.row }));
    try { return await (client as SupabaseLike).from(table).upsert(rows, { onConflict: CONFLICT[table] }).select(); }
    catch (err) { return { error: { message: String(err) }, status: 0 }; }
  }

  function afterWrite(table: Table, items: QueueItem[], data: unknown) {
    const q = queue as NonNullable<typeof queue>;
    const written = new Set(((data as { item_id?: string; mark?: string }[] | null) || []).map(r => rowKey(table, r)));
    for (const i of items) {
      q.ack(i.key, i.row.updated_at);
      if (!written.has(i.key)) needsPull = true; // o servidor tinha versão mais nova
      else if (i.table === "notes") store.setNoteBase(i.row.item_id, { body: i.row.body, at: i.row.updated_at });
    }
  }

  // Envia a fila: "ok", "retry" (rede/servidor) ou "parou" (saiu da conta no meio).
  async function sendAll(): Promise<"ok" | "retry" | "parou"> {
    const q = queue as NonNullable<typeof queue>;
    const uid = state.user && state.user.id;
    if (!uid) return "parou";
    const items = q.list();
    for (const table of TABLES) {
      const batch = items.filter(i => i.table === table);
      if (!batch.length) continue;
      if (!state.user || state.user.id !== uid) return "parou";
      const res = await send(table, batch, uid);
      const c = classify(res);
      if (c === "drop" && batch.length > 1) {
        // um item inválido não pode derrubar os outros: tenta um a um
        for (const one of batch) {
          const r1 = await send(table, [one], uid);
          const c1 = classify(r1);
          if (c1 === "retry") return "retry";
          if (c1 === "drop") { console.warn("Operação descartada pelo servidor (" + table + ", status " + r1.status + ")"); q.ack(one.key, one.row.updated_at); }
          else afterWrite(table, [one], r1.data);
        }
        continue;
      }
      if (c === "retry") return "retry";
      if (c === "drop") {
        console.warn("Operação descartada pelo servidor (" + table + ", status " + res.status + ")");
        batch.forEach(i => q.ack(i.key, i.row.updated_at));
        continue;
      }
      afterWrite(table, batch, res.data);
    }
    return "ok";
  }

  function flush(): Promise<void> {
    if (!queue) return Promise.resolve();
    if (debounceT) { timers.clearTimeout(debounceT); debounceT = null; }
    if (!canTalk()) { recompute(); return Promise.resolve(); }
    if (flushing) { flushAgain = true; return flushing; }
    flushing = (async () => {
      await null; // garante que `flushing` já foi atribuído antes do finally
      busy++; recompute();
      try {
        do {
          flushAgain = false;
          if (!queue.size()) break;
          const r = await sendAll();
          if (r === "parou") break;
          netError = r === "retry";
          if (netError) { scheduleRetry(); break; }
        } while (flushAgain && canTalk());
      } finally {
        busy--;
        flushing = null;
        recompute();
      }
      if (needsPull && !netError) { needsPull = false; await pull({ force: true }); }
    })();
    return flushing;
  }

  /* ---------- busca e mescla ---------- */
  function pull({ force = false }: { force?: boolean } = {}): Promise<void> {
    if (!canTalk()) { recompute(); return Promise.resolve(); }
    if (pulling) { pullAgain = pullAgain || force; return pulling; }
    if (!force && nowMs() - lastPull < minPullMs) return flush();
    lastPull = nowMs();
    pulling = (async () => {
      await null;
      busy++; recompute();
      let ok = false;
      const uid = state.user && state.user.id;
      try {
        const c = client as SupabaseLike;
        const results: QueryResult[] = await Promise.all(TABLES.map(async t => {
          try { return await c.from(t).select("*"); }
          catch (err) { return { error: { message: String(err) }, status: 0 }; }
        }));
        const bad = results.find(r => r.error);
        if (!state.user || state.user.id !== uid) {
          // saiu da conta (ou trocou) durante a busca: descarta o resultado
        } else if (bad) {
          netError = classify(bad) === "retry";
          if (netError) scheduleRetry();
          else console.warn("Falha ao buscar dados (status " + bad.status + ")");
        } else {
          netError = false;
          ok = true;
          const [p, n, f] = results.map(r => (r.data as unknown[] | null) || []);
          const remote = { progress: p, notes: n, prefs: (f && f[0]) || null } as RemoteData;
          const plan = planPull(store.state, remote, { now: now(), fmt });
          if (plan.ops.length) store.applyOps(plan.ops, { silent: true });
          plan.uploads.forEach(u => queue?.put(u));
        }
      } finally {
        busy--;
        pulling = null;
        recompute();
      }
      if (ok) await flush();
      if (pullAgain) { pullAgain = false; await pull({ force: true }); }
    })();
    return pulling;
  }

  async function whenIdle() {
    for (let i = 0; i < 50 && (pulling || flushing || (loading && !client)); i++) {
      await Promise.all([pulling, flushing, loading].filter(Boolean)).catch(() => {});
      await new Promise(r => setTimeout(r, 0));
    }
  }

  /* ---------- ciclo de vida ---------- */
  async function init() {
    if (win && win.addEventListener) {
      win.addEventListener("online", () => {
        recompute();
        if (!client && configured()) void connect().then(recompute);
        else void pull({ force: true });
      });
      win.addEventListener("offline", recompute);
    }
    const doc = win && win.document;
    if (doc && doc.addEventListener) {
      doc.addEventListener("visibilitychange", () => {
        if (doc.visibilityState === "visible") void pull();
      });
    }
    await connect();
    recompute();
  }

  async function requestCode(rawEmail: string): Promise<AuthResult> {
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!EMAIL.test(email)) return { ok: false, error: "email" };
    if (!(await connect()) || !client) return { ok: false, error: "indisponivel" };
    const loc = win && win.location;
    const redirect = loc ? loc.origin + loc.pathname : "";
    const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirect } });
    if (error) { console.warn("Falha ao pedir código de login (status " + (error.status || "?") + ")"); return { ok: false, error: "remoto" }; }
    state.linkError = null;
    return { ok: true };
  }

  async function verifyCode(rawEmail: string, rawCode: string): Promise<AuthResult> {
    const email = String(rawEmail || "").trim().toLowerCase();
    const token = String(rawCode || "").replace(/\s+/g, "");
    if (!EMAIL.test(email)) return { ok: false, error: "email" };
    if (!CODE.test(token)) return { ok: false, error: "codigo" };
    if (!(await connect()) || !client) return { ok: false, error: "indisponivel" };
    const { data, error } = await client.auth.verifyOtp({ email, token, type: "email" });
    if (error) return { ok: false, error: "invalido" };
    state.linkError = null;
    onSession(data && data.session);
    return { ok: true };
  }

  async function signOut() {
    if (client) await client.auth.signOut({ scope: "local" });
    onSession(null);
  }

  return {
    state,
    init, requestCode, verifyCode, signOut, pull, flush, whenIdle,
    pending: () => (queue ? queue.size() : 0),
    subscribe: (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
    get client() { return client; },
  };
}
