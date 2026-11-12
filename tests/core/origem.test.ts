// Renomeação para Letrume, cenários S11–S14 (RN07, AC08, AC09): o endereço
// antigo só leva ao domínio canônico depois de enviar o que está pendente.
import { describe, expect, it } from "vitest";
import { createCanonicalRedirect, type RedirectSync } from "../../src/core/origem";
import type { SyncState } from "../../src/core/sync";

const CANON = "https://letrume.com.br";

function fakeSync(over: Partial<SyncState> = {}, pend = 0) {
  const subs = new Set<(s: SyncState) => void>();
  let pending = pend;
  const state: SyncState = { authStatus: "authenticated", status: "sincronizado", available: true, reason: null, user: { id: "u1", email: "eu@exemplo.com" }, linkError: null, ...over };
  const sync: RedirectSync = { state, pending: () => pending, subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); } };
  return {
    sync,
    emit(next: Partial<SyncState>, p = pending) { Object.assign(state, next); pending = p; subs.forEach(fn => fn(state)); },
  };
}

function fakeWin(origin = "https://atlas-autor.vercel.app", onLine = true) {
  const replaced: string[] = [];
  return {
    replaced,
    win: { navigator: { onLine }, location: { origin, pathname: "/atlas/politica/m2e1", search: "?q=1", hash: "#notas", replace: (u: string) => { replaced.push(u); } } },
  };
}

describe("redirecionamento para o domínio canônico", () => {
  it("S11: com anotação pendente, espera o envio e só então redireciona ao mesmo caminho", () => {
    const { sync, emit } = fakeSync({ status: "sincronizando" }, 1);
    const { win, replaced } = fakeWin();
    createCanonicalRedirect({ canonical: CANON, win, sync });
    expect(replaced).toEqual([]);
    emit({ status: "sincronizado" }, 0);
    expect(replaced).toEqual([CANON + "/atlas/politica/m2e1?q=1#notas"]);
  });

  it("S11: falha de envio mantém na origem antiga", () => {
    const { sync, emit } = fakeSync({ status: "sincronizando" }, 1);
    const { win, replaced } = fakeWin();
    createCanonicalRedirect({ canonical: CANON, win, sync });
    emit({ status: "offline" }, 1);
    expect(replaced).toEqual([]);
  });

  it("S12: sem conexão, não redireciona", () => {
    const { sync } = fakeSync({ status: "offline" }, 0);
    const { win, replaced } = fakeWin(undefined, false);
    createCanonicalRedirect({ canonical: CANON, win, sync });
    expect(replaced).toEqual([]);
  });

  it("S13: na própria origem canônica ou sem configuração, nunca redireciona", () => {
    for (const [canonical, origin] of [[CANON, CANON], ["", "https://atlas-autor.vercel.app"], [undefined, "https://atlas-autor.vercel.app"]] as const) {
      const { sync, emit } = fakeSync();
      const { win, replaced } = fakeWin(origin);
      createCanonicalRedirect({ canonical, win, sync });
      emit({ status: "sincronizado" }, 0);
      expect(replaced, String(canonical)).toEqual([]);
    }
  });

  it("S14: sem sessão e com fila pendente, permanece; sem sessão e fila vazia, redireciona", () => {
    const a = fakeSync({ authStatus: "anonymous", user: null, status: "nao-sincronizado" }, 2);
    const wa = fakeWin();
    createCanonicalRedirect({ canonical: CANON, win: wa.win, sync: a.sync });
    expect(wa.replaced).toEqual([]);

    const b = fakeSync({ authStatus: "anonymous", user: null, status: "nao-sincronizado" }, 0);
    const wb = fakeWin();
    createCanonicalRedirect({ canonical: CANON, win: wb.win, sync: b.sync });
    expect(wb.replaced).toEqual([CANON + "/atlas/politica/m2e1?q=1#notas"]);
  });

  it("enquanto a sessão carrega, espera", () => {
    const { sync, emit } = fakeSync({ authStatus: "loading", user: null, status: "nao-sincronizado" }, 0);
    const { win, replaced } = fakeWin();
    createCanonicalRedirect({ canonical: CANON, win, sync });
    expect(replaced).toEqual([]);
    emit({ authStatus: "authenticated", user: { id: "u1", email: "" }, status: "sincronizado" }, 0);
    expect(replaced).toHaveLength(1);
  });

  it("redireciona uma vez só", () => {
    const { sync, emit } = fakeSync();
    const { win, replaced } = fakeWin();
    createCanonicalRedirect({ canonical: CANON, win, sync });
    emit({ status: "sincronizado" }, 0);
    expect(replaced).toHaveLength(1);
  });
});
