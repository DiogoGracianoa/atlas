// Marca de "já entrou neste aparelho" (RN18): controla só a visibilidade da
// interface de conta. Chave fora do estado v3 e nunca sincronizada.
import { useSyncExternalStore } from "react";
import { useServices } from "./context";
import type { StorageLike } from "../core/types";

export const ACCOUNT_SEEN_KEY = "atlas-conta-vista";

const subs = new Set<() => void>();

export function markAccountSeen(storage: StorageLike): void {
  try { storage.setItem(ACCOUNT_SEEN_KEY, "1"); } catch { /* sem armazenamento: segue */ }
  subs.forEach(fn => fn());
}

export function accountSeen(storage: StorageLike): boolean {
  try { return storage.getItem(ACCOUNT_SEEN_KEY) === "1"; } catch { return false; }
}

export function useAccountSeen(): boolean {
  const { storage } = useServices();
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb); }; },
    () => accountSeen(storage),
    () => accountSeen(storage),
  );
}
