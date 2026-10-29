"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Globe,
  Inbox,
  Layers,
  LayoutDashboard,
  Link2,
  ListOrdered,
  Megaphone,
  Settings,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const adminNav = [
  { group: "General", items: [{ href: "/admin", label: "Resumen", icon: LayoutDashboard }] },
  {
    group: "Clientes",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
      { href: "/admin/sitios", label: "Sitios", icon: Globe },
      { href: "/admin/suscripciones", label: "Suscripciones", icon: CreditCard },
      { href: "/admin/planes", label: "Planes", icon: Layers },
    ],
  },
  {
    group: "Operación",
    items: [
      { href: "/admin/cola", label: "Cola de contenido", icon: ListOrdered },
      { href: "/admin/costes", label: "Coste IA", icon: Wallet },
      { href: "/admin/enlaces", label: "Red de enlaces", icon: Link2 },
      { href: "/admin/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    group: "Web pública",
    items: [
      { href: "/admin/casos", label: "Casos de éxito", icon: Trophy },
      { href: "/admin/novedades", label: "Novedades", icon: Megaphone },
    ],
  },
  { group: "Sistema", items: [{ href: "/admin/ajustes", label: "Ajustes", icon: Settings }] },
];

const flat = adminNav.flatMap((g) => g.items);

/** Etiqueta de la sección actual (para las migas del encabezado). */
export function sectionFor(path: string) {
  return flat.find((i) => (i.href === "/admin" ? path === "/admin" : path.startsWith(i.href)));
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Administración" className="space-y-4">
      {adminNav.map((g) => (
        <div key={g.group}>
          <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{g.group}</p>
          <ul className="space-y-px">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors lg:min-h-8",
                      "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-lime",
                      active ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-lime" />}
                    <Icon className={cn("size-4 shrink-0", active ? "opacity-100" : "opacity-70")} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
