// Cliente Supabase falso para os testes de interface: autenticação e tabelas
// em memória, com registro das chamadas.
import type { QueryResult, Session, SupabaseLike, SupabaseModule } from "../../src/core/sync";

export function fakeSupabase({ session = null as Session | null } = {}) {
  let current = session;
  const listeners: ((ev: string, s: Session | null) => void)[] = [];
  const calls: [string, unknown][] = [];
  const tables: Record<string, Record<string, unknown>[]> = { progress: [], notes: [], prefs: [] };
  const emit = (ev: string, session = current) => { current = session; listeners.forEach(l => l(ev, current)); };
  const ok = (data: unknown): QueryResult => ({ data, error: null, status: 200 });

  const client: SupabaseLike = {
    auth: {
      getSession: async () => ({ data: { session: current } }),
      onAuthStateChange: (cb) => { listeners.push(cb); return {}; },
      signInWithOtp: async (a) => { calls.push(["otp", a]); return { error: null }; },
      verifyOtp: async (a) => {
        calls.push(["verify", a]);
        if (a.token !== "123456") return { data: {}, error: { message: "Token has expired or is invalid", status: 403 } };
        current = { access_token: "test-token", user: { id: "u1", email: a.email } };
        emit("SIGNED_IN");
        return { data: { session: current }, error: null };
      },
      signOut: async (a) => { calls.push(["signOut", a]); current = null; emit("SIGNED_OUT"); return {}; },
    },
    from: (table) => ({
      select: async () => { calls.push(["select", table]); return ok(tables[table] ?? []); },
      upsert: (rows) => ({
        select: async () => {
          calls.push(["upsert", { table, rows }]);
          const written = (rows as Record<string, unknown>[]).map(r => ({ ...r }));
          tables[table] = [...(tables[table] ?? []), ...written];
          return { data: written, error: null, status: 201 };
        },
      }),
    }),
  };
  let loads = 0;
  const loadSupabase = async (): Promise<SupabaseModule> => { loads++; return { createClient: () => client }; };
  return { client, calls, tables, loadSupabase, emit, loads: () => loads };
}

export const CONFIG = { url: "https://proj.supabase.co", anonKey: "chave-publica" };
