"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AdminNav } from "./AdminNav";

function SidebarBody({ email, demo, onNavigate }: { email: string; demo: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2 px-2 pt-2">
        <Logo inverted className="scale-90 origin-left" />
        <span className="rounded-md bg-lime px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">Admin</span>
      </div>
      <AdminNav onNavigate={onNavigate} />
      <div className="mt-auto space-y-3 border-t border-white/10 px-2 pt-4 text-xs text-paper/60">
        {demo && <p className="rounded-lg bg-white/5 px-3 py-2 text-paper/80">Modo demo: los cambios no se guardan.</p>}
        <p className="truncate" title={email}>
          {email}
        </p>
        <Link href="/panel" className="inline-flex min-h-10 items-center gap-1.5 font-medium text-paper hover:text-lime lg:min-h-0">
          <ArrowLeft className="size-3.5" aria-hidden /> Volver al panel
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ email, demo, banner, children }: { email: string; demo: boolean; banner?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-ink text-paper lg:block">
        <SidebarBody email={email} demo={demo} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-2 text-paper lg:hidden">
        <div className="flex items-center gap-2">
          <Logo inverted className="scale-90 origin-left" />
          <span className="rounded-md bg-lime px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú de administración"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="-mr-2 grid size-11 place-items-center rounded-lg hover:bg-white/10"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </header>

      <div
        id="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de administración"
        className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")}
        inert={!open}
      >
        <div className={cn("absolute inset-0 bg-ink/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-ink pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-paper transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="absolute right-2 top-[calc(env(safe-area-inset-top)+0.5rem)] grid size-11 place-items-center rounded-lg hover:bg-white/10">
            <X className="size-5" aria-hidden />
          </button>
          <SidebarBody email={email} demo={demo} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <div className="min-w-0">
        {banner}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
