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
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/sitios", label: "Sitios", icon: Globe },
  { href: "/admin/suscripciones", label: "Suscripciones", icon: CreditCard },
  { href: "/admin/planes", label: "Planes", icon: Layers },
  { href: "/admin/cola", label: "Cola de contenido", icon: ListOrdered },
  { href: "/admin/enlaces", label: "Red de enlaces", icon: Link2 },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/casos", label: "Casos de éxito", icon: Trophy },
  { href: "/admin/novedades", label: "Novedades", icon: Megaphone },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Administración" className="space-y-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition focus-visible:outline-2 focus-visible:outline-lime",
              active ? "bg-white/12 text-paper font-medium" : "text-paper/75 hover:bg-white/10 hover:text-paper",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
