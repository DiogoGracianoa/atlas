// Erro inesperado numa rota: mensagem simples e caminho de volta, no lugar da
// tela padrão do React Router. O progresso salvo não é afetado.
import { useEffect } from "react";
import { useRouteError } from "react-router";

export function Erro() {
  const error = useRouteError();
  useEffect(() => { console.error("Erro na rota:", error); }, [error]);
  return (
    <main style={{ maxWidth: "36rem", margin: "0 auto", padding: "48px 16px" }}>
      <h1 style={{ fontFamily: "var(--font-read)" }}>Algo deu errado nesta página</h1>
      <p>Seu progresso continua salvo neste aparelho. Tente recarregar ou volte ao início.</p>
      <p><a href="/">Voltar ao início</a></p>
    </main>
  );
}
