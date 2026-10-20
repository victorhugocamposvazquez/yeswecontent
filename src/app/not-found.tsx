import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link href="/" aria-label="yeswecontent, inicio">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-4 py-20 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">Error 404 · fe de erratas</p>
        <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl">
          Esta página se ha quedado <span className="marker">sin publicar</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-2">
          Puede que el enlace esté mal escrito o que hayamos movido el artículo. Lo que sí sigue en su sitio:
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-lg border border-line bg-signal px-5 py-2.5 font-semibold text-signal-ink shadow-sm">
            La portada
          </Link>
          <Link href="/herramientas" className="rounded-lg border border-line bg-card px-5 py-2.5 font-semibold hover:bg-paper-2">
            Herramientas gratis
          </Link>
          <Link href="/precios" className="rounded-lg border border-line bg-card px-5 py-2.5 font-semibold hover:bg-paper-2">
            Precios
          </Link>
        </div>
      </main>
    </div>
  );
}
