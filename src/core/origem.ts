// Domínio canônico (contrato KO1, ADR-0013): no endereço antigo, o aparelho
// primeiro envia o que está pendente e só então vai ao mesmo caminho no
// domínio canônico. Sessão e dados locais pertencem à origem do navegador;
// um redirecionamento de servidor deixaria a fila presa no endereço antigo.
import type { SyncState } from "./sync";

export interface RedirectSync {
  readonly state: SyncState;
  pending(): number;
  subscribe(fn: (s: SyncState) => void): () => void;
}

export interface RedirectWindow {
  navigator?: { onLine?: boolean };
  location: { origin: string; pathname: string; search: string; hash: string; replace(url: string): void };
}

export function createCanonicalRedirect({ canonical, win, sync }: { canonical: string | undefined; win: RedirectWindow | undefined; sync: RedirectSync }): () => void {
  const target = (canonical || "").replace(/\/+$/, "");
  if (!target || !win || !win.location || win.location.origin === target) return () => {};
  let done = false;
  let off: (() => void) | null = null;

  const check = (s: SyncState) => {
    if (done) return;
    if (win.navigator && win.navigator.onLine === false) return;
    if (s.authStatus === "loading") return;
    if (sync.pending() > 0) return;
    // Com sessão, só depois de o ciclo terminar sem pendência nem erro de rede.
    if (s.user && s.status !== "sincronizado") return;
    if (!s.user && s.status === "offline") return;
    done = true;
    off?.();
    const { pathname, search, hash } = win.location;
    win.location.replace(target + pathname + search + hash);
  };

  off = sync.subscribe(check);
  check(sync.state);
  return () => { off?.(); };
}
