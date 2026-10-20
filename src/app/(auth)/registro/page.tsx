import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SignUpForm } from "@/components/marketing/auth-forms";

export const metadata: Metadata = {
  title: "Crea tu cuenta",
  description: "Empieza tu prueba gratuita de 3 días de yeswecontent.",
  alternates: { canonical: "/registro" },
};

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ plan?: string; periodo?: string }> }) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.plan && /^[a-z0-9-]{1,40}$/.test(sp.plan)) q.set("plan", sp.plan);
  if (sp.periodo === "anual" || sp.periodo === "mensual") q.set("periodo", sp.periodo);
  const next = q.size ? `/onboarding?${q}` : "/onboarding";
  return (
    <>
      <p className="eyebrow">3 días gratis</p>
      <h1 className="mt-3 font-display text-[1.75rem] sm:text-[2rem]">
        Vamos a ponerle <span className="marker">piloto automático</span> a tu web.
      </h1>
      <ul className="mt-4 mb-6 space-y-1.5 text-[13px] text-ink-2">
        {["Plan de contenidos y primeros artículos en la prueba", "Sin permanencia, cancelas desde el panel", "Garantía de 60 días"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-ok" aria-hidden /> {t}
          </li>
        ))}
      </ul>
      <SignUpForm next={next} />
      <p className="mt-6 text-center text-sm text-ink-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="inline-block py-1 font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
          Entra
        </Link>
      </p>
    </>
  );
}
