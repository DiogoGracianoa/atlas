// Progresso geral do atlas no cartão do portal (somando as áreas já abertas).
import { useAppState } from "../../app/context";
import { Progress } from "../../ui/primitives";

export function AtlasCard() {
  const state = useAppState();
  const total = Object.values(state.totals).reduce((a, n) => a + n, 0);
  const done = Object.entries(state.marks).filter(([, v]) => v.done).length;
  if (!total) return <p style={{ margin: 0, color: "var(--muted)" }}>Comece por qualquer área.</p>;
  return <Progress value={done} max={total} label="Progresso no atlas" />;
}
