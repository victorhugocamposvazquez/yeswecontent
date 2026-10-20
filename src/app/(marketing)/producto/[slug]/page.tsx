import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getProduct, products } from "@/lib/marketing/products";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui";
import { ProductMockup } from "@/components/marketing/mockups";
import { ScrollRail, Stagger, TiltIn, Watch } from "@/components/marketing/scroll-fx";
import { Container, CtaBand, CtaLink, Eyebrow, Faq, HoverCard, IconBox, Lead, ProductGlyph, Section, TextLink, Ticket, Title } from "@/components/marketing/primitives";

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
  const wide = p.slug === "agente-seo";

  return (
    <>
      <section className="glow relative overflow-hidden">
        <Container className={wide ? "relative flex flex-col items-center pt-14 text-center sm:pt-20 md:pt-24" : "relative grid grid-cols-1 items-center gap-10 py-14 sm:py-20 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16"}>
          <div className={wide ? "flex max-w-3xl flex-col items-center" : ""}>
            <div className="rise flex items-center gap-3">
              <IconBox>
                <ProductGlyph icon={p.icon} />
              </IconBox>
              <Eyebrow>{p.eyebrow}</Eyebrow>
            </div>
            <Title as="h1" size="lg" className={cn("rise rise-2 mt-6", !wide && "text-[clamp(2rem,4.4vw,3.5rem)]")}>
              {p.title[0]}
              <span className="marker">{p.title[1]}</span>
              {p.title[2]}
            </Title>
            <Lead className="rise rise-2 mt-6 max-w-xl">{p.intro}</Lead>
            <div className="rise rise-3 mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              <CtaLink href="/registro" size="lg">
                Prueba 3 días gratis
              </CtaLink>
              <CtaLink href="/precios" tone="paper" size="lg" arrow={false}>
                Ver precios
              </CtaLink>
            </div>
          </div>
          <div className={wide ? "rise rise-3 mt-12 w-full max-w-[1100px] pb-14 sm:mt-16 md:pb-20" : "rise rise-3 w-full"}>
            <TiltIn>
              <Watch>
                <ProductMockup slug={p.slug} />
              </Watch>
            </TiltIn>
          </div>
        </Container>
      </section>

      <Section className="border-t border-line">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Qué hace</Eyebrow>
            <Title className="mt-4">
              Lo que hace por ti, <span className="marker">punto por punto</span>.
            </Title>
          </div>
          <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:gap-5">
            {p.features.map((f, i) => (
              <Card key={f.title} className="p-6 sm:p-7" style={{ "--i": i * 3 } as CSSProperties}>
                <span className="tabular text-sm font-semibold text-signal">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{f.text}</p>
              </Card>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <Eyebrow>Cómo funciona</Eyebrow>
              <Title className="mt-4">En tres pasos.</Title>
              <div className="mt-8 hidden lg:block">
                <Ticket {...p.sample} className="max-w-sm" />
              </div>
            </div>
            <ScrollRail className="grid grid-cols-1 gap-4">
              {p.steps.map((s, i) => (
                <li key={s.title}>
                  <Card className="flex gap-5 p-6">
                    <span className="sx-dot grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">{i + 1}</span>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{s.text}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ScrollRail>
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Eyebrow>Dudas habituales</Eyebrow>
            <Title className="mt-4">Preguntas sobre {p.name.toLowerCase()}</Title>
          </div>
          <Faq items={p.faq} />
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="pt-0 sm:pt-0 md:pt-0 lg:pt-0">
          <Container>
            <Eyebrow tone="ink">Funciona mejor junto a</Eyebrow>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {related.map((r) => (
                <HoverCard key={r.slug} href={`/producto/${r.slug}`} className="flex items-start gap-4 p-5">
                  <IconBox>
                    <ProductGlyph icon={r.icon} />
                  </IconBox>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold tracking-tight">{r.name}</span>
                    <span className="block text-sm text-ink-3">{r.short}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-3 transition-colors duration-150 group-hover:text-signal" aria-hidden />
                </HoverCard>
              ))}
            </div>
            <TextLink href="/producto/agente-seo" className="mt-6">
              Ver el agente completo
            </TextLink>
          </Container>
        </Section>
      )}

      <CtaBand title={<>Pruébalo con tu propia web.</>} text="Tres días gratis para ver el plan, los primeros artículos y tu auditoría. Sin permanencia." />
    </>
  );
}
