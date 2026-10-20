import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { listPlans } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { Wizard } from "./wizard";

export const metadata: Metadata = { title: "Configura tu cuenta", robots: { index: false } };

export default async function OnboardingPage() {
  const plans = await listPlans();
  return (
    <div className="glow min-h-screen bg-paper-2">
      {isDemo && (
        <div className="flex h-7 items-center justify-center gap-2 bg-ink px-4 text-[11px] text-paper/90">
          <span className="rounded-full bg-lime px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink">Demo</span>
          Puedes recorrer el alta completa; no se guarda nada.
        </div>
      )}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:py-5">
        <Link href="/" aria-label="Volver a la portada">
          <Logo />
        </Link>
        <Link href="/panel" className="-mr-2 inline-flex min-h-11 items-center rounded-lg px-2 text-[13px] text-ink-3 transition-colors hover:text-ink">
          Terminar más tarde
        </Link>
      </header>
      <main className="px-4 pb-8 pt-2 sm:pb-16 sm:pt-4">
        <Wizard plans={plans} demo={isDemo} bookingUrl={process.env.NEXT_PUBLIC_BOOKING_URL ?? null} />
      </main>
    </div>
  );
}
