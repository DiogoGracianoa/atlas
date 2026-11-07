// Configuração pública (contrato KC1). Vazia = acesso indisponível.
// A chave é a pública (anon/publishable); a service_role nunca entra aqui.
export function supabaseConfig(env: ImportMetaEnv = import.meta.env): { url: string; anonKey: string } | null {
  const url = (env.VITE_SUPABASE_URL ?? "").trim();
  const anonKey = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  return url && anonKey ? { url, anonKey } : null;
}
