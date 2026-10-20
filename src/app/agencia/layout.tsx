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
    <div className="min-h-dvh bg-paper">
      {isDemo && (
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-paper">
          <span className="mr-2 rounded-full bg-lime px-2 py-0.5 font-semibold text-ink">Modo demo</span>
          Agencia de ejemplo «Nido Studio». Los cambios no se guardan.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 md:px-8">
          <Link href="/agencia/clientes" className="flex min-h-11 items-center" aria-label="Clientes de la agencia">
            <Logo className="scale-90 sm:scale-100" />
          </Link>
          {ctx && <span className="hidden truncate rounded-full bg-paper-2 px-3 py-1 text-xs font-medium text-ink-2 sm:inline">Agencia · {agencyName(ctx.agency)}</span>}
          <nav aria-label="Agencia" className="ml-auto flex items-center gap-1">
            <Link href="/agencia/clientes" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-paper-2">
              <Users className="h-4 w-4 text-signal" aria-hidden /> Clientes
            </Link>
            <Link href="/panel" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink-2 hover:bg-paper-2">
              <ArrowLeft className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Volver al</span> panel
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        {ctx ? (
          children
        ) : (
          <div className="mx-auto max-w-md py-16 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Esta sección es para agencias</h1>
            <p className="mt-2 text-[15px] text-ink-2">
              Tu espacio de trabajo no es de tipo agencia. Con el plan Agencia puedes gestionar varias webs de clientes y darles un portal con tu marca.
            </p>
            <Link href="/panel/ajustes/facturacion" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-signal px-5 text-[15px] font-semibold text-signal-ink">
              Ver planes
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
