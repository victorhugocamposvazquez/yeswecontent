"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
  MessagesSquare,
  Plug,
  Users,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV: { group: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  { group: "", items: [{ href: "/panel", label: "Resumen", icon: LayoutDashboard }] },
  {
    group: "Contenido",
    items: [
      { href: "/panel/plan", label: "Plan de contenidos", icon: CalendarDays },
      { href: "/panel/articulos", label: "Artículos", icon: FileText },
      { href: "/panel/social", label: "Social", icon: Share2 },
    ],
  },
  {
    group: "Crecimiento",
    items: [
      { href: "/panel/visibilidad-ia", label: "Visibilidad IA", icon: Sparkles },
      { href: "/panel/auditoria", label: "Auditoría", icon: ShieldCheck },
      { href: "/panel/enlaces", label: "Enlaces", icon: Link2 },
      { href: "/panel/especialista", label: "Especialista SEO", icon: MessagesSquare },
      { href: "/agencia/clientes", label: "Clientes (agencia)", icon: Users },
    ],
  },
  {
    group: "Resultados",
    items: [
      { href: "/panel/analitica", label: "Analítica", icon: BarChart3 },
      { href: "/panel/integraciones", label: "Integraciones", icon: Plug },
      { href: "/panel/informes", label: "Informes", icon: FileBarChart },
      { href: "/panel/novedades", label: "Novedades", icon: Megaphone },
    ],
  },
];

function isActive(path: string, href: string) {
  return href === "/panel" ? path === "/panel" : path === href || path.startsWith(`${href}/`);
}

export function PanelShell({
  children,
  siteSwitcher,
  topBadge,
  user,
  isAdmin,
  isDemo,
  logoutAction,
}: {
  children: ReactNode;
  siteSwitcher: ReactNode;
  topBadge: ReactNode;
  user: { name: string; email: string };
  isAdmin: boolean;
  isDemo: boolean;
  logoutAction: () => Promise<void>;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
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

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <Link href="/panel" aria-label="Ir al resumen">
          <Logo />
        </Link>
        <button type="button" className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-paper-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú">
          <X className="h-5 w-5" />
        </button>
      </div>
      {siteSwitcher}
      <nav aria-label="Panel" className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1">
        {NAV.map((g) => (
          <div key={g.group || "main"}>
            {g.group && <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">{g.group}</p>}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(path, it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition lg:py-1.5 lg:text-[13px]",
                        active ? "bg-paper-2 font-medium text-ink" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                      )}
                    >
                      <it.icon className={cn("h-4 w-4", active ? "text-signal" : "text-ink-3")} aria-hidden />
                      {it.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-line pt-4">
        <Link
          href="/panel/ajustes/cuenta"
          aria-current={path.startsWith("/panel/ajustes") ? "page" : undefined}
          className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm lg:py-1.5 lg:text-[13px]", path.startsWith("/panel/ajustes") ? "bg-paper-2 font-medium text-ink" : "text-ink-2 hover:bg-paper-2")}
        >
          <Settings className="h-4 w-4" aria-hidden /> Ajustes
        </Link>
        {isAdmin && (
          <Link href="/admin" className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm text-ink-2 lg:py-1.5 lg:text-[13px] hover:bg-paper-2">
            <Shield className="h-4 w-4" aria-hidden /> Administración
          </Link>
        )}
        <details className="group relative mt-2">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-2 py-2 hover:bg-paper-2 [&::-webkit-details-marker]:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-xs font-bold text-ink" aria-hidden>
              {initials || "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-ink-3">{user.email}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-3 transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-line bg-card p-1 shadow-lg">
            <Link href="/panel/ajustes/cuenta" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-paper-2 lg:py-2">
              Mi cuenta
            </Link>
            <Link href="/panel/ajustes/facturacion" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-paper-2 lg:py-2">
              Facturación
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-bad hover:bg-paper-2 lg:py-2">
                <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      {isDemo && (
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-paper print:hidden">
          <span className="mr-2 rounded-full bg-lime px-2 py-0.5 font-semibold text-ink">Modo demo</span>
          Estás viendo datos de ejemplo de Tierrafina. Los cambios no se guardan.
        </div>
      )}
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-card lg:block print:hidden">{sidebar}</aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel">
            <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-card pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-xl">{sidebar}</aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-paper/90 px-4 py-2 backdrop-blur md:px-8 lg:gap-3 lg:py-3 print:hidden">
            <button type="button" className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-paper-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/panel" aria-label="Ir al resumen" className="min-w-0 lg:hidden">
              <Logo className="origin-left scale-90" />
            </Link>
            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2">{topBadge}</div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
