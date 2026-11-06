// Ilustração abstrata gerada (SVG): círculos, curvas de nível e pontos, com as
// cores de uma área ou trilha. Determinística pela semente, para cada área ter
// sempre a mesma "paisagem". Decorativa: escondida dos leitores de tela.
import { useId } from "react";
import s from "./Arte.module.css";

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function Arte({ seed, colors, height = 140, className }: { seed: string; colors: string[]; height?: number; className?: string }) {
  const r = rng(seed);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const W = 600, H = 200;
  const cores = colors.length ? colors : ["var(--brand)"];
  const cor = (i: number) => cores[i % cores.length] as string;
  const circulos = Array.from({ length: 4 }, (_, i) => ({ cx: r() * W, cy: r() * H, rr: 40 + r() * 110, c: cor(i), o: 0.18 + r() * 0.2 }));
  const cx = W * (0.25 + r() * 0.5), cy = H * (0.3 + r() * 0.4);
  const curvas = Array.from({ length: 6 }, (_, i) => 30 + i * 26 + r() * 8);
  const pontos = Array.from({ length: 18 }, () => ({ x: r() * W, y: r() * H, rr: 1.5 + r() * 2.5 }));
  return (
    <svg className={[s.arte, className].filter(Boolean).join(" ")} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
      style={{ height }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: cor(0), stopOpacity: 0.22 }} />
          <stop offset="1" style={{ stopColor: cor(1), stopOpacity: 0.08 }} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} style={{ fill: `url(#g${id})` }} />
      {circulos.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={c.rr} style={{ fill: c.c, opacity: c.o }} />)}
      {curvas.map((rr, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rr * 1.6} ry={rr} style={{ fill: "none", stroke: cor(i + 2), strokeOpacity: 0.35, strokeWidth: 1.2 }} />
      ))}
      {pontos.map((p, i) => <circle key={"p" + i} cx={p.x} cy={p.y} r={p.rr} style={{ fill: cor(i), opacity: 0.55 }} />)}
    </svg>
  );
}
