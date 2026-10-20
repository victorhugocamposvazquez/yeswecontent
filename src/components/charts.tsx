/** Gráficos SVG ligeros, sin dependencias. */
import { cn } from "@/lib/utils";

function smooth(points: [number, number][]) {
  if (points.length < 2) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i === 0 ? 0 : i - 1];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const [x3, y3] = points[i + 2 < points.length ? i + 2 : i + 1];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2},${y2}`;
  }
  return d;
}

export function AreaChart({
  data,
  labels,
  height = 160,
  color = "var(--signal)",
  grid = true,
  className,
  id = "area",
}: {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  grid?: boolean;
  className?: string;
  id?: string;
}) {
  const w = 600;
  const pad = { t: 8, b: labels ? 20 : 4 };
  const h = height - pad.t - pad.b;
  const max = Math.max(...data, 1);
  const step = w / Math.max(data.length - 1, 1);
  const pts: [number, number][] = data.map((v, i) => [+(i * step).toFixed(1), +(pad.t + h - (v / max) * h).toFixed(1)]);
  const line = smooth(pts);
  const last = pts[pts.length - 1];
  const gid = `g-${id}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn("h-40 w-full", className)} role="img">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {grid &&
        [0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={pad.t + h * f} y2={pad.t + h * f} stroke="var(--line)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        ))}
      <path d={`${line} L${w},${pad.t + h} L0,${pad.t + h} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {last && (
        <>
          <circle cx={last[0]} cy={last[1]} r="5" fill={color} opacity={0.2} />
          <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--card)" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </>
      )}
      {labels &&
        labels.map((l, i) => (
          <text key={i} x={i === 0 ? 0 : i === labels.length - 1 ? w : (i / (labels.length - 1)) * w} y={height - 4} fontSize="11" fill="var(--ink-3)" textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}>
            {l}
          </text>
        ))}
    </svg>
  );
}

export function Sparkline({ data, color = "var(--signal)", className }: { data: number[]; color?: string; className?: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const step = w / Math.max(data.length - 1, 1);
  const pts: [number, number][] = data.map((v, i) => [+(i * step).toFixed(1), +(h - 3 - ((v - min) / range) * (h - 6)).toFixed(1)]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-8 w-28", className)} aria-hidden preserveAspectRatio="none">
      <path d={smooth(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Bars({ data, className, color = "var(--ink)", max: maxIn }: { data: { label: string; value: number; hint?: string }[]; className?: string; color?: string; max?: number }) {
  const max = maxIn ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((d) => (
        <div key={d.label} className="grid min-w-0 grid-cols-[minmax(4rem,7rem)_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
          <span className="truncate text-ink-2">{d.label}</span>
          <span className="h-2 min-w-0 overflow-hidden rounded-full bg-paper-3">
            <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </span>
          <span className="tabular text-right text-ink">{d.hint ?? d.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Columns({ data, className, color = "var(--signal)" }: { data: { label: string; value: number }[]; className?: string; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("flex h-40 items-end gap-1.5", className)} role="img">
      {data.map((d) => (
        <div key={d.label} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5" title={`${d.label}: ${d.value}`}>
          <div className="w-full rounded-t-md bg-paper-3 transition group-hover:brightness-95" style={{ height: `${Math.max((d.value / max) * 100, 2)}%`, background: color, opacity: 0.85 }} />
          <span className="truncate text-[10px] uppercase tracking-wide text-ink-3">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ScoreRing({ score, size = 96, label }: { score: number; size?: number; label?: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? "var(--ok)" : score >= 65 ? "var(--warn)" : "var(--bad)";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Puntuación ${score} de 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--paper-3)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y={label ? 52 : 57} textAnchor="middle" fontSize="24" fontWeight="650" fill="var(--ink)" letterSpacing="-1">
        {score}
      </text>
      {label && (
        <text x="50" y="68" textAnchor="middle" fontSize="9" fill="var(--ink-3)">
          {label}
        </text>
      )}
    </svg>
  );
}

export function Progress({ value, tone = "signal", className }: { value: number; tone?: "signal" | "ok" | "warn" | "bad" | "ink"; className?: string }) {
  const colors = { signal: "var(--signal)", ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)", ink: "var(--ink)" };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-paper-3", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: colors[tone] }} />
    </div>
  );
}
