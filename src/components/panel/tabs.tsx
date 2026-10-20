import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pestañas basadas en la URL (?tab=), sin JavaScript. */
export function LinkTabs({ tabs, current, basePath, param = "tab", extra }: { tabs: { id: string; label: string; count?: number }[]; current: string; basePath: string; param?: string; extra?: Record<string, string | undefined> }) {
  return (
    <nav aria-label="Secciones" className="no-scrollbar -mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-line px-1">
      {tabs.map((t) => {
        const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(extra ?? {}).filter(([, v]) => v) as [string, string][]), [param]: t.id });
        const active = t.id === current;
        return (
          <Link
            key={t.id}
            href={`${basePath}?${qs.toString()}`}
            aria-current={active ? "page" : undefined}
            className={cn("-mb-px inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition", active ? "border-signal text-ink" : "border-transparent text-ink-3 hover:text-ink")}
          >
            {t.label}
            {t.count != null && <span className="ml-1.5 rounded-full bg-paper-2 px-1.5 text-xs text-ink-2">{t.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
