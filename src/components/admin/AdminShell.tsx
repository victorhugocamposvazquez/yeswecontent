"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
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
        <Link href="/panel" className="inline-flex items-center gap-1.5 font-medium text-paper hover:text-lime">
          <ArrowLeft className="size-3.5" aria-hidden /> Volver al panel
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ email, demo, banner, children }: { email: string; demo: boolean; banner?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-ink text-paper lg:block">
        <SidebarBody email={email} demo={demo} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-paper lg:hidden">
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
          className="rounded-lg p-2 hover:bg-white/10"
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
      >
        <div className={cn("absolute inset-0 bg-ink/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute inset-y-0 left-0 w-72 bg-ink text-paper transition-transform", open ? "translate-x-0" : "-translate-x-full")}>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="absolute right-3 top-3 rounded-lg p-2 hover:bg-white/10">
            <X className="size-5" aria-hidden />
          </button>
          <SidebarBody email={email} demo={demo} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <div className="min-w-0">
        {banner}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
