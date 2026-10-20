"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight, Megaphone, Menu, Search, Trophy, X } from "lucide-react";
import { Kbd, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AdminNav, sectionFor } from "./AdminNav";

export type EnvCheck = { label: string; ok: boolean };

function AdminBadge() {
  return <span className="rounded-md bg-lime px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink">Admin</span>;
}

function SidebarBody({ email, demo, env, onNavigate }: { email: string; demo: boolean; env: EnvCheck[]; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 p-3">
      <div className="flex h-[52px] items-center gap-2 px-2.5">
        <Logo inverted className="origin-left scale-[0.85]" />
        <AdminBadge />
      </div>
      <AdminNav onNavigate={onNavigate} />
      <div className="mt-auto space-y-3 border-t border-white/[0.08] px-2.5 pt-4 text-xs text-white/55">
        <div className="space-y-1.5">
          <p className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Entorno</span>
            <span className={cn("rounded px-1.5 py-px font-mono text-[10px] font-semibold uppercase", demo ? "bg-warn/20 text-warn" : "bg-ok/20 text-ok")}>{demo ? "demo" : "prod"}</span>
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {env.map((e) => (
              <li key={e.label} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={cn("size-1.5 rounded-full", e.ok ? "bg-ok" : "bg-white/25")} />
                <span className={cn(e.ok ? "text-white/70" : "text-white/40")}>{e.label}</span>
                <span className="sr-only">{e.ok ? "configurado" : "sin configurar"}</span>
              </li>
            ))}
          </ul>
          {demo && <p className="text-[11px] text-white/45">Los cambios no se guardan.</p>}
        </div>
        <p className="truncate text-white/45" title={email}>
          {email}
        </p>
        <Link href="/panel" className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-medium text-white/85 hover:text-lime lg:min-h-8">
          <ArrowLeft className="size-3.5" aria-hidden /> Volver al panel
        </Link>
      </div>
    </div>
  );
}

function Crumbs({ path }: { path: string }) {
  const section = sectionFor(path);
  const rest = section && section.href !== "/admin" ? path.slice(section.href.length).split("/").filter(Boolean) : [];
  const tail = rest.length ? (rest[0] === "nuevo" ? "Nuevo" : "Detalle") : null;
  return (
    <ol className="flex min-w-0 items-center gap-1 text-[13px] text-ink-3" aria-label="Ruta">
      <li className="hidden sm:block">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
      </li>
      {section && section.href !== "/admin" && (
        <>
          <li className="hidden sm:block" aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li className="min-w-0 truncate">
            {tail ? (
              <Link href={section.href} className="hover:text-ink">
                {section.label}
              </Link>
            ) : (
              <span className="font-medium text-ink">{section.label}</span>
            )}
          </li>
        </>
      )}
      {tail && (
        <>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li className="font-medium text-ink">{tail}</li>
        </>
      )}
      {section?.href === "/admin" && <li className="font-medium text-ink sm:hidden">Resumen</li>}
    </ol>
  );
}

export function AdminShell({ email, demo, env = [], banner, children }: { email: string; demo: boolean; env?: EnvCheck[]; banner?: ReactNode; children: ReactNode }) {
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
    <div className="min-h-screen bg-paper-2 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-white/[0.08] bg-[#141414] text-white lg:block">
        <SidebarBody email={email} demo={demo} env={env} />
      </aside>

      {/* Cajón de navegación en móvil */}
      <div
        id="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de administración"
        className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")}
        inert={!open}
      >
        <div className={cn("absolute inset-0 bg-ink/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-white/[0.08] bg-[#141414] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="absolute right-2 top-[calc(env(safe-area-inset-top)+0.5rem)] grid size-11 place-items-center rounded-lg text-white/80 hover:bg-white/10"
          >
            <X className="size-5" aria-hidden />
          </button>
          <SidebarBody email={email} demo={demo} env={env} onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-[52px] items-center gap-2 border-b border-line bg-card px-3 sm:px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú de administración"
            aria-expanded={open}
            aria-controls="admin-drawer"
            className="-ml-1 grid size-11 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-paper-2 lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="lg:hidden">
            <AdminBadge />
          </span>
          <div className="min-w-0 flex-1">
            <Crumbs path={path} />
          </div>

          {/* Búsqueda global (stub) */}
          <form role="search" className="hidden md:block" onSubmit={(e) => e.preventDefault()}>
            <label className="relative block">
              <span className="sr-only">Buscar en el admin</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                type="search"
                placeholder="Buscar usuario, sitio, sub_…"
                className="h-8 w-56 rounded-lg border border-line bg-paper-2 pl-8 pr-14 text-[13px] text-ink outline-none transition placeholder:text-ink-3 hover:border-line-2 focus:border-signal focus:bg-card focus:shadow-[var(--ring)] lg:w-72"
              />
              <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
                <Kbd>⌘K</Kbd>
              </span>
            </label>
          </form>
          <button type="button" aria-label="Buscar" className="grid size-11 place-items-center rounded-lg text-ink-2 hover:bg-paper-2 md:hidden">
            <Search className="size-[18px]" aria-hidden />
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/admin/casos/nuevo" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink" title="Nuevo caso de éxito">
              <Trophy className="size-3.5 opacity-70" aria-hidden /> <span className="hidden xl:inline">Nuevo caso</span>
            </Link>
            <Link href="/admin/novedades/nuevo" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink" title="Nueva novedad">
              <Megaphone className="size-3.5 opacity-70" aria-hidden /> <span className="hidden xl:inline">Nueva novedad</span>
            </Link>
          </div>
        </header>

        {banner}
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
