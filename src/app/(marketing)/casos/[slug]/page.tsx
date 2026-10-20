import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { num } from "@/lib/utils";
import type { CaseStudy } from "@/lib/types";
import { getPublishedCase, growth, listPublishedCases } from "@/lib/marketing/cases";
import { Markdown } from "@/components/marketing/markdown";
import { Container, CtaBand, Eyebrow, Section } from "@/components/marketing/primitives";

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
      <section className="border-b border-line">
        <Container className="py-14 md:py-20">
          <Link href="/casos" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-signal">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Todos los casos
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Eyebrow>{c.sector}</Eyebrow>
            <span className="rounded-full border border-line bg-card px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]">Caso de ejemplo</span>
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            {c.metric_before != null && c.metric_after != null ? (
              <>
                Cómo {c.company} pasó de {num(c.metric_before)} a <span className="marker">{num(c.metric_after)}</span> {c.metric_label}
              </>
            ) : (
              c.company
            )}
          </h1>
        </Container>
      </section>
      <Section>
        <Container className="grid gap-12 lg:grid-cols-[1fr_20rem]">
          <article className="max-w-2xl">
            <Markdown source={c.body_md?.trim() ? c.body_md : fallbackBody(c)} />
            <p className="mt-10 rounded-xl border border-dashed border-line p-4 text-sm text-ink-3">
              Caso ilustrativo: empresa y cifras ficticias, basadas en escenarios habituales. Los resultados reales dependen de cada web, su sector y su punto de partida.
            </p>
          </article>
          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            {g && (
              <div className="rounded-2xl border border-line bg-lime p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em]">Crecimiento</p>
                <p className="mt-1 font-display text-7xl leading-none">{g}</p>
                <p className="mt-2 text-sm">{c.metric_label}</p>
              </div>
            )}
            <div className="rounded-2xl border border-line bg-card p-6">
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
            </div>
          </aside>
        </Container>
      </Section>
      <CtaBand title="¿Empezamos con la tuya?" />
    </>
  );
}
