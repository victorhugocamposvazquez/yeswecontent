import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/marketing/auth-forms";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

const errors: Record<string, string> = {
  enlace: "El enlace no es válido o ha caducado. Pide uno nuevo.",
  oauth: "No hemos podido conectar con Google. Inténtalo de nuevo.",
};

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/panel";
  return (
    <>
      <h1 className="font-display text-[1.75rem] sm:text-[2rem]">Hola de nuevo.</h1>
      <p className="mt-2 mb-6 text-[15px] text-ink-2">Entra para ver qué ha publicado tu web esta semana.</p>
      <SignInForm next={next} initialError={sp.error ? errors[sp.error] : undefined} />
      <p className="mt-6 text-center text-sm text-ink-2">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="inline-block py-1 font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
          Prueba 3 días gratis
        </Link>
      </p>
    </>
  );
}
