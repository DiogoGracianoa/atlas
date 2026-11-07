// Serviços do app (independentes de React): armazenamento local, conteúdo e
// sincronização. Criados uma vez em main.tsx; os testes criam os seus.
import { createContent, type ContentApi, type FetchJSON } from "../core/content";
import { createStore, type Store } from "../core/store";
import { createSync, type Sync, type SyncOptions } from "../core/sync";
import type { StorageLike } from "../core/types";
import { supabaseConfig } from "../config";
import { createAuthenticatedFetch } from "../core/content-auth";

export interface Services {
  store: Store;
  content: ContentApi;
  sync: Sync;
  /** Armazenamento local (também usado para a marca de "já entrou", RN18). */
  storage: StorageLike;
}

export function createServices({
  storage = globalThis.localStorage,
  fetchJSON,
  config = supabaseConfig(),
  syncOptions = {},
}: {
  storage?: StorageLike;
  fetchJSON?: FetchJSON;
  config?: SyncOptions["config"];
  syncOptions?: Partial<SyncOptions>;
} = {}): Services {
  const store = createStore({ storage });
  const sync = createSync({ config, store, storage, ...syncOptions });
  const content = createContent({ fetchJSON: fetchJSON ?? createAuthenticatedFetch(sync) });
  let identity = sync.state.user?.id ?? null;
  sync.subscribe(state => {
    const next = state.user?.id ?? null;
    if (next !== identity) content.clear();
    identity = next;
  });
  return { store, content, sync, storage };
}
