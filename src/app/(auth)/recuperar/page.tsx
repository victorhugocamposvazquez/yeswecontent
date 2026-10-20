import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/marketing/auth-forms";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };

export default function RecuperarPage() {
  return (
    <>
      <h1 className="font-display text-[1.75rem] sm:text-[2rem]">¿Contraseña en el limbo?</h1>
      <p className="mt-2 mb-6 text-[15px] text-ink-2">Escribe tu email y te mandamos un enlace para crear una nueva.</p>
      <ResetForm />
      <p className="mt-6 text-center text-sm text-ink-2">
        <Link href="/entrar" className="inline-block py-1 font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
          Volver a entrar
        </Link>
      </p>
    </>
  );
}
