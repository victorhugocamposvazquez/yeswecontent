import Link from "next/link";
import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="glow relative flex min-h-screen flex-col">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[36rem]" />
      <header className="relative border-b border-line bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="yeswecontent, inicio" className="rounded-md">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-4 py-20 sm:px-6">
        <p className="eyebrow rise">Error 404 · fe de erratas</p>
        <h1 className="rise rise-2 mt-5 font-display text-[clamp(2.125rem,6vw,4rem)]">
          Esta página se ha quedado <span className="marker">sin publicar</span>.
        </h1>
        <p className="text-pretty rise rise-2 mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
          Puede que el enlace esté mal escrito o que hayamos movido el artículo. Lo que sí sigue en su sitio:
        </p>
        <div className="rise rise-3 mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">La portada</ButtonLink>
          <ButtonLink href="/herramientas" variant="outline">
            Herramientas gratis
          </ButtonLink>
          <ButtonLink href="/precios" variant="outline">
            Precios
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
