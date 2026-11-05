import { useEffect } from "react";
import { Navigate } from "react-router";
import { useToast } from "../ui/Toast";

/** Redireciona (substituindo o endereço) e mostra um aviso. */
export function RedirectWithToast({ to, message }: { to: string; message: string }) {
  const toast = useToast();
  useEffect(() => { toast(message); }, [toast, message]);
  return <Navigate to={to} replace />;
}
