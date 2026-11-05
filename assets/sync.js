// Camada de sincronização com o Supabase (offline-first).
//
// - O app funciona sem ela: o supabase-js é importado dinamicamente e qualquer
//   falha (sem configuração, sem rede, CDN fora do ar) deixa o app local.
// - Escrita local primeiro: o store grava no localStorage e avisa; aqui cada
//   mudança vira uma operação por linha numa fila persistida (RN07, RN08, RN11).
// - Marcações sobem na hora; anotações e última posição com debounce (RN09).
// - Ao abrir, ao voltar ao primeiro plano e ao reconectar: busca tudo, mescla
//   por entrada (vence o mais recente, anotações divergentes são preservadas)
//   e só então envia a fila (RN10, RN24, RN31).
import { planPull, markRow, noteRow, prefsRow, fmtStamp } from "./lib/merge.js";
import { createQueue, classify, rowKey, TABLES } from "./lib/queue.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE = /^\d{6,10}$/;
const AUTH_PARAMS = ["code", "error", "error_code", "error_description"];
const CONFLICT = { progress: "user_id,item_id,mark", notes: "user_id,item_id", prefs: "user_id" };

export const defaultLoader = (url) => import(/* @vite-ignore */ url);

export function createSync({
  config, store,
  win = globalThis.window,
  storage = globalThis.localStorage,
  loadSupabase = defaultLoader,
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  timers = { setTimeout: (f, ms) => setTimeout(f, ms), clearTimeout: (id) => clearTimeout(id) },
  fmt = fmtStamp,
  debounceMs = 800,
  minPullMs = 15000,
  retryMs = 30000
}) {
  let client = null;
  let loading = null;
  let lastUserId = null;
  const subs = new Set();
  const state = {
    status: "nao-sincronizado", // nao-sincronizado | offline | sincronizando | sincronizado
    available: false,           // cliente Supabase carregado
    reason: null,               // sem-config | sem-modulo
    user: null,                 // { id, email }
    linkError: null             // expirado | falhou
  };

  const online = () => !win || !win.navigator || win.navigator.onLine !== false;
  const configured = () => !!(config && config.url && config.anonKey && config.moduleUrl);
  const queue = configured() ? createQueue({ storage }) : null;

  let busy = 0;          // operações de rede em andamento
  let netError = false;  // última tentativa falhou por rede/servidor
  let flushing = null, flushAgain = false;
  let pulling = null, pullAgain = false;
  let needsPull = false;
  let lastPull = -Infinity;
  let debounceT = null, retryT = null;

  function recompute() {
    let s;
    if (!online() || (netError && state.user)) s = "offline";
    else if (!state.user) s = "nao-sincronizado";
    else if (busy > 0 || (queue && queue.size() > 0)) s = "sincronizando";
    else s = "sincronizado";
    state.status = s;
    subs.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
  }

  const canTalk = () => !!(client && state.user && online());

  function onSession(session) {
    state.user = session && session.user ? { id: session.user.id, email: session.user.email || "" } : null;
    const id = state.user ? state.user.id : null;
    const changed = id !== lastUserId;
    lastUserId = id;
    recompute();
    if (id && changed) pull({ force: true });
  }

  // Lê e remove da URL os parâmetros do retorno do link mágico, preservando a rota (#/...).
  function cleanAuthParams() {
    if (!win || !win.location || !win.location.search) return;
    const params = new URLSearchParams(win.location.search);
    if (!AUTH_PARAMS.some(p => params.has(p))) return;
    if (params.has("error") || params.has("error_code")) {
      state.linkError = params.get("error_code") === "otp_expired" ? "expirado" : "falhou";
    }
    AUTH_PARAMS.forEach(p => params.delete(p));
    const rest = params.toString();
    win.history.replaceState(null, "", win.location.pathname + (rest ? "?" + rest : "") + win.location.hash);
  }

  async function connect() {
    if (client) return true;
    if (!configured()) { state.reason = "sem-config"; return false; }
    if (!loading) {
      loading = (async () => {
        const mod = await loadSupabase(config.moduleUrl);
        const c = mod.createClient(config.url, config.anonKey, {
          auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        const { data } = await c.auth.getSession();
        client = c;
        state.available = true;
        state.reason = null;
        cleanAuthParams();
        c.auth.onAuthStateChange((_event, session) => onSession(session));
        onSession(data && data.session);
      })().catch(err => {
        loading = null;
        state.available = false;
        state.reason = "sem-modulo";
        console.warn("Sincronização indisponível:", err && err.message);
      });
    }
    await loading;
    return !!client;
  }

  /* ---------- fila e envio ---------- */
  function enqueueFromEvent(e) {
    if (!queue) return;
    if (e.type === "mark") { queue.put({ table: "progress", row: markRow(e.key, { done: e.done, at: e.at }) }); flush(); }
    else if (e.type === "note") { queue.put({ table: "notes", row: noteRow(e.item, { body: e.body, at: e.at }) }); debounceFlush(); }
    else if (e.type === "last") { queue.put({ table: "prefs", row: prefsRow({ route: e.route, at: e.at }) }); debounceFlush(); }
    else if (e.type === "batch" && !e.silent) {
      for (const op of e.ops) {
        if (op.type === "mark") queue.put({ table: "progress", row: markRow(op.key, op.value) });
        else if (op.type === "note") queue.put({ table: "notes", row: noteRow(op.key, op.value) });
        else if (op.type === "last") queue.put({ table: "prefs", row: prefsRow(op.value) });
      }
      flush();
    } else return;
    recompute();
  }
  store.on(enqueueFromEvent);

  function debounceFlush() {
    if (debounceT) timers.clearTimeout(debounceT);
    debounceT = timers.setTimeout(() => { debounceT = null; flush(); }, debounceMs);
  }
  function scheduleRetry() {
    if (retryT) return;
    retryT = timers.setTimeout(() => { retryT = null; pull({ force: true }); }, retryMs);
  }

  async function send(table, items, uid) {
    const rows = items.map(i => ({ user_id: uid, ...i.row }));
    let res;
    try { res = await client.from(table).upsert(rows, { onConflict: CONFLICT[table] }).select(); }
    catch (err) { res = { error: err, status: 0 }; }
    return res;
  }

  function afterWrite(table, items, data) {
    const written = new Set((data || []).map(r => rowKey(table, r)));
    for (const i of items) {
      queue.ack(i.key, i.row.updated_at);
      if (!written.has(i.key)) needsPull = true; // o servidor tinha versão mais nova
      else if (table === "notes") store.setNoteBase(i.row.item_id, { body: i.row.body, at: i.row.updated_at });
    }
  }

  // Envia a fila: "ok", "retry" (rede/servidor) ou "parou" (saiu da conta no meio).
  async function sendAll() {
    const uid = state.user && state.user.id;
    if (!uid) return "parou";
    const items = queue.list();
    for (const table of TABLES) {
      const batch = items.filter(i => i.table === table);
      if (!batch.length) continue;
      if (!state.user || state.user.id !== uid) return "parou";
      let res = await send(table, batch, uid);
      let c = classify(res);
      if (c === "drop" && batch.length > 1) {
        // um item inválido não pode derrubar os outros: tenta um a um
        for (const one of batch) {
          const r1 = await send(table, [one], uid);
          const c1 = classify(r1);
          if (c1 === "retry") return "retry";
          if (c1 === "drop") { console.warn("Operação descartada pelo servidor (" + table + ", status " + r1.status + ")"); queue.ack(one.key, one.row.updated_at); }
          else afterWrite(table, [one], r1.data);
        }
        continue;
      }
      if (c === "retry") return "retry";
      if (c === "drop") {
        console.warn("Operação descartada pelo servidor (" + table + ", status " + res.status + ")");
        batch.forEach(i => queue.ack(i.key, i.row.updated_at));
        continue;
      }
      afterWrite(table, batch, res.data);
    }
    return "ok";
  }

  function flush() {
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
  function pull({ force = false } = {}) {
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
        const results = await Promise.all(TABLES.map(async t => {
          try { return await client.from(t).select("*"); }
          catch (err) { return { error: err, status: 0 }; }
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
          const [p, n, f] = results.map(r => r.data || []);
          const plan = planPull(store.state, { progress: p, notes: n, prefs: f[0] || null }, { now: now(), fmt });
          if (plan.ops.length) store.applyOps(plan.ops, { silent: true });
          plan.uploads.forEach(u => queue.put(u));
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
    for (let i = 0; i < 50 && (pulling || flushing || loading && !client); i++) {
      await Promise.all([pulling, flushing, loading].filter(Boolean)).catch(() => {});
      await new Promise(r => setTimeout(r, 0));
    }
  }

  /* ---------- ciclo de vida ---------- */
  async function init() {
    if (win && win.addEventListener) {
      win.addEventListener("online", () => {
        recompute();
        if (!client && configured()) connect().then(recompute);
        else pull({ force: true });
      });
      win.addEventListener("offline", recompute);
    }
    if (win && win.document && win.document.addEventListener) {
      win.document.addEventListener("visibilitychange", () => {
        if (win.document.visibilityState === "visible") pull();
      });
    }
    await connect();
    recompute();
  }

  async function requestCode(rawEmail) {
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!EMAIL.test(email)) return { ok: false, error: "email" };
    if (!(await connect())) return { ok: false, error: "indisponivel" };
    const redirect = win.location.origin + win.location.pathname;
    const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirect } });
    if (error) { console.warn("Falha ao pedir código de login (status " + (error.status || "?") + ")"); return { ok: false, error: "remoto" }; }
    state.linkError = null;
    return { ok: true };
  }

  async function verifyCode(rawEmail, rawCode) {
    const email = String(rawEmail || "").trim().toLowerCase();
    const token = String(rawCode || "").replace(/\s+/g, "");
    if (!EMAIL.test(email)) return { ok: false, error: "email" };
    if (!CODE.test(token)) return { ok: false, error: "codigo" };
    if (!(await connect())) return { ok: false, error: "indisponivel" };
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
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    get client() { return client; }
  };
}
