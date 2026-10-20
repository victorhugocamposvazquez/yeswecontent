"use client";

import { useRef } from "react";
import Link from "next/link";
import { Globe, Plus } from "lucide-react";

export function SiteSwitcher({ sites, currentId, action }: { sites: { id: string; name: string; url: string }[]; currentId: string; action: (fd: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <div className="rounded-2xl border border-line bg-paper p-2">
      <form ref={ref} action={action} className="flex items-center gap-2">
        <Globe className="ml-1 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
        <label htmlFor="site-switch" className="sr-only">
          Sitio web activo
        </label>
        <select
          id="site-switch"
          name="site"
          defaultValue={currentId}
          onChange={() => ref.current?.requestSubmit()}
          className="min-w-0 flex-1 cursor-pointer truncate bg-transparent py-1 text-sm font-medium outline-none"
        >
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <noscript>
          <button type="submit" className="text-xs underline">
            Cambiar
          </button>
        </noscript>
      </form>
      <Link href="/onboarding" className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-3 hover:bg-paper-2 hover:text-ink">
        <Plus className="h-3.5 w-3.5" aria-hidden /> Añadir otra web
      </Link>
    </div>
  );
}
