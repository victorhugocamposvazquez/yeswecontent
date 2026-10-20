import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { getTool, toolCategories, tools } from "@/lib/marketing/tools";
import { ToolRunner } from "@/components/marketing/tools/tool-runner";
import { KeywordDensityTool, RobotsGeneratorTool, SchemaGeneratorTool, SerpPreviewTool } from "@/components/marketing/tools/client-tools";
import { Container, CtaLink, Eyebrow, Section } from "@/components/marketing/primitives";

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.filter((t) => t.kind !== "soon").map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTool((await params).slug);
  if (!t) return {};
  return { title: `${t.name} gratis`, description: t.tagline, alternates: { canonical: `/herramientas/${t.slug}` } };
}

const clientTools: Record<string, () => React.ReactNode> = {
  "vista-previa-serp": () => <SerpPreviewTool />,
  "generador-schema": () => <SchemaGeneratorTool />,
  "densidad-palabras": () => <KeywordDensityTool />,
  "generador-robots": () => <RobotsGeneratorTool />,
};

export default async function ToolPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ url?: string | string[] }> }) {
  const t = getTool((await params).slug);
  if (!t || t.kind === "soon") notFound();
  const sp = await searchParams;
  const initialUrl = typeof sp.url === "string" ? sp.url.slice(0, 2048) : undefined;
  const cat = toolCategories.find((c) => c.id === t.category);
  const siblings = tools.filter((x) => x.category === t.category && x.slug !== t.slug && x.kind !== "soon").slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Container className="relative py-12 md:py-16">
          <Link href="/herramientas" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-signal">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Todas las herramientas
          </Link>
          <Eyebrow className="mt-8">{cat?.label} · herramienta gratuita</Eyebrow>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">{t.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-2">{t.tagline}</p>
        </Container>
      </section>

      <Section className="py-12 md:py-16">
        <Container>
          {t.kind === "server" && <ToolRunner slug={t.slug} cta={t.cta} initialUrl={initialUrl} />}
          {t.kind === "client" && clientTools[t.slug]?.()}
          {t.kind === "signup" && (
            <div className="grid gap-8 rounded-2xl border border-line bg-sky/40 p-8 md:grid-cols-[1.3fr_1fr] md:items-center md:p-12">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> Incluida en la prueba gratuita
                </span>
                <h2 className="mt-5 font-display text-4xl leading-tight md:text-5xl">Esta comprobación consulta a los modelos en tiempo real.</h2>
                <p className="mt-4 text-ink-2">{t.why}</p>
              </div>
              <div className="flex flex-col gap-3">
                <CtaLink href="/registro" size="lg">
                  Probar 3 días gratis
                </CtaLink>
                <Link href="/herramientas/auditoria-ia" className="text-center text-sm font-semibold underline underline-offset-4">
                  Mientras tanto, haz la auditoría exprés
                </Link>
              </div>
            </div>
          )}
        </Container>
      </Section>

      <Section className="border-t border-line bg-paper-2 py-16 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Qué revisa</Eyebrow>
            <ul className="mt-5 space-y-3">
              {t.checks.map((c) => (
                <li key={c} className="flex gap-3 text-lg">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-signal" aria-hidden /> {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>Por qué importa</Eyebrow>
            <p className="mt-5 font-display text-3xl leading-snug">{t.why}</p>
          </div>
        </Container>
      </Section>

      {siblings.length > 0 && (
        <Section className="py-16 md:py-20">
          <Container>
            <Eyebrow tone="ink">Otras herramientas de {cat?.label.toLowerCase()}</Eyebrow>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {siblings.map((s) => (
                <Link key={s.slug} href={`/herramientas/${s.slug}`} className="rounded-2xl border border-line bg-card p-5 transition hover:shadow-md">
                  <p className="font-display text-2xl">{s.name}</p>
                  <p className="mt-1 text-sm text-ink-2">{s.tagline}</p>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
