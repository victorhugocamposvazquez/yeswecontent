import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pestañas basadas en la URL (?tab=), sin JavaScript. Subrayado con el color señal. */
export function LinkTabs({ tabs, current, basePath, param = "tab", extra, className }: { tabs: { id: string; label: string; count?: number }[]; current: string; basePath: string; param?: string; extra?: Record<string, string | undefined>; className?: string }) {
  return (
    <nav aria-label="Secciones" className={cn("no-scrollbar -mx-4 mb-5 flex gap-0.5 overflow-x-auto border-b border-line px-4 md:mx-0 md:mb-6 md:px-0", className)}>
      {tabs.map((t) => {
        const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(extra ?? {}).filter(([, v]) => v) as [string, string][]), [param]: t.id });
        const active = t.id === current;
        return (
          <Link
            key={t.id}
            href={`${basePath}?${qs.toString()}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-[13px] font-medium transition-colors duration-150 md:min-h-10",
              active ? "border-signal text-ink" : "border-transparent text-ink-3 hover:border-line-2 hover:text-ink",
            )}
          >
            {t.label}
            {t.count != null && <span className={cn("tabular rounded-full px-1.5 py-px text-[11px] font-medium", active ? "bg-signal-soft text-signal" : "bg-paper-3 text-ink-2")}>{t.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Chips de filtro (estado, clúster…) enlazados por URL. */
export function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 max-sm:h-10",
        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-line-2 hover:bg-paper-2 hover:text-ink",
      )}
    >
      {label}
      {count != null && <span className={cn("tabular text-[11px]", active ? "text-paper/70" : "text-ink-3")}>{count}</span>}
    </Link>
  );
}
