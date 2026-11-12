// Telas do preparatório num chunk à parte (peso inicial, S47).
import { lazy, Suspense } from "react";

const Concurso = lazy(() => import("./Concurso").then(m => ({ default: m.Concurso })));

export function ConcursoLazy() {
  return (
    <Suspense fallback={<p role="status" style={{ padding: "24px var(--gutter)", color: "var(--muted)" }}>Carregando…</p>}>
      <Concurso />
    </Suspense>
  );
}
