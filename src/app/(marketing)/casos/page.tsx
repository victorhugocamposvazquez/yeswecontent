import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { num } from "@/lib/utils";
import { growth, listPublishedCases } from "@/lib/marketing/cases";
import { Badge } from "@/components/ui";
import { Container, CtaBand, Eyebrow, HoverCard, Lead, Section, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Casos de ejemplo",
  description: "Escenarios de ejemplo de cómo el contenido constante, los enlaces y la visibilidad en IA hacen crecer webs de distintos sectores.",
  alternates: { canonical: "/casos" },
};

export const revalidate = 3600;

export default async function CasosPage() {
  const cases = await listPublishedCases();
  return (
    <>
      <section className="glow relative overflow-hidden border-b border-line">
        <Container className="relative py-14 sm:py-20 md:py-24">
          <Eyebrow className="rise">Casos de ejemplo</Eyebrow>
          <Title as="h1" size="lg" className="rise rise-2 mt-5 max-w-4xl">
            Historias de webs que <span className="marker">dejaron de esperar</span> a tener tiempo.
          </Title>
          <Lead className="rise rise-2 mt-6 max-w-2xl">
            Estos casos son ilustrativos: empresas ficticias y cifras de ejemplo que reflejan escenarios típicos. Sirven para que te hagas una idea de cómo trabajamos, no como promesa de resultados.
          </Lead>
        </Container>
      </section>
      <Section>
        <Container>
          {cases.length === 0 ? (
            <p className="text-ink-2">Pronto publicaremos los primeros casos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {cases.map((c, i) => (
                <HoverCard key={c.slug} href={`/casos/${c.slug}`} className={`flex flex-col p-6 sm:p-8 ${i === 0 ? "bg-lime-soft md:col-span-2" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge className="bg-card">{c.sector}</Badge>
                    <Badge tone="neutral" className="bg-card">
                      Ejemplo
                    </Badge>
                  </div>
                  <h2 className={`mt-5 font-display ${i === 0 ? "text-[clamp(2rem,4.5vw,3.5rem)]" : "text-[clamp(1.5rem,3vw,2.125rem)]"}`}>{c.company}</h2>
                  <p className="mt-3 max-w-2xl flex-1 text-[15px] leading-relaxed text-ink-2">{c.summary}</p>
                  {c.metric_before != null && c.metric_after != null && (
                    <div className="mt-6 flex flex-wrap items-end gap-6 border-t border-line pt-5">
                      <div>
                        <p className="text-xs font-medium text-ink-3">Antes</p>
                        <p className="tabular text-2xl font-semibold tracking-tight">{num(c.metric_before)}</p>
                      </div>
                      <span className="pb-1 text-ink-3">→</span>
                      <div>
                        <p className="text-xs font-medium text-ink-3">Después</p>
                        <p className="tabular text-2xl font-semibold tracking-tight">{num(c.metric_after)}</p>
                      </div>
                      <p className="pb-1 text-sm text-ink-3">{c.metric_label}</p>
                      {growth(c) && <span className="tabular ml-auto text-3xl font-semibold tracking-tight text-signal">{growth(c)}</span>}
                    </div>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold transition-colors duration-150 group-hover:text-signal">
                    Leer el caso <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </HoverCard>
              ))}
            </div>
          )}
        </Container>
      </Section>
      <CtaBand title="El próximo ejemplo podría ser tu web." />
    </>
  );
}
