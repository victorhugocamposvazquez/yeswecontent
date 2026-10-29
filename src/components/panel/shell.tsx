"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
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
import { SETTINGS_SECTIONS } from "./settings-config";

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

const TITLES: Record<string, string> = {
  "/panel": "Resumen",
  "/panel/plan": "Plan de contenidos",
  "/panel/articulos": "Artículos",
  "/panel/social": "Social",
  "/panel/visibilidad-ia": "Visibilidad IA",
  "/panel/auditoria": "Auditoría",
  "/panel/enlaces": "Enlaces",
  "/panel/especialista": "Especialista SEO",
  "/panel/analitica": "Analítica",
  "/panel/integraciones": "Integraciones",
  "/panel/informes": "Informes",
  "/panel/novedades": "Novedades",
  "/panel/ajustes": "Ajustes",
};

function isActive(path: string, href: string) {
  return href === "/panel" ? path === "/panel" : path === href || path.startsWith(`${href}/`);
}

/** Migas de pan a partir de la ruta: Panel › Sección › (detalle). */
function crumbsFor(path: string): { label: string; href?: string }[] {
  if (path === "/panel") return [{ label: "Resumen" }];
  const parts = path.split("/").filter(Boolean); // ["panel", "articulos", "a_1"]
  const section = `/${parts.slice(0, 2).join("/")}`;
  const label = TITLES[section] ?? parts[1];
  const out: { label: string; href?: string }[] = [{ label: "Panel", href: "/panel" }];
  if (parts.length > 2) {
    out.push({ label, href: section });
    const setting = section === "/panel/ajustes" ? SETTINGS_SECTIONS.flatMap((g) => g.items).find((s) => s.id === parts[2])?.label : null;
    out.push({ label: setting ?? (section === "/panel/ajustes" ? parts[2] : "Detalle") });
  } else out.push({ label });
  return out;
}

const navItem = "group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors duration-150";
const navActive = "bg-signal-soft font-medium text-signal";
const navIdle = "text-ink-2 hover:bg-paper-2 hover:text-ink";

export function PanelShell({
  children,
  siteSwitcher,
  topBadge,
  user,
  isAdmin,
  isDemo,
  isAgency = false,
  logoutAction,
}: {
  children: ReactNode;
  siteSwitcher: ReactNode;
  topBadge: ReactNode;
  user: { name: string; email: string };
  isAdmin: boolean;
  isDemo: boolean;
  isAgency?: boolean;
  logoutAction: () => Promise<void>;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const userMenu = useRef<HTMLDetailsElement>(null);
  const topMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    setOpen(false);
    if (userMenu.current) userMenu.current.open = false;
    if (topMenu.current) topMenu.current.open = false;
  }, [path]);
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
  // Cierra los menús desplegables al hacer clic fuera.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      for (const ref of [userMenu, topMenu]) {
        const el = ref.current;
        if (el?.open && !el.contains(e.target as Node)) el.open = false;
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const crumbs = crumbsFor(path);
  const settingsActive = path.startsWith("/panel/ajustes");

  const userLinks = (
    <>
      <Link href="/panel/ajustes/cuenta" className="block rounded-md px-2.5 py-2 text-[13px] text-ink-2 hover:bg-paper-2 hover:text-ink">
        Mi cuenta
      </Link>
      <Link href="/panel/ajustes/facturacion" className="block rounded-md px-2.5 py-2 text-[13px] text-ink-2 hover:bg-paper-2 hover:text-ink">
        Facturación
      </Link>
      {isAdmin && (
        <Link href="/admin" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-ink-2 hover:bg-paper-2 hover:text-ink">
          <Shield className="h-3.5 w-3.5" aria-hidden /> Administración
        </Link>
      )}
      <div className="my-1 border-t border-line" />
      <form action={logoutAction}>
        <button type="submit" className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-bad hover:bg-bad-soft">
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Cerrar sesión
        </button>
      </form>
    </>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <Link href="/panel" aria-label="Ir al resumen" className="flex items-center">
          <Logo />
        </Link>
        <button type="button" className="-mr-2 grid h-11 w-11 place-items-center rounded-lg text-ink-2 hover:bg-paper-2 lg:hidden" onClick={() => setOpen(false)} aria-label="Cerrar menú">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="px-3 pb-3 pt-1">{siteSwitcher}</div>
      <nav aria-label="Panel" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-3">
        {NAV.map((g) => (
          <div key={g.group || "main"}>
            {g.group && <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{g.group}</p>}
            <ul className="space-y-px">
              {g.items
                .filter((it) => isAgency || it.href !== "/agencia/clientes")
                .map((it) => {
                const active = isActive(path, it.href);
                return (
                  <li key={it.href}>
                    <Link href={it.href} aria-current={active ? "page" : undefined} className={cn(navItem, "max-lg:h-10 max-lg:text-sm", active ? navActive : navIdle)}>
                      <it.icon className={cn("h-4 w-4 shrink-0", active ? "text-signal" : "text-ink-3 group-hover:text-ink-2")} strokeWidth={active ? 2.2 : 2} aria-hidden />
                      <span className="truncate">{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 space-y-px border-t border-line px-3 py-3">
        <Link href="/panel/ajustes/cuenta" aria-current={settingsActive ? "page" : undefined} className={cn(navItem, "max-lg:h-10 max-lg:text-sm", settingsActive ? navActive : navIdle)}>
          <Settings className={cn("h-4 w-4", settingsActive ? "text-signal" : "text-ink-3")} aria-hidden /> Ajustes
        </Link>
        {isAdmin && (
          <Link href="/admin" className={cn(navItem, "max-lg:h-10 max-lg:text-sm", navIdle)}>
            <Shield className="h-4 w-4 text-ink-3" aria-hidden /> Administración
          </Link>
        )}
        <details ref={userMenu} className="group relative mt-1.5">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-paper-2 [&::-webkit-details-marker]:hidden">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper" aria-hidden>
              {initials || "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{user.name}</span>
              <span className="block truncate text-[11px] text-ink-3">{user.email}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="absolute bottom-full left-0 right-0 z-10 mb-1.5 rounded-xl border border-line bg-card p-1 shadow-[var(--shadow-lg)]">{userLinks}</div>
        </details>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper-2">
      {isDemo && (
        <div className="flex h-7 items-center justify-center gap-2 bg-ink px-4 text-[11px] text-paper/90 print:hidden">
          <span className="rounded-full bg-lime px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink">Demo</span>
          <span className="truncate">Datos de ejemplo de Tierrafina. Los cambios no se guardan.</span>
        </div>
      )}
      <div className="flex">
        <aside className={cn("sticky top-0 hidden w-[248px] shrink-0 border-r border-line bg-card lg:block print:hidden", isDemo ? "h-[calc(100vh-28px)]" : "h-screen")}>{sidebar}</aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú del panel">
            <button type="button" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] overflow-y-auto bg-card pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-[var(--shadow-lg)]">{sidebar}</aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-card/95 px-3 backdrop-blur md:px-6 print:hidden">
            <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-paper-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/panel" aria-label="Ir al resumen" className="flex min-w-0 items-center lg:hidden">
              <Logo compact />
            </Link>
            <nav aria-label="Ubicación" className="hidden min-w-0 items-center gap-1 text-[13px] lg:flex">
              {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />}
                  {c.href ? (
                    <Link href={c.href} className="truncate text-ink-3 transition-colors hover:text-ink">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium text-ink">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
              <div className="min-w-0 [&_a]:min-h-0">{topBadge}</div>
              <Link href="/panel/novedades" className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink" aria-label="Novedades">
                <Bell className="h-[18px] w-[18px]" aria-hidden />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-signal ring-2 ring-card" aria-hidden />
              </Link>
              <Link href="/panel/especialista" className="hidden h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink sm:grid" aria-label="Ayuda">
                <CircleHelp className="h-[18px] w-[18px]" aria-hidden />
              </Link>
              <details ref={topMenu} className="relative hidden lg:block">
                <summary className="ml-1 grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full bg-ink text-[11px] font-semibold text-paper ring-2 ring-transparent transition hover:ring-line-2 [&::-webkit-details-marker]:hidden" aria-label="Menú de usuario">
                  {initials || "?"}
                </summary>
                <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-line bg-card p-1 shadow-[var(--shadow-lg)]">
                  <div className="px-2.5 py-2">
                    <p className="truncate text-[13px] font-medium">{user.name}</p>
                    <p className="truncate text-[11px] text-ink-3">{user.email}</p>
                  </div>
                  <div className="my-1 border-t border-line" />
                  {userLinks}
                </div>
              </details>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-7 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
