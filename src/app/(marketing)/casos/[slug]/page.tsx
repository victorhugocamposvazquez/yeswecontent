import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { num } from "@/lib/utils";
import type { CaseStudy } from "@/lib/types";
import { getPublishedCase, growth, listPublishedCases } from "@/lib/marketing/cases";
import { Markdown } from "@/components/marketing/markdown";
import { Badge, Card } from "@/components/ui";
import { Container, CtaBand, Eyebrow, Section, Title } from "@/components/marketing/primitives";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await listPublishedCases()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getPublishedCase((await params).slug);
  if (!c) return {};
  return { title: `Caso de ejemplo: ${c.company}`, description: c.summary, alternates: { canonical: `/casos/${c.slug}` } };
}

/** Texto por defecto si el caso no tiene cuerpo propio todavía. */
function fallbackBody(c: CaseStudy) {
  const sector = (c.sector ?? "su sector").toLowerCase();
  return `## Punto de partida

${c.company} es una empresa ficticia del sector ${sector}. Como tantas otras, tenía una web correcta pero casi sin contenido: unas pocas páginas de servicio y un blog con tres entradas de hace años. Nadie en el equipo tenía tiempo para escribir con regularidad.

## Qué pusimos en marcha

- Un plan de contenidos mensual centrado en las preguntas reales de sus clientes.
- Publicación automática dos o tres veces por semana, con la voz de la marca.
- Enlazado interno hacia sus páginas de servicio y enlaces desde webs afines de la red.
- Seguimiento diario de una docena de preguntas en ChatGPT, Claude, Gemini y Perplexity.

## Qué cambió

${c.summary}

> Lo importante no fue un artículo brillante, sino no parar: cada semana, algo nuevo y útil.

## Lo que nos llevamos

La constancia gana a la inspiración. Y medir lo que dicen los asistentes de IA permitió detectar huecos de contenido que no aparecían en ninguna herramienta de palabras clave.`;
}

export default async function CasoPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getPublishedCase((await params).slug);
  if (!c) notFound();
  const g = growth(c);

  return (
    <>
      <section className="glow relative overflow-hidden border-b border-line">
        <Container className="relative py-12 sm:py-16 md:py-20">
          <Link href="/casos" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-2 transition-colors duration-150 hover:text-signal sm:min-h-0">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Todos los casos
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Eyebrow>{c.sector}</Eyebrow>
            <Badge className="bg-card">Caso de ejemplo</Badge>
          </div>
          <Title as="h1" size="lg" className="mt-5 max-w-4xl">
            {c.metric_before != null && c.metric_after != null ? (
              <>
                Cómo {c.company} pasó de {num(c.metric_before)} a <span className="marker">{num(c.metric_after)}</span> {c.metric_label}
              </>
            ) : (
              c.company
            )}
          </Title>
        </Container>
      </section>
      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_20rem]">
          <article className="max-w-2xl">
            <Markdown source={c.body_md?.trim() ? c.body_md : fallbackBody(c)} />
            <p className="mt-10 rounded-xl border border-line bg-paper-2 p-4 text-sm text-ink-3">
              Caso ilustrativo: empresa y cifras ficticias, basadas en escenarios habituales. Los resultados reales dependen de cada web, su sector y su punto de partida.
            </p>
          </article>
          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            {g && (
              <Card className="bg-lime-soft p-6">
                <p className="text-[13px] font-medium text-ink-2">Crecimiento</p>
                <p className="tabular mt-1 text-[3.5rem] font-semibold leading-none tracking-tight">{g}</p>
                <p className="mt-2 text-sm text-ink-2">{c.metric_label}</p>
              </Card>
            )}
            <Card className="p-6">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-ink-3">Empresa</dt>
                  <dd className="font-semibold">{c.company}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Sector</dt>
                  <dd className="font-semibold">{c.sector}</dd>
                </div>
                {c.metric_before != null && (
                  <div>
                    <dt className="text-ink-3">Antes → después</dt>
                    <dd className="font-semibold tabular-nums">
                      {num(c.metric_before)} → {num(c.metric_after ?? 0)}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </aside>
        </Container>
      </Section>
      <CtaBand title="¿Empezamos con la tuya?" />
    </>
  );
}
