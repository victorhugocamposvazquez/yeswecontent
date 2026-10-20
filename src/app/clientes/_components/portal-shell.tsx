"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Eye, FileBarChart, FileText, House, MessageCircle, Receipt, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; short: string; icon: typeof House; match: string };

export function PortalShell({
  children,
  brand,
  siteName,
  siteHost,
  fullAccess,
  user,
  preview,
  exitPreviewAction,
  demo,
}: {
  children: ReactNode;
  brand: ReactNode;
  siteName: string;
  siteHost: string;
  fullAccess: boolean;
  user: { name: string; email: string };
  preview: boolean;
  exitPreviewAction: () => Promise<void>;
  demo: boolean;
}) {
  const path = usePathname();
  const items: Item[] = [
    { href: "/clientes", label: "Inicio", short: "Inicio", icon: House, match: "/clientes" },
    ...(fullAccess ? [{ href: "/clientes/articulos", label: "Artículos", short: "Artículos", icon: FileText, match: "/clientes/articulos" }] : []),
    { href: "/clientes/informes", label: "Informes", short: "Informes", icon: FileBarChart, match: "/clientes/informes" },
    { href: "/clientes/facturas", label: "Facturas", short: "Facturas", icon: Receipt, match: "/clientes/facturas" },
    { href: "/clientes/ajustes/perfil", label: "Ajustes", short: "Ajustes", icon: Settings, match: "/clientes/ajustes" },
  ];
  const active = (it: Item) => (it.match === "/clientes" ? path === "/clientes" : path === it.match || path.startsWith(`${it.match}/`));
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-paper-2">
      {(preview || demo) && (
        <div className="flex min-h-7 flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-1 text-center text-[11px] text-paper/90 print:hidden">
          {preview ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" aria-hidden /> Vista previa: así ve el portal tu cliente.
              </span>
              <form action={exitPreviewAction}>
                <button type="submit" className="min-h-6 rounded-full bg-lime px-2.5 text-[11px] font-semibold text-ink transition-colors hover:bg-lime/80">
                  Salir de la vista previa
                </button>
              </form>
            </>
          ) : (
            <span>Portal de ejemplo con datos ficticios. Los cambios no se guardan.</span>
          )}
        </div>
      )}

      <div className="lg:flex">
        {/* Escritorio: barra lateral */}
        <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-4 border-r border-line bg-card px-3 py-4 lg:flex print:hidden">
          <Link href="/clientes" className="flex h-10 items-center rounded-lg px-2" aria-label="Ir al inicio">
            {brand}
          </Link>
          <div className="flex items-center gap-2.5 rounded-[10px] border border-line bg-card px-2.5 py-2 shadow-[var(--shadow-xs)]">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-signal-soft text-[11px] font-semibold text-signal" aria-hidden>
              {siteName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium leading-tight">{siteName}</span>
              <span className="block truncate text-[11px] leading-tight text-ink-3">{siteHost}</span>
            </span>
          </div>
          <nav aria-label="Portal" className="flex-1">
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Tu portal</p>
            <ul className="space-y-px">
              {items.map((it) => {
                const on = active(it);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors duration-150",
                        on ? "bg-signal-soft font-medium text-signal" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                      )}
                    >
                      <it.icon className={cn("h-4 w-4", on ? "text-signal" : "text-ink-3")} aria-hidden />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link href="/clientes/ajustes/equipo" className="flex h-9 items-center gap-2.5 rounded-[10px] border border-line bg-card px-3 text-[13px] font-medium shadow-[var(--shadow-xs)] transition-colors hover:bg-paper-2">
            <MessageCircle className="h-4 w-4 text-signal" aria-hidden /> Habla con tu equipo
          </Link>
          <div className="flex items-center gap-2.5 border-t border-line px-2 pt-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-signal text-[11px] font-semibold text-signal-ink" aria-hidden>
              {initials || "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">{user.name}</span>
              <span className="block truncate text-[11px] text-ink-3">{user.email}</span>
            </span>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Móvil: cabecera con la marca */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-card/95 px-4 backdrop-blur lg:hidden print:hidden">
            <Link href="/clientes" className="flex min-h-11 min-w-0 flex-1 items-center" aria-label="Ir al inicio">
              {brand}
            </Link>
            <Link
              href="/clientes/ajustes/equipo"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-paper-2"
              aria-label="Habla con tu equipo"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
            </Link>
          </header>

          <header className="sticky top-0 z-30 hidden h-14 items-center border-b border-line bg-card/95 px-6 backdrop-blur lg:flex print:hidden">
            <p className="text-[13px] font-medium text-ink">{items.find(active)?.label ?? "Inicio"}</p>
            <span className="ml-auto truncate text-[13px] text-ink-3">{siteHost}</span>
          </header>
          <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7 print:p-0">{children}</main>
        </div>
      </div>

      {/* Móvil: barra de pestañas inferior */}
      <nav
        aria-label="Portal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--line)] backdrop-blur-md lg:hidden print:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {items.map((it) => {
            const on = active(it);
            return (
              <li key={it.href} className="flex-1">
                <Link
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors", on ? "text-signal" : "text-ink-3")}
                >
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", on && "bg-signal-soft")}>
                    <it.icon className="h-5 w-5" aria-hidden strokeWidth={on ? 2.4 : 2} />
                  </span>
                  {it.short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
