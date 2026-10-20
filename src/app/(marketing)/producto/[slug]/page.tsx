import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getProduct, products } from "@/lib/marketing/products";
import { Container, CtaBand, CtaLink, Eyebrow, Faq, ProductGlyph, Section, Ticket, Title } from "@/components/marketing/primitives";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.metaDescription,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { title: `${p.name} · yeswecontent`, description: p.metaDescription },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const related = p.related.map(getProduct).filter((x) => !!x);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Container className="relative grid grid-cols-1 items-center gap-14 py-14 md:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-lime">
                <ProductGlyph icon={p.icon} className="h-5 w-5" />
              </span>
              <Eyebrow>{p.eyebrow}</Eyebrow>
            </div>
            <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
              {p.title[0]}
              <span className="marker">{p.title[1]}</span>
              {p.title[2]}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">{p.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <CtaLink href="/registro" size="lg">
                Prueba 3 días gratis
              </CtaLink>
              <Link href="/precios" className="inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4 hover:text-signal">
                Ver precios
              </Link>
            </div>
          </div>
          <Ticket {...p.sample} className="mx-auto w-full max-w-md" />
        </Container>
      </section>

      <Section>
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Qué hace</Eyebrow>
            <Title className="mt-4">
              Lo que hace por ti, <span className="marker">punto por punto</span>.
            </Title>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-ink sm:grid-cols-2">
            {p.features.map((f, i) => (
              <div key={f.title} className={`bg-card p-7 ${p.features.length % 2 && i === p.features.length - 1 ? "sm:col-span-2" : ""}`}>
                <span className="font-mono text-xs text-signal">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-2">{f.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-line bg-paper-2">
        <Container>
          <Eyebrow>Cómo funciona</Eyebrow>
          <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {p.steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-line bg-card p-7">
                <span className="font-display text-6xl leading-none text-signal">{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Dudas habituales</Eyebrow>
            <Title className="mt-4">Preguntas sobre {p.name.toLowerCase()}</Title>
          </div>
          <Faq items={p.faq} />
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="pt-0 md:pt-0">
          <Container>
            <Eyebrow tone="ink">Funciona mejor junto a</Eyebrow>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/producto/${r.slug}`} className="group flex items-start gap-4 rounded-2xl border border-line bg-card p-5 transition hover:shadow-md">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line bg-paper group-hover:bg-lime">
                    <ProductGlyph icon={r.icon} className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{r.name}</span>
                    <span className="block text-sm text-ink-3">{r.short}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 group-hover:text-signal" aria-hidden />
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBand title={<>Pruébalo con tu propia web.</>} text="Tres días gratis para ver el plan, los primeros artículos y tu auditoría. Sin permanencia." />
    </>
  );
}
