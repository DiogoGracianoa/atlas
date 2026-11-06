// Progresso em anel (gráfico): mesma semântica de barra de progresso
// (role="progressbar" com valores), desenhado em SVG com a cor indicada.
export function ProgressRing({ value, max, label, size = 64, color = "var(--accent, var(--brand))", showLabel = true }: {
  value: number; max: number; label: string; size?: number; color?: string; showLabel?: boolean;
}) {
  const v = Math.min(value, max);
  const pct = max > 0 ? Math.round((100 * v) / max) : 0;
  const R = 15.915; // circunferência 100: stroke-dasharray em porcentagem
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={v} aria-valuetext={`${pct}%`}
      style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden="true" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r={R} style={{ fill: "none", stroke: "color-mix(in srgb, var(--muted) 30%, transparent)", strokeWidth: 3.6 }} />
        <circle cx="18" cy="18" r={R} pathLength={100} strokeDasharray={`${pct} ${100 - pct}`}
          style={{ fill: "none", stroke: color, strokeWidth: 3.6, strokeLinecap: pct > 0 ? "round" : "butt", transition: "stroke-dasharray .4s" }} />
      </svg>
      {showLabel && (
        <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontWeight: 700, fontSize: size * 0.24, fontVariantNumeric: "tabular-nums" }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
