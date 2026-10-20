import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { num } from "@/lib/utils";
import { growth, listPublishedCases } from "@/lib/marketing/cases";
import { Container, CtaBand, Eyebrow, Section } from "@/components/marketing/primitives";

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
      <section className="border-b border-line">
        <Container className="py-16 md:py-24">
          <Eyebrow>Casos de ejemplo</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Historias de webs que <span className="marker">dejaron de esperar</span> a tener tiempo.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-2">
            Estos casos son ilustrativos: empresas ficticias y cifras de ejemplo que reflejan escenarios típicos. Sirven para que te hagas una idea de cómo trabajamos, no como promesa de resultados.
          </p>
        </Container>
      </section>
      <Section>
        <Container>
          {cases.length === 0 ? (
            <p className="text-ink-2">Pronto publicaremos los primeros casos.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {cases.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/casos/${c.slug}`}
                  className={`group flex flex-col rounded-2xl border border-line p-7 transition hover:shadow-md sm:p-9 ${i === 0 ? "bg-lime md:col-span-2" : "bg-card"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{c.sector}</span>
                    <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]">Ejemplo</span>
                  </div>
                  <h2 className={`mt-5 font-display leading-[1.02] ${i === 0 ? "text-5xl md:text-6xl" : "text-4xl"}`}>{c.company}</h2>
                  <p className="mt-3 max-w-2xl flex-1 text-ink-2">{c.summary}</p>
                  {c.metric_before != null && c.metric_after != null && (
                    <div className="mt-6 flex flex-wrap items-end gap-6 border-t border-dashed border-line pt-5">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Antes</p>
                        <p className="text-2xl font-semibold tabular-nums">{num(c.metric_before)}</p>
                      </div>
                      <span className="pb-1 font-mono">→</span>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Después</p>
                        <p className="text-2xl font-semibold tabular-nums">{num(c.metric_after)}</p>
                      </div>
                      <p className="pb-1 text-sm text-ink-3">{c.metric_label}</p>
                      {growth(c) && <span className="ml-auto font-display text-4xl text-signal">{growth(c)}</span>}
                    </div>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1 font-semibold group-hover:text-signal">
                    Leer el caso <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
      <CtaBand title="El próximo ejemplo podría ser tu web." />
    </>
  );
}
