/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase (contrato KC1). Vazia = modo só local. */
  readonly VITE_SUPABASE_URL?: string;
  /** Chave pública (anon ou publishable). Nunca a service_role. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Domínio canônico (KO1), ex.: https://letrume.com.br. Vazio desativa. */
  readonly VITE_ORIGEM_CANONICA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
