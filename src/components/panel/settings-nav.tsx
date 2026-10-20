"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SETTINGS_SECTIONS } from "./settings-config";

export function SettingsNav() {
  const path = usePathname();
  const current = path.split("/")[3] ?? "cuenta";
  const barRef = useRef<HTMLDivElement>(null);
  // Mantiene visible el chip activo en la barra horizontal de móvil.
  useEffect(() => {
    const bar = barRef.current;
    const el = bar?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!bar || !el) return;
    bar.scrollLeft = el.offsetLeft - (bar.clientWidth - el.offsetWidth) / 2;
  }, [current]);
  return (
    <nav aria-label="Ajustes">
      {/* Móvil: chips horizontales */}
      <div ref={barRef} className="no-scrollbar relative -mx-4 flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4 lg:hidden">
        {SETTINGS_SECTIONS.flatMap((g) => g.items).map((s) => (
          <Link
            key={s.id}
            href={`/panel/ajustes/${s.id}`}
            aria-current={current === s.id ? "page" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-4 text-[13px] font-medium transition-colors",
              current === s.id ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:bg-paper-2",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
      {/* Escritorio: lista agrupada */}
      <div className="hidden space-y-5 lg:block">
        {SETTINGS_SECTIONS.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{g.group}</p>
            <ul className="space-y-px">
              {g.items.map((s) => {
                const on = current === s.id;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/panel/ajustes/${s.id}`}
                      aria-current={on ? "page" : undefined}
                      className={cn("flex h-8 items-center rounded-lg px-2.5 text-[13px] transition-colors duration-150", on ? "bg-signal-soft font-medium text-signal" : "text-ink-2 hover:bg-paper-3 hover:text-ink")}
                    >
                      {s.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
