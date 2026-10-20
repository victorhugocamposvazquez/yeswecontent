import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/marketing/auth-forms";

export const metadata: Metadata = { title: "Recuperar contraseña", robots: { index: false } };

export default function RecuperarPage() {
  return (
    <>
      <h1 className="font-display text-5xl leading-tight">¿Contraseña en el limbo?</h1>
      <p className="mt-2 mb-8 text-ink-2">Escribe tu email y te mandamos un enlace para crear una nueva.</p>
      <ResetForm />
      <p className="mt-8 text-center text-sm text-ink-2">
        <Link href="/entrar" className="font-semibold text-ink underline underline-offset-4">
          Volver a entrar
        </Link>
      </p>
    </>
  );
}
