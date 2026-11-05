// Ponte entre os serviços (núcleo sem React) e os componentes.
// O store muta o estado no lugar; um contador de versão, assinado via
// useSyncExternalStore, faz os componentes redesenharem a cada evento (ADR-004).
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { State } from "../core/types";
import type { SyncState } from "../core/sync";
import type { Services } from "./services";

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ services, children }: { services: Services; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const s = useContext(ServicesContext);
  if (!s) throw new Error("useServices fora de <ServicesProvider>");
  return s;
}

const versions = new WeakMap<object, { v: number; subs: Set<() => void> }>();
function versionOf(target: object, attach: (bump: () => void) => void) {
  let rec = versions.get(target);
  if (!rec) {
    const r = { v: 0, subs: new Set<() => void>() };
    attach(() => { r.v++; r.subs.forEach(fn => fn()); });
    versions.set(target, r);
    rec = r;
  }
  return rec;
}

/** Estado local atual; o componente redesenha a cada mudança no store. */
export function useAppState(): State {
  const { store } = useServices();
  const rec = versionOf(store, bump => store.on(bump));
  useSyncExternalStore(
    (cb) => { rec.subs.add(cb); return () => { rec.subs.delete(cb); }; },
    () => rec.v,
    () => rec.v,
  );
  return store.state;
}

/** Estado da sincronização (status, usuário, erros do link). */
export function useSyncState(): SyncState {
  const { sync } = useServices();
  const rec = versionOf(sync, bump => sync.subscribe(bump));
  useSyncExternalStore(
    (cb) => { rec.subs.add(cb); return () => { rec.subs.delete(cb); }; },
    () => rec.v,
    () => rec.v,
  );
  return sync.state;
}
