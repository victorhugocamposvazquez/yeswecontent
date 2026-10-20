"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/clientes/ajustes/perfil", label: "Perfil" },
  { href: "/clientes/ajustes/miembros", label: "Miembros" },
  { href: "/clientes/ajustes/branding", label: "Tu marca" },
  { href: "/clientes/ajustes/hosting", label: "Dominio y CMS" },
  { href: "/clientes/ajustes/equipo", label: "Habla con tu equipo" },
];

export function SettingsNav() {
  const path = usePathname();
  return (
    <nav aria-label="Ajustes" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 pb-1">
        {ITEMS.map((it) => {
          const on = path === it.href;
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition",
                  on ? "border-signal bg-signal font-semibold text-signal-ink" : "border-line bg-card text-ink-2 hover:border-ink",
                )}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
