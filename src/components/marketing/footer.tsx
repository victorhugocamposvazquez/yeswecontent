import Link from "next/link";
import { Logo } from "@/components/ui";
import { products } from "@/lib/marketing/products";
import { tools } from "@/lib/marketing/tools";

const cols: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Producto",
    links: products.map((p) => ({ href: `/producto/${p.slug}`, label: p.name })),
  },
  {
    title: "Herramientas gratis",
    links: [
      ...tools.filter((t) => t.kind === "server" || t.kind === "client").slice(0, 7).map((t) => ({ href: `/herramientas/${t.slug}`, label: t.name })),
      { href: "/herramientas", label: "Ver todas" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/precios", label: "Precios" },
      { href: "/casos", label: "Casos de ejemplo" },
      { href: "/agencias", label: "Agencias y marca blanca" },
      { href: "/afiliados", label: "Programa de afiliados" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { href: "/entrar", label: "Entrar" },
      { href: "/registro", label: "Crear cuenta" },
      { href: "/legal/privacidad", label: "Privacidad" },
      { href: "/legal/terminos", label: "Términos" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="mx-auto max-w-[1200px] px-4 pt-14 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Logo />
            <p className="text-pretty mt-4 max-w-xs text-sm leading-relaxed text-ink-2">Contenido, enlaces y visibilidad en Google y en los asistentes de IA para webs y tiendas online, en piloto automático.</p>
            <a href="mailto:hola@yeswecontent.com" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-ink transition-colors duration-150 hover:text-signal sm:min-h-0">
              hola@yeswecontent.com
            </a>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[13px] font-semibold tracking-tight text-ink">{c.title}</p>
              <ul className="mt-3 space-y-0.5 text-sm sm:space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block py-1.5 text-ink-2 transition-colors duration-150 hover:text-ink sm:py-0">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© yeswecontent. Idea y desarrollo - Hugo Campos. Aceleración - Google Labs.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/legal/privacidad" className="inline-block py-1.5 transition-colors duration-150 hover:text-ink sm:py-0">
              Privacidad
            </Link>
            <Link href="/legal/terminos" className="inline-block py-1.5 transition-colors duration-150 hover:text-ink sm:py-0">
              Términos
            </Link>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-ink-3">
          Google, ChatGPT, Gemini, Perplexity, Claude, Reddit y Quora son marcas de sus respectivos titulares; yeswecontent no está afiliado a ellos.
        </p>
      </div>
    </footer>
  );
}
