"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** Círculo con el favicon de la web (o su inicial si no carga). */
export function SiteAvatar({ name, url, size = 24, className }: { name: string; url: string; size?: number; className?: string }) {
  const h = host(url);
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-paper-3 text-[10px] font-semibold text-ink-2 ring-1 ring-line", className)} style={{ width: size, height: size }} aria-hidden>
      {name.slice(0, 1).toUpperCase()}
      {h && (
        // eslint-disable-next-line @next/next/no-img-element -- favicon externo
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=64`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
    </span>
  );
}

export function SiteSwitcher({ sites, currentId, action }: { sites: { id: string; name: string; url: string }[]; currentId: string; action: (fd: FormData) => Promise<void> }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const current = sites.find((s) => s.id === currentId) ?? sites[0];
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current) ref.current.open = false;
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  if (!current) return null;

  return (
    <details ref={ref} className="group relative">
      <summary
        className="flex h-11 cursor-pointer list-none items-center gap-2.5 rounded-[10px] border border-line bg-card px-2.5 text-left shadow-[var(--shadow-xs)] transition-colors hover:bg-paper-2 [&::-webkit-details-marker]:hidden"
        aria-label={`Sitio web activo: ${current.name}. Cambiar de sitio`}
      >
        <SiteAvatar name={current.name} url={current.url} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium leading-tight">{current.name}</span>
          <span className="block truncate text-[11px] leading-tight text-ink-3">{host(current.url)}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
      </summary>
      <div className="absolute left-0 right-0 top-full z-20 mt-1.5 rounded-xl border border-line bg-card p-1 shadow-[var(--shadow-lg)]">
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Tus webs</p>
        <form action={action}>
          <ul className="max-h-64 overflow-y-auto">
            {sites.map((s) => {
              const on = s.id === currentId;
              return (
                <li key={s.id}>
                  <button
                    type="submit"
                    name="site"
                    value={s.id}
                    aria-current={on ? "true" : undefined}
                    className={cn("flex h-10 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] transition-colors hover:bg-paper-2", on && "font-medium")}
                  >
                    <SiteAvatar name={s.name} url={s.url} size={22} />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    {on && <Check className="h-4 w-4 shrink-0 text-signal" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </form>
        <div className="my-1 border-t border-line" />
        <Link href="/onboarding" className="flex h-9 items-center gap-2 rounded-lg px-2 text-[13px] text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-full border border-dashed border-line-2">
            <Plus className="h-3 w-3" aria-hidden />
          </span>
          Añadir otra web
        </Link>
      </div>
    </details>
  );
}
