// /entrar: login do autor (RN18). Não há link para cá em nenhuma página.
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSyncState } from "../context";
import { LoginForm } from "../conta";
import s from "../conta.module.css";

export function Entrar() {
  const sync = useSyncState();
  const navigate = useNavigate();
  useEffect(() => { document.title = "Entrar · Atlas"; }, []);
  // Entrou (pelo código aqui ou pelo link do e-mail): vai para o atlas.
  useEffect(() => { if (sync.user) void navigate("/atlas", { replace: true }); }, [sync.user, navigate]);
  return (
    <div className={s.page}>
      <h1>Entrar</h1>
      {sync.available || sync.reason !== "sem-config"
        ? <LoginForm />
        : <p>A sincronização ainda não foi configurada neste site.</p>}
    </div>
  );
}
