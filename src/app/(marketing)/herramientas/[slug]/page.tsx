import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock } from "lucide-react";
import { getTool, toolCategories, tools } from "@/lib/marketing/tools";
import { ToolRunner } from "@/components/marketing/tools/tool-runner";
import { KeywordDensityTool, RobotsGeneratorTool, SchemaGeneratorTool, SerpPreviewTool } from "@/components/marketing/tools/client-tools";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Container, CtaLink, Eyebrow, HoverCard, Lead, Section, Title } from "@/components/marketing/primitives";

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
  const isAudit = t.slug === "auditoria-ia";

  return (
    <>
      <section className={cn("glow relative overflow-hidden border-b border-line", isAudit && "border-b-0")}>
        <Container className={cn("relative", isAudit ? "py-6 sm:py-8" : "py-10 sm:py-14 md:py-16")}>
          <Link href="/herramientas" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-2 transition-colors duration-150 hover:text-signal sm:min-h-0">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Todas las herramientas
          </Link>
          <Eyebrow className={isAudit ? "mt-4" : "mt-8"}>{cat?.label} · {isAudit ? "diagnóstico gratuito" : "herramienta gratuita"}</Eyebrow>
          <Title as="h1" size={isAudit ? "md" : "lg"} className="mt-3 max-w-4xl sm:mt-4">
            {t.name}
          </Title>
          <Lead className={cn("max-w-2xl", isAudit ? "mt-3 text-base sm:text-lg" : "mt-5")}>{t.tagline}</Lead>
        </Container>
      </section>

      <Section className={isAudit ? "pt-0 pb-10 sm:pb-12" : "py-10 sm:py-12 md:py-16 lg:py-16"}>
        <Container>
          {t.kind === "server" && <ToolRunner slug={t.slug} cta={t.cta} initialUrl={initialUrl} />}
          {t.kind === "client" && clientTools[t.slug]?.()}
          {t.kind === "signup" && (
            <Card className="grid grid-cols-1 gap-8 bg-sky-soft p-7 md:grid-cols-[1.3fr_1fr] md:items-center md:p-12">
              <div>
                <Badge className="bg-card">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> Incluida en la prueba gratuita
                </Badge>
                <Title className="mt-5">Esta comprobación consulta a los modelos en tiempo real.</Title>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{t.why}</p>
              </div>
              <div className="flex flex-col gap-3">
                <CtaLink href="/registro" size="lg">
                  Probar 3 días gratis
                </CtaLink>
                <Link href="/herramientas/auditoria-ia" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
                  Mientras tanto, haz la auditoría exprés
                </Link>
              </div>
            </Card>
          )}
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>Qué revisa</Eyebrow>
            <ul className="mt-5 space-y-2.5">
              {t.checks.map((c) => (
                <li key={c} className="flex gap-2.5 text-[15px] text-ink-2 sm:text-base">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-signal-soft text-signal">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>Por qué importa</Eyebrow>
            <p className="text-pretty mt-5 text-xl font-medium leading-snug tracking-tight sm:text-2xl">{t.why}</p>
          </div>
        </Container>
      </Section>

      {siblings.length > 0 && (
        <Section>
          <Container>
            <Eyebrow tone="ink">Otras herramientas de {cat?.label.toLowerCase()}</Eyebrow>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {siblings.map((s) => (
                <HoverCard key={s.slug} href={`/herramientas/${s.slug}`} className="p-5">
                  <p className="font-semibold tracking-tight">{s.name}</p>
                  <p className="mt-1 text-sm text-ink-2">{s.tagline}</p>
                </HoverCard>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
