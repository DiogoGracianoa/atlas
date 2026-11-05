// Serviços do app (independentes de React): armazenamento local, conteúdo e
// sincronização. Criados uma vez em main.tsx; os testes criam os seus.
import { createContent, type ContentApi, type FetchJSON } from "../core/content";
import { createStore, type Store } from "../core/store";
import { createSync, type Sync, type SyncOptions } from "../core/sync";
import type { StorageLike } from "../core/types";
import { supabaseConfig } from "../config";

export interface Services {
  store: Store;
  content: ContentApi;
  sync: Sync;
  /** Armazenamento local (também usado para a marca de "já entrou", RN18). */
  storage: StorageLike;
}

/** Busca JSON relativo à raiz do site (as rotas limpas não podem afetar o caminho). */
export const fetchFromSite: FetchJSON = async (url) => {
  const res = await fetch(import.meta.env.BASE_URL + url.replace(/^\//, ""), { cache: "no-cache" });
  if (!res.ok) throw new Error("HTTP " + res.status + " em " + url);
  return res.json();
};

export function createServices({
  storage = globalThis.localStorage,
  fetchJSON = fetchFromSite,
  config = supabaseConfig(),
  syncOptions = {},
}: {
  storage?: StorageLike;
  fetchJSON?: FetchJSON;
  config?: SyncOptions["config"];
  syncOptions?: Partial<SyncOptions>;
} = {}): Services {
  const store = createStore({ storage });
  const content = createContent({ fetchJSON });
  const sync = createSync({ config, store, storage, ...syncOptions });
  return { store, content, sync, storage };
}
