// Configuração pública do Supabase.
// A chave anon é pública por design (o acesso é limitado pelas políticas RLS).
// A chave service_role NUNCA entra neste repositório.
// Enquanto URL e chave estiverem vazias, o app funciona só com o armazenamento
// local e mostra "não sincronizado". Veja o README para preencher.
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";

// supabase-js v2 como módulo ESM via CDN, versão fixada (nunca @latest).
// O jsDelivr resolve as dependências também com versão fixa na URL, o que
// permite guardá-las em cache sem risco de mudarem por baixo.
export const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm";
