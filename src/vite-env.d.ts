/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase (contrato KC1). Vazia = modo só local. */
  readonly VITE_SUPABASE_URL?: string;
  /** Chave pública (anon ou publishable). Nunca a service_role. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
