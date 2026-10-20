import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolCategories, tools, type Tool } from "@/lib/marketing/tools";
import { Container, CtaBand, Eyebrow, Section } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Herramientas SEO y GEO gratis",
  description: "Comprueba tu robots.txt, sitemap, meta descripción, H1, Open Graph y canonical, genera tu llms.txt o tu schema JSON-LD y audita si tu web está lista para la IA. Gratis.",
  alternates: { canonical: "/herramientas" },
};

function Badge({ t }: { t: Tool }) {
  const map = {
    server: ["Gratis", "bg-lime"],
    client: ["Gratis", "bg-lime"],
    signup: ["En la prueba", "bg-sky/60"],
    soon: ["Próximamente", "bg-paper-2 text-ink-3"],
  } as const;
  const [label, cls] = map[t.kind];
  return <span className={cn("rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]", cls)}>{label}</span>;
}

export default function HerramientasPage() {
  const live = tools.filter((t) => t.kind === "server" || t.kind === "client").length;
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Container className="relative py-16 md:py-24">
          <Eyebrow>Herramientas gratis</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Pequeñas comprobaciones, <span className="marker">grandes sustos</span> evitados.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-2">
            {live} herramientas que funcionan ya mismo, sin registro. Analizan tu web en tiempo real o generan los archivos que te faltan.
          </p>
          <nav aria-label="Categorías" className="mt-8 flex flex-wrap gap-2">
            {toolCategories.map((c) => (
              <a key={c.id} href={`#${c.id}`} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-medium hover:bg-lime">
                {c.label}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      <Section>
        <Container className="space-y-20">
          {toolCategories.map((c) => {
            const list = tools.filter((t) => t.category === c.id);
            if (!list.length) return null;
            return (
              <div key={c.id} id={c.id} className="scroll-mt-24">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
                  <h2 className="font-display text-4xl md:text-5xl">{c.label}</h2>
                  <p className="text-ink-2">{c.intro}</p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((t) => {
                    const disabled = t.kind === "soon";
                    const inner = (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <Badge t={t} />
                          {disabled ? <Lock className="h-4 w-4 text-ink-3" aria-hidden /> : <ArrowUpRight className="h-5 w-5 transition group-hover:text-signal" aria-hidden />}
                        </div>
                        <h3 className="mt-5 font-display text-3xl leading-tight">{t.name}</h3>
                        <p className="mt-2 text-sm text-ink-2">{t.tagline}</p>
                      </>
                    );
                    return disabled ? (
                      <div key={t.slug} className="rounded-2xl border border-dashed border-line bg-paper p-6 opacity-80">
                        {inner}
                      </div>
                    ) : (
                      <Link key={t.slug} href={`/herramientas/${t.slug}`} className="group rounded-2xl border border-line bg-card p-6 transition hover:shadow-md">
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Container>
      </Section>

      <CtaBand title="¿Y si alguien lo revisara todo, cada mes, por ti?" text="La auditoría completa, el plan de contenidos y el seguimiento en IA están incluidos en todos los planes." />
    </>
  );
}
