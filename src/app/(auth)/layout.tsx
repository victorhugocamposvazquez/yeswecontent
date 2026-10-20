import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui";
import { isDemo } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow relative flex min-h-screen flex-col overflow-x-clip">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[40rem]" />
      <header className="relative mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="yeswecontent, inicio" className="rounded-md">
          <Logo />
        </Link>
        <Link href="/" className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a la web
        </Link>
      </header>
      <main className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="rise w-full max-w-[26.5rem]">
          {isDemo && (
            <p className="mb-4 rounded-xl border border-line bg-lime-soft px-4 py-2.5 text-[13px] leading-relaxed text-ink-2">
              <strong className="text-ink">Modo demo.</strong> No hay base de datos conectada: los formularios te llevan directamente al panel de ejemplo.
            </p>
          )}
          <div className="surface p-6 shadow-[var(--shadow-md)] sm:p-8">{children}</div>
        </div>
      </main>
      <p className="relative py-6 text-center text-xs text-ink-3">
        <Link href="/legal/terminos" className="inline-block py-1 transition-colors duration-150 hover:text-ink">
          Términos
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacidad" className="inline-block py-1 transition-colors duration-150 hover:text-ink">
          Privacidad
        </Link>
      </p>
    </div>
  );
}
