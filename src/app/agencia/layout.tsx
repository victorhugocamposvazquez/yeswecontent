import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { Logo } from "@/components/ui";
import { agencyName, getAgencyContext } from "@/lib/clientes/data";
import { isDemo } from "@/lib/env";

export const metadata: Metadata = { title: { default: "Agencia", template: "%s · Agencia · yeswecontent" }, robots: { index: false } };

/** Zona de la agencia (marca yeswecontent): gestiona los clientes que ven el portal de marca blanca. */
export default async function AgencyLayout({ children }: { children: ReactNode }) {
  const ctx = await getAgencyContext();
  if (ctx === "login") redirect("/entrar?next=/agencia/clientes");

  return (
    <div className="min-h-dvh bg-paper-2">
      {isDemo && (
        <div className="flex h-7 items-center justify-center gap-2 bg-ink px-4 text-[11px] text-paper/90">
          <span className="rounded-full bg-lime px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink">Demo</span>
          Agencia de ejemplo «Nido Studio». Los cambios no se guardan.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
          <Link href="/agencia/clientes" className="flex min-h-11 items-center" aria-label="Clientes de la agencia">
            <Logo className="scale-90 sm:scale-100" />
          </Link>
          {ctx && <span className="hidden truncate rounded-full border border-line bg-paper-2 px-2.5 py-0.5 text-xs font-medium text-ink-2 sm:inline">Agencia · {agencyName(ctx.agency)}</span>}
          <nav aria-label="Agencia" className="ml-auto flex items-center gap-1">
            <Link href="/agencia/clientes" className="inline-flex h-9 items-center gap-2 rounded-lg bg-signal-soft px-3 text-[13px] font-medium text-signal max-sm:h-11">
              <Users className="h-4 w-4" aria-hidden /> Clientes
            </Link>
            <Link href="/panel" className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink max-sm:h-11">
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Volver al</span> panel
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-7">
        {ctx ? (
          children
        ) : (
          <div className="mx-auto max-w-md py-16 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Esta sección es para agencias</h1>
            <p className="mt-2 text-[15px] text-ink-2">
              Tu espacio de trabajo no es de tipo agencia. Con el plan Agencia puedes gestionar varias webs de clientes y darles un portal con tu marca.
            </p>
            <Link href="/panel/ajustes/facturacion" className="mt-5 inline-flex min-h-11 items-center rounded-[10px] bg-signal px-4.5 text-sm font-semibold text-signal-ink shadow-[var(--shadow-xs)]">
              Ver planes
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
