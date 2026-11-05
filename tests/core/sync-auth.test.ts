// Cenários A01–A05 e S08 (parte de autenticação) com cliente Supabase falso.
import { test } from "vitest";
import assert from "node:assert/strict";
import { createSync, type QueryResult, type Session, type SupabaseLike, type SupabaseModule, type SyncWindow } from "../../src/core/sync";
import { createStore } from "../../src/core/store";
import type { StorageLike } from "../../src/core/types";

type Listener = (event: string, session: Session | null) => void;
type FakeClient = SupabaseLike & { calls: [string, unknown][]; emit: Listener };
type FakeWindow = SyncWindow & {
  replaced: string[];
  navigator: { onLine: boolean };
  location: NonNullable<SyncWindow["location"]> & { href: string };
  fire(ev: string): void;
};
type Created = { u: string; k: string; opts: { auth: Record<string, unknown> } };

function memoryStorage(): StorageLike & { removeItem(k: string): void } {
  const m = new Map<string, string>();
  return { getItem: k => (m.has(k) ? m.get(k)! : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}

function fakeClient({ session = null }: { session?: Session | null } = {}): FakeClient {
  const listeners: Listener[] = [];
  const calls: [string, unknown][] = [];
  const emit: Listener = (ev, s) => listeners.forEach(l => l(ev, s));
  const empty = async (): Promise<QueryResult> => ({ data: [], error: null, status: 200 });
  return {
    calls, emit,
    from: () => ({ select: empty, upsert: () => ({ select: empty }) }),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: (cb) => { listeners.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      signInWithOtp: async (a) => {
        calls.push(["otp", a]);
        return a.email === "falha@exemplo.com" ? { error: { message: "Signups not allowed for otp", status: 422 } } : { error: null };
      },
      verifyOtp: async (a) => {
        calls.push(["verify", a]);
        if (a.token !== "123456") return { data: {}, error: { message: "Token has expired or is invalid", status: 403 } };
        session = { user: { id: "u1", email: a.email } };
        emit("SIGNED_IN", session);
        return { data: { session }, error: null };
      },
      signOut: async (a) => { calls.push(["signOut", a]); session = null; emit("SIGNED_OUT", null); return { error: null }; }
    }
  };
}

function fakeWindow(href = "https://atlas.test/#/politica", onLine = true): FakeWindow {
  const u = new URL(href);
  const handlers: Record<string, (() => void)[]> = {};
  const replaced: string[] = [];
  return {
    replaced,
    navigator: { onLine },
    location: { href, origin: u.origin, pathname: u.pathname, search: u.search, hash: u.hash },
    history: { replaceState: (_s, _t, url) => replaced.push(url) },
    document: { visibilityState: "visible", addEventListener() {} },
    addEventListener: (ev, fn) => { (handlers[ev] ||= []).push(fn); },
    fire: (ev) => (handlers[ev] || []).forEach(fn => fn())
  };
}

const CONFIG = { url: "https://proj.supabase.co", anonKey: "anon-key" };

function setup({ session = null, href, onLine = true, config = CONFIG, loaderFails = false }: {
  session?: Session | null; href?: string; onLine?: boolean; config?: { url: string; anonKey: string }; loaderFails?: boolean | (() => boolean);
} = {}) {
  const client = fakeClient({ session });
  const win = fakeWindow(href, onLine);
  const store = createStore({ storage: memoryStorage() });
  let created: Created | null = null;
  let loads = 0;
  const loadSupabase = async (url?: string): Promise<SupabaseModule> => {
    loads++;
    if (loaderFails === true || (typeof loaderFails === "function" && loaderFails())) throw new Error("falha ao importar " + url);
    return { createClient: (u, k, opts) => { created = { u, k, opts }; return client; } };
  };
  const timers = { setTimeout: () => 0, clearTimeout: () => {} };
  const sync = createSync({ config, store, win, loadSupabase, storage: memoryStorage(), timers });
  return { sync, client, win, store, getCreated: () => created, getLoads: () => loads };
}

test("sem configuração: não carrega o Supabase e fica não sincronizado", async () => {
  const { sync, getLoads } = setup({ config: { url: "", anonKey: "" } });
  await sync.init();
  assert.equal(getLoads(), 0);
  assert.equal(sync.state.status, "nao-sincronizado");
  assert.equal(sync.state.available, false);
  assert.equal(sync.state.reason, "sem-config");
});

test("cria o cliente com PKCE, sessão persistida e refresh automático", async () => {
  const { sync, getCreated } = setup();
  await sync.init();
  const c = getCreated()!;
  assert.equal(c.u, CONFIG.url);
  assert.equal(c.k, CONFIG.anonKey);
  assert.deepEqual(c.opts.auth, { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true });
  assert.equal(sync.state.available, true);
});

test("sessão existente: logado; status acompanha online/offline", async () => {
  const { sync, win } = setup({ session: { user: { id: "u1", email: "eu@exemplo.com" } } });
  const seen: string[] = [];
  sync.subscribe(s => seen.push(s.status));
  await sync.init();
  assert.equal(sync.state.user!.email, "eu@exemplo.com");
  assert.equal(sync.state.status, "sincronizado");
  win.navigator.onLine = false; win.fire("offline");
  assert.equal(sync.state.status, "offline");
  win.navigator.onLine = true; win.fire("online");
  assert.equal(sync.state.status, "sincronizado");
  assert.ok(seen.includes("offline"));
});

test("sem login: status não sincronizado, mesmo online", async () => {
  const { sync } = setup();
  await sync.init();
  assert.equal(sync.state.user, null);
  assert.equal(sync.state.status, "nao-sincronizado");
});

test("CDN indisponível: app segue; tenta de novo quando a rede volta", async () => {
  let fail = true;
  const { sync, win, getLoads } = setup({ loaderFails: () => fail, onLine: false });
  await sync.init();
  assert.equal(sync.state.available, false);
  assert.equal(sync.state.status, "offline");
  fail = false;
  win.navigator.onLine = true; win.fire("online");
  await new Promise(r => setTimeout(r, 0));
  await new Promise(r => setTimeout(r, 0));
  assert.equal(getLoads(), 2);
  assert.equal(sync.state.available, true);
  assert.equal(sync.state.status, "nao-sincronizado");
});

test("pedir código: valida e-mail e não cria conta", async () => {
  const { sync, client } = setup({ href: "https://atlas.test/app/#/politica/m1e1" });
  await sync.init();
  assert.deepEqual(await sync.requestCode("não é e-mail"), { ok: false, error: "email" });
  assert.equal(client.calls.length, 0);
  assert.deepEqual(await sync.requestCode("  Eu@Exemplo.com "), { ok: true });
  assert.deepEqual(client.calls[0], ["otp", { email: "eu@exemplo.com", options: { shouldCreateUser: false, emailRedirectTo: "https://atlas.test/app/" } }]);
});

test("pedir código: erro remoto vira mensagem genérica (não revela se a conta existe)", async () => {
  const { sync } = setup();
  await sync.init();
  assert.deepEqual(await sync.requestCode("falha@exemplo.com"), { ok: false, error: "remoto" });
});

test("verificar código: formato, código errado e código certo", async () => {
  const { sync, client } = setup();
  await sync.init();
  assert.deepEqual(await sync.verifyCode("eu@exemplo.com", "12a"), { ok: false, error: "codigo" });
  assert.deepEqual(await sync.verifyCode("eu@exemplo.com", "654321"), { ok: false, error: "invalido" });
  assert.deepEqual(await sync.verifyCode("eu@exemplo.com", " 123 456 "), { ok: true });
  assert.deepEqual(client.calls.at(-1), ["verify", { email: "eu@exemplo.com", token: "123456", type: "email" }]);
  assert.equal(sync.state.user!.email, "eu@exemplo.com");
  await sync.whenIdle();
  assert.equal(sync.state.status, "sincronizado");
});

test("sair mantém os dados locais e volta a não sincronizado", async () => {
  const { sync, client, store } = setup({ session: { user: { id: "u1", email: "eu@exemplo.com" } } });
  await sync.init();
  store.setMark("politica/m1e1", "def", true);
  store.setNote("politica/m1e1", "nota");
  await sync.signOut();
  assert.deepEqual(client.calls.at(-1), ["signOut", { scope: "local" }]);
  assert.equal(sync.state.user, null);
  assert.equal(sync.state.status, "nao-sincronizado");
  assert.equal(store.isDone("politica/m1e1", "def"), true);
  assert.equal(store.note("politica/m1e1"), "nota");
});

test("retorno do link: remove ?code da URL e preserva a rota", async () => {
  const { sync, win } = setup({ href: "https://atlas.test/?code=abc123#/politica/m1e1" });
  await sync.init();
  assert.deepEqual(win.replaced, ["/#/politica/m1e1"]);
  assert.equal(sync.state.linkError, null);
});

test("link expirado: limpa a URL e registra o erro para a tela de login", async () => {
  const { sync, win } = setup({ href: "https://atlas.test/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired#/" });
  await sync.init();
  assert.deepEqual(win.replaced, ["/#/"]);
  assert.equal(sync.state.linkError, "expirado");
});

test("URL sem parâmetros de login não é tocada", async () => {
  const { sync, win } = setup({ href: "https://atlas.test/?utm=x#/" });
  await sync.init();
  assert.deepEqual(win.replaced, []);
});
