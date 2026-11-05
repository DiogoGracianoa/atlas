// Backend Supabase falso, em memória, compartilhado entre "aparelhos".
// Reproduz o que importa da migration: chave primária, RLS por usuário,
// o trigger que descarta escrita com updated_at mais antigo (a linha
// descartada não volta na resposta) e o formato de horário do Postgres.
import { createStore } from "../../assets/lib/store.js";
import { createSync } from "../../assets/sync.js";

const PK = {
  progress: r => r.user_id + "|" + r.item_id + "|" + r.mark,
  notes: r => r.user_id + "|" + r.item_id,
  prefs: r => r.user_id
};
const pg = (at) => new Date(at).toISOString().replace("Z", "000+00:00");
const NET = () => ({ data: null, error: { message: "TypeError: Failed to fetch" }, status: 0 });

export function createBackend() {
  const tables = { progress: [], notes: [], prefs: [] };
  const calls = [];
  let failNext = null;
  const backend = {
    tables, calls,
    failNextWith(res) { failNext = res; },
    clientFor(dev) {
      return {
        auth: {
          getSession: async () => ({ data: { session: dev.session }, error: null }),
          onAuthStateChange: (cb) => { dev.listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
          signInWithOtp: async () => ({ error: null }),
          verifyOtp: async ({ email, token }) => {
            if (token !== "123456") return { data: {}, error: { message: "invalid", status: 403 } };
            dev.session = { user: { id: "u1", email } };
            dev.listeners.forEach(l => l("SIGNED_IN", dev.session));
            return { data: { session: dev.session }, error: null };
          },
          signOut: async () => { dev.session = null; dev.listeners.forEach(l => l("SIGNED_OUT", null)); return { error: null }; }
        },
        from(table) {
          const uid = () => (dev.session ? dev.session.user.id : null);
          return {
            select: async () => {
              calls.push(dev.name + ":select:" + table);
              if (!dev.online) return NET();
              return { data: tables[table].filter(r => r.user_id === uid()).map(r => ({ ...r })), error: null, status: 200 };
            },
            upsert: (rows) => ({
              select: async () => {
                calls.push(dev.name + ":upsert:" + table + ":" + rows.length);
                if (!dev.online) return NET();
                if (failNext) { const f = failNext; failNext = null; return f; }
                const written = [];
                for (const row of rows) {
                  if (!uid() || row.user_id !== uid()) return { data: null, error: { message: "new row violates row-level security policy" }, status: 403 };
                  const r = { ...row, updated_at: pg(row.updated_at) };
                  const t = tables[table];
                  const i = t.findIndex(x => PK[table](x) === PK[table](r));
                  if (i < 0) { t.push(r); written.push({ ...r }); }
                  else if (Date.parse(r.updated_at) < Date.parse(t[i].updated_at)) { /* trigger: descarta */ }
                  else { t[i] = { ...t[i], ...r }; written.push({ ...t[i] }); }
                }
                return { data: written, error: null, status: 201 };
              }
            })
          };
        }
      };
    }
  };
  return backend;
}

export function memoryStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), map: m };
}

// Relógio e timers controlados manualmente.
export function createClock(startIso = "2026-11-04T10:00:00.000Z") {
  let t = Date.parse(startIso);
  const timers = [];
  let seq = 0;
  const clock = {
    nowMs: () => t,
    nowIso: () => new Date(t).toISOString(),
    set(iso) { t = Date.parse(iso); },
    setTimeout: (fn, ms) => { const id = ++seq; timers.push({ id, at: t + ms, fn }); return id; },
    clearTimeout: (id) => { const i = timers.findIndex(x => x.id === id); if (i >= 0) timers.splice(i, 1); },
    async advance(ms) {
      const end = t + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const next = timers[0];
        if (!next || next.at > end) break;
        timers.shift();
        t = next.at;
        next.fn();
        await flushMicrotasks();
      }
      t = end;
      await flushMicrotasks();
    }
  };
  return clock;
}
export async function flushMicrotasks() { for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r)); }

// Um aparelho: armazenamento próprio, relógio próprio, mesmo backend.
export function createDevice(backend, { name, clock, loggedIn = true, storage = memoryStorage() }) {
  const handlers = {};
  const dev = { name, online: true, session: loggedIn ? { user: { id: "u1", email: "eu@exemplo.com" } } : null, listeners: [] };
  const win = {
    navigator: { get onLine() { return dev.online; } },
    location: { href: "https://atlas.test/#/", origin: "https://atlas.test", pathname: "/", search: "", hash: "#/" },
    history: { replaceState() {} },
    document: { visibilityState: "visible", addEventListener: (ev, fn) => { (handlers["doc:" + ev] ||= []).push(fn); } },
    addEventListener: (ev, fn) => { (handlers[ev] ||= []).push(fn); }
  };
  const store = createStore({ storage, now: clock.nowIso });
  const client = backend.clientFor(dev);
  const sync = createSync({
    config: { url: "https://proj.supabase.co", anonKey: "anon", moduleUrl: "x" },
    store, win, storage,
    loadSupabase: async () => ({ createClient: () => client }),
    now: clock.nowIso, nowMs: clock.nowMs,
    timers: { setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout },
    fmt: (at) => at.slice(11, 16)
  });
  return {
    name, dev, store, sync, storage, win,
    goOffline() { dev.online = false; (handlers.offline || []).forEach(fn => fn()); },
    async goOnline() { dev.online = true; (handlers.online || []).forEach(fn => fn()); await sync.whenIdle(); },
    async becomeVisible() { (handlers["doc:visibilitychange"] || []).forEach(fn => fn()); await sync.whenIdle(); }
  };
}
