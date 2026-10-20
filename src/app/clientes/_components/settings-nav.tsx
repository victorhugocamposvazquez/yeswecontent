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
    <nav aria-label="Ajustes" className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-0.5 border-b border-line">
        {ITEMS.map((it) => {
          const on = path === it.href;
          return (
            <li key={it.href} className="shrink-0">
              <Link
                href={it.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative -mb-px inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-[13px] font-medium transition-colors duration-150 md:min-h-10",
                  on ? "border-signal text-ink" : "border-transparent text-ink-3 hover:border-line-2 hover:text-ink",
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
