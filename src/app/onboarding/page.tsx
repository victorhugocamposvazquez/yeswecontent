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
    <div className="grain min-h-screen bg-paper">
      {isDemo && (
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-paper">
          <span className="mr-2 rounded-full bg-lime px-2 py-0.5 font-semibold text-ink">Modo demo</span>
          Puedes recorrer el alta completa; no se guarda nada.
        </div>
      )}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link href="/" aria-label="Volver a la portada">
          <Logo />
        </Link>
        <Link href="/panel" className="text-sm text-ink-3 hover:text-ink">
          Terminar más tarde
        </Link>
      </header>
      <main className="px-4 pb-16 pt-4">
        <Wizard plans={plans} demo={isDemo} bookingUrl={process.env.NEXT_PUBLIC_BOOKING_URL ?? null} />
      </main>
    </div>
  );
}
