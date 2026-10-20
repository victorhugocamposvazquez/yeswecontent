import type { Metadata } from "next";
import { ArrowUpRight, Lock } from "lucide-react";
import { toolCategories, tools, type Tool } from "@/lib/marketing/tools";
import { Badge as UiBadge } from "@/components/ui";
import { Container, CtaBand, Eyebrow, HoverCard, Lead, Section, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Herramientas SEO y GEO gratis",
  description: "Comprueba tu robots.txt, sitemap, meta descripción, H1, Open Graph y canonical, genera tu llms.txt o tu schema JSON-LD y audita si tu web está lista para la IA. Gratis.",
  alternates: { canonical: "/herramientas" },
};

function Badge({ t }: { t: Tool }) {
  const map = {
    server: ["Gratis", "lime"],
    client: ["Gratis", "lime"],
    signup: ["En la prueba", "sky"],
    soon: ["Próximamente", "neutral"],
  } as const;
  const [label, tone] = map[t.kind];
  return <UiBadge tone={tone}>{label}</UiBadge>;
}

export default function HerramientasPage() {
  const live = tools.filter((t) => t.kind === "server" || t.kind === "client").length;
  return (
    <>
      <section className="glow relative overflow-hidden border-b border-line">
        <Container className="relative py-14 sm:py-20 md:py-24">
          <Eyebrow className="rise">Herramientas gratis</Eyebrow>
          <Title as="h1" size="lg" className="rise rise-2 mt-5 max-w-4xl">
            Pequeñas comprobaciones, <span className="marker">grandes sustos</span> evitados.
          </Title>
          <Lead className="rise rise-2 mt-6 max-w-2xl">
            {live} herramientas que funcionan ya mismo, sin registro. Analizan tu web en tiempo real o generan los archivos que te faltan.
          </Lead>
          <nav aria-label="Categorías" className="rise rise-3 mt-8 flex flex-wrap gap-2">
            {toolCategories.map((c) => (
              <a key={c.id} href={`#${c.id}`} className="inline-flex h-9 items-center rounded-full border border-line bg-card px-3.5 text-sm font-medium shadow-[var(--shadow-xs)] transition-colors duration-150 hover:border-line-2 hover:bg-paper-2">
                {c.label}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      <Section>
        <Container className="space-y-16 md:space-y-20">
          {toolCategories.map((c) => {
            const list = tools.filter((t) => t.category === c.id);
            if (!list.length) return null;
            return (
              <div key={c.id} id={c.id} className="scroll-mt-24">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
                  <Title className="text-[clamp(1.5rem,3vw,2.125rem)]">{c.label}</Title>
                  <p className="text-[15px] text-ink-2">{c.intro}</p>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
                  {list.map((t) => {
                    const disabled = t.kind === "soon";
                    const inner = (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <Badge t={t} />
                          {disabled ? <Lock className="h-4 w-4 text-ink-3" aria-hidden /> : <ArrowUpRight className="h-5 w-5 text-ink-3 transition-colors duration-150 group-hover:text-signal" aria-hidden />}
                        </div>
                        <h3 className="mt-5 text-lg font-semibold leading-snug tracking-tight sm:text-xl">{t.name}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-2">{t.tagline}</p>
                      </>
                    );
                    return disabled ? (
                      <div key={t.slug} className="rounded-2xl border border-dashed border-line-2 bg-paper-2 p-6">
                        {inner}
                      </div>
                    ) : (
                      <HoverCard key={t.slug} href={`/herramientas/${t.slug}`} className="p-6">
                        {inner}
                      </HoverCard>
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
