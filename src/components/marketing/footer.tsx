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
    title: "Herramientas",
    links: [
      ...tools.filter((t) => t.kind === "server" || t.kind === "client").slice(0, 8).map((t) => ({ href: `/herramientas/${t.slug}`, label: t.name })),
      { href: "/herramientas", label: "Ver todas →" },
    ],
  },
  {
    title: "yeswecontent",
    links: [
      { href: "/precios", label: "Precios" },
      { href: "/casos", label: "Casos de ejemplo" },
      { href: "/agencias", label: "Agencias y marca blanca" },
      { href: "/afiliados", label: "Programa de afiliados" },
      { href: "/blog", label: "Blog" },
      { href: "/entrar", label: "Entrar" },
      { href: "/registro", label: "Crear cuenta" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo inverted />
            <p className="mt-5 max-w-sm font-display text-3xl leading-tight">
              Contenido que trabaja <span className="text-lime">mientras tú</span> atiendes a tus clientes.
            </p>
            <Link
              href="/registro"
              className="mt-7 inline-flex rounded-lg border border-paper/20 bg-signal px-5 py-2.5 text-sm font-semibold text-signal-ink shadow-sm transition"
            >
              Probar 3 días gratis
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">{c.title}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-paper/75 hover:text-paper hover:underline">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-paper/15 pt-8 text-xs text-paper/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} yeswecontent S.L. Hecho con café y criterio editorial.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/legal/privacidad" className="hover:text-paper">
              Privacidad
            </Link>
            <Link href="/legal/terminos" className="hover:text-paper">
              Términos
            </Link>
            <a href="mailto:hola@yeswecontent.com" className="hover:text-paper">
              hola@yeswecontent.com
            </a>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-paper/40">
          Google, ChatGPT, Gemini, Perplexity, Claude, Reddit y Quora son marcas de sus respectivos titulares; yeswecontent no está afiliado a ellos.
        </p>
      </div>
    </footer>
  );
}
