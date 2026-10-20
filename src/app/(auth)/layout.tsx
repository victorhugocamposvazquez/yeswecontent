import Link from "next/link";
import { Logo } from "@/components/ui";
import { isDemo } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="yeswecontent, inicio">
            <Logo />
          </Link>
          <Link href="/" className="-mr-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-ink-2 hover:text-ink">
            ← Volver a la web
          </Link>
        </div>
        {isDemo && (
          <p className="mt-6 rounded-xl border border-line bg-lime px-4 py-2.5 text-sm">
            <strong>Modo demo.</strong> No hay base de datos conectada: los formularios te llevan directamente al panel de ejemplo.
          </p>
        )}
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{children}</main>
        <p className="text-center text-xs text-ink-3">
          <Link href="/legal/terminos" className="hover:text-ink">
            Términos
          </Link>{" "}
          ·{" "}
          <Link href="/legal/privacidad" className="hover:text-ink">
            Privacidad
          </Link>
        </p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-line bg-ink text-paper lg:flex lg:flex-col lg:justify-between lg:p-14">
        <p className="relative font-mono text-[11px] uppercase tracking-[0.22em] text-lime">El Cuaderno · edición de hoy</p>
        <div className="relative">
          <p className="font-display text-6xl leading-[1.02]">
            Mientras lees esto, alguien está preguntando a una IA <span className="text-lime">por lo que tú vendes</span>.
          </p>
          <p className="mt-6 max-w-md text-paper/70">Que la respuesta te incluya empieza por tener algo bueno que leer. De eso nos encargamos.</p>
        </div>
        <div className="relative flex gap-3">
          {["Plan", "Escribe", "Publica", "Mide"].map((s, i) => (
            <span key={s} className={`rounded-full border px-3 py-1 font-mono text-xs ${i === 1 ? "border-signal bg-signal text-white" : "border-paper/40"}`}>
              {s}
            </span>
          ))}
        </div>
      </aside>
    </div>
  );
}
