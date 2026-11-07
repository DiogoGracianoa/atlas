import { Navigate, Outlet } from "react-router";
import { useSyncExternalStore } from "react";
import { useSyncState } from "./context";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
}

export function RequireAuth() {
  const state = useSyncState();
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  if (state.authStatus === "loading") return <p role="status">Verificando sessão…</p>;
  if (state.authStatus !== "authenticated" || !state.user) return <Navigate to="/entrar" replace />;
  if (!online) return <p role="alert">É necessária conexão para acessar os materiais. Reconecte para continuar.</p>;
  return <Outlet key={state.user.id} />;
}
