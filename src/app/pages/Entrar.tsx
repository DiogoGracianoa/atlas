// Entrada pública isolada das ferramentas e do conteúdo autenticado.
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
    <main className={s.page}>
      <h1>Entrar</h1>
      {sync.authStatus === "loading" ? <p role="status">Verificando sessão…</p> : sync.reason === "sem-modulo"
        ? <p>Não foi possível verificar o acesso agora. Confira a conexão e tente novamente.</p> : sync.available || sync.reason !== "sem-config"
        ? <LoginForm />
        : <p>A sincronização ainda não foi configurada neste site.</p>}
    </main>
  );
}
