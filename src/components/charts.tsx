/** Gráficos SVG ligeros, sin dependencias. */
import { cn } from "@/lib/utils";

export function AreaChart({
  data,
  height = 160,
  color = "var(--signal)",
  className,
}: {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
}) {
  const w = 600;
  const max = Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * (height - 8)).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("h-40 w-full", className)} role="img">
      <polygon points={`0,${height} ${pts.join(" ")} ${w},${height}`} fill={color} opacity={0.12} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Bars({ data, className }: { data: { label: string; value: number }[]; className?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("space-y-2.5", className)}>
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
          <span className="truncate text-ink-2">{d.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-paper-2">
            <span className="block h-full rounded-full bg-ink" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? "var(--ok)" : score >= 65 ? "var(--warn)" : "var(--bad)";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Puntuación ${score} de 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--paper-2)" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="57" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--ink)">{score}</text>
    </svg>
  );
}
