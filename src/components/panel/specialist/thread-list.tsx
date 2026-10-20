"use client";

import { SquarePen, Trash } from "lucide-react";
import type { ThreadSummary } from "@/lib/panel/specialist-types";
import { cn, fmtDate } from "@/lib/utils";

export function ThreadList({
  threads,
  activeId,
  busy,
  onSelect,
  onNew,
  onDelete,
}: {
  threads: ThreadSummary[];
  activeId: string | null;
  busy?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        onClick={onNew}
        disabled={busy}
        className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm font-medium hover:bg-paper-2 disabled:opacity-50"
      >
        <SquarePen className="h-4 w-4 text-signal" aria-hidden /> Nueva conversación
      </button>
      <p className="mb-1 mt-4 px-1 text-[11px] font-medium uppercase tracking-wide text-ink-3">Conversaciones</p>
      {threads.length === 0 ? (
        <p className="px-1 text-sm text-ink-3">Aún no has preguntado nada. Empieza por una de las sugerencias.</p>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1">
          {threads.map((t) => {
            const active = t.id === activeId;
            return (
              <li key={t.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(t.id)}
                  disabled={busy && !active}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 w-full flex-col justify-center rounded-lg py-2 pl-3 pr-11 text-left disabled:opacity-50",
                    active ? "bg-paper-2" : "hover:bg-paper-2",
                  )}
                >
                  <span className={cn("block truncate text-sm", active ? "font-medium text-ink" : "text-ink-2")}>{t.title}</span>
                  <span className="block text-xs text-ink-3">{fmtDate(t.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(t.id)}
                  disabled={busy}
                  className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-ink-3 hover:text-bad disabled:opacity-40 lg:opacity-0 lg:focus:opacity-100 lg:group-hover:opacity-100"
                  aria-label={`Eliminar «${t.title}»`}
                >
                  <Trash className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
