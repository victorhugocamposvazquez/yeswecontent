import { cn, num } from "@/lib/utils";

/** Consumo frente al límite del plan. */
export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = !limit ? "bg-ink-3" : pct >= 100 ? "bg-bad" : pct >= 80 ? "bg-warn" : "bg-ok";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="tabular-nums">
          <strong>{num(used)}</strong>
          <span className="text-ink-3"> / {limit ? num(limit) : "∞"}</span>
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-2"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit ?? used}
        aria-valuenow={used}
      >
        <div className={cn("h-full rounded-full", tone)} style={{ width: limit ? `${pct}%` : "100%", opacity: limit ? 1 : 0.25 }} />
      </div>
    </div>
  );
}
