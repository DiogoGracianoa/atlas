import type { Sync } from "./sync";
import type { FetchJSON } from "./content";
export function createAuthenticatedFetch(sync: Sync, fetcher: typeof fetch = fetch): FetchJSON {
  let generation = 0;
  let identity = sync.state.user?.id;
  let status = sync.state.authStatus;
  sync.subscribe(state => {
    if (identity !== state.user?.id || status !== state.authStatus) generation++;
    identity = state.user?.id;
    status = state.authStatus;
  });
  return async file => {
    const started = generation;
    const token = await sync.getAccessToken();
    if (!token || started !== generation) throw new Error("Entre novamente para acessar o conteúdo.");
    let response: Response;
    try {
      response = await fetcher("/api/conteudo?arquivo=" + encodeURIComponent(file), {
        headers: { Authorization: "Bearer " + token }, cache: "no-store",
      });
    } catch { throw new Error("Conteúdo indisponível. Confira sua conexão."); }
    if (started !== generation) throw new Error("A sessão mudou. Entre novamente.");
    if (response.status === 401) {
      sync.rejectSession();
      throw new Error("Sua sessão terminou. Entre novamente.");
    }
    if (!response.ok) throw new Error("Conteúdo indisponível. Tente novamente com conexão.");
    const data: unknown = await response.json();
    if (started !== generation) throw new Error("A sessão mudou. Entre novamente.");
    return data;
  };
}
