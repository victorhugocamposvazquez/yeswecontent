import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/marketing/auth-forms";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false } };

export default function NuevaClavePage() {
  return (
    <>
      <h1 className="font-display text-[1.75rem] sm:text-[2rem]">Elige una contraseña nueva.</h1>
      <p className="mt-2 mb-6 text-[15px] text-ink-2">Al menos 8 caracteres. Mejor si no es la de siempre.</p>
      <NewPasswordForm />
    </>
  );
}
