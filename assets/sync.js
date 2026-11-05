// Camada de sincronização com o Supabase.
// O app funciona sem ela: o supabase-js é importado dinamicamente e qualquer
// falha (sem configuração, sem rede, CDN fora do ar) deixa o app local.
//
// Etapa 3: sessão (link mágico com PKCE + código de 6 dígitos), estado do
// indicador e logout que preserva os dados locais. A troca de dados entra
// na Etapa 4.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE = /^\d{6,10}$/;
const AUTH_PARAMS = ["code", "error", "error_code", "error_description"];

export const defaultLoader = (url) => import(/* @vite-ignore */ url);

export function createSync({ config, store, win = globalThis.window, loadSupabase = defaultLoader }) {
  let client = null;
  let loading = null;
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

  function recompute() {
    let s;
    if (!online()) s = "offline";
    else if (!state.user) s = "nao-sincronizado";
    else s = "sincronizado";
    state.status = s;
    subs.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
  }

  const setUser = (session) => {
    state.user = session && session.user ? { id: session.user.id, email: session.user.email || "" } : null;
  };

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
        setUser(data && data.session);
        c.auth.onAuthStateChange((_event, session) => { setUser(session); recompute(); });
        client = c;
        state.available = true;
        state.reason = null;
        cleanAuthParams();
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

  async function init() {
    if (win && win.addEventListener) {
      win.addEventListener("online", () => { recompute(); if (!client && configured()) connect().then(recompute); });
      win.addEventListener("offline", recompute);
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
    setUser(data && data.session);
    state.linkError = null;
    recompute();
    return { ok: true };
  }

  async function signOut() {
    if (client) await client.auth.signOut({ scope: "local" });
    state.user = null;
    recompute();
  }

  return {
    state,
    init, requestCode, verifyCode, signOut,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    get client() { return client; },
    get store() { return store; }
  };
}
