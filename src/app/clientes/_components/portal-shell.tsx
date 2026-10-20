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
    <div className="min-h-dvh bg-paper">
      {(preview || demo) && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-4 py-2 text-center text-xs text-paper print:hidden">
          {preview ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" aria-hidden /> Vista previa: así ve el portal tu cliente.
              </span>
              <form action={exitPreviewAction}>
                <button type="submit" className="min-h-8 rounded-full bg-paper px-3 font-semibold text-ink hover:bg-paper-2">
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
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-line bg-card px-4 py-5 lg:flex print:hidden">
          <Link href="/clientes" className="flex min-h-11 items-center rounded-lg px-1" aria-label="Ir al inicio">
            {brand}
          </Link>
          <div className="rounded-xl bg-paper-2 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-ink-3">Tu web</p>
            <p className="truncate text-sm font-medium">{siteName}</p>
            <p className="truncate text-xs text-ink-3">{siteHost}</p>
          </div>
          <nav aria-label="Portal" className="flex-1">
            <ul className="space-y-1">
              {items.map((it) => {
                const on = active(it);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition",
                        on ? "bg-signal/10 font-semibold text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                      )}
                    >
                      <it.icon className={cn("h-[18px] w-[18px]", on ? "text-signal" : "text-ink-3")} aria-hidden />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link href="/clientes/ajustes/equipo" className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm font-medium hover:border-signal">
            <MessageCircle className="h-[18px] w-[18px] text-signal" aria-hidden /> Habla con tu equipo
          </Link>
          <div className="flex items-center gap-3 border-t border-line pt-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-signal/15 text-xs font-bold text-signal" aria-hidden>
              {initials || "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-ink-3">{user.email}</span>
            </span>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Móvil: cabecera con la marca */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/90 px-4 py-2 backdrop-blur lg:hidden print:hidden">
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

          <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10 print:p-0">{children}</main>
        </div>
      </div>

      {/* Móvil: barra de pestañas inferior */}
      <nav
        aria-label="Portal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {items.map((it) => {
            const on = active(it);
            return (
              <li key={it.href} className="flex-1">
                <Link
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium", on ? "text-signal" : "text-ink-3")}
                >
                  <it.icon className="h-5 w-5" aria-hidden strokeWidth={on ? 2.4 : 2} />
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
