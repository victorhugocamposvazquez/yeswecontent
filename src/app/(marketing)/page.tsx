import { Fragment, type CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, Globe, Quote, Search } from "lucide-react";
import { listPlans } from "@/lib/data";
import { eur, num } from "@/lib/utils";
import { getProduct } from "@/lib/marketing/products";
import { growth, listPublishedCases } from "@/lib/marketing/cases";
import { Badge, Button, Card, Input } from "@/components/ui";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { RotatingWord } from "@/components/marketing/rotating-word";
import { RatingPill } from "@/components/marketing/rating-pill";
import { EngineWordmark } from "@/components/marketing/engine-wordmark";
import { AiMatrixMockup, EditorMockup, NetworkGraphMockup, PanelMockup, ProductMockup, SocialMockup } from "@/components/marketing/mockups";
import { ENGINES } from "@/lib/marketing/social-proof";
import { AiCitations, GrowthChart, RankClimb, Reveal, ScrollStatement, ScrollSteps, Stagger, StickyShowcase, TiltIn, Watch, type StatementPart } from "@/components/marketing/scroll-fx";
import { Container, CtaBand, CtaLink, EngineLogo, Eyebrow, Faq, HoverCard, IconBox, Lead, ProductGlyph, Section, TextLink, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: { absolute: "yeswecontent · Tráfico orgánico desde Google y la IA, en piloto automático" },
  description:
    "Plan de contenidos, artículos con tu voz, publicación automática, enlaces y seguimiento en ChatGPT, Claude, Gemini y Perplexity. Prueba 3 días gratis.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    n: "01",
    title: "Nos cuentas quién eres",
    text: "Pegas la URL de tu web. Leemos lo que vendes, cómo hablas y contra quién compites. Ajustas tono y temas en cinco minutos.",
  },
  {
    n: "02",
    title: "Aprobamos el plan juntos",
    text: "Recibes un calendario de temas con su porqué: volumen, intención y dificultad. Quitas, añades o lo dejas tal cual.",
  },
  {
    n: "03",
    title: "Tu web empieza a crecer",
    text: "Cada artículo se escribe, se puntúa, se enlaza y se publica solo. Tú miras el resumen del lunes con un café.",
  },
];

const featureRows = [
  { slug: "redactor-ia", eyebrow: "Escritura", title: "Artículos que suenan a ti", text: "Aprendemos tu voz de tu propia web y la respetamos en cada texto. Cada artículo llega con nota de calidad, FAQ, datos estructurados e imágenes." },
  { slug: "plan-de-contenidos", eyebrow: "Estrategia", title: "Un plan hecho para tu web, no para la media", text: "Investigamos qué búsquedas puedes ganar de verdad y las ordenamos en clústeres para que cada artículo empuje a los demás." },
  { slug: "autopublicacion", eyebrow: "Publicación", title: "Se publica sin que toques nada", text: "WordPress, Shopify, Webflow, Ghost o una API. Elige días y hora; nosotros nos encargamos de maquetar y subir." },
  { slug: "red-de-enlaces", eyebrow: "Autoridad", title: "Enlaces sin pedir favores por email", text: "Una red de intercambio entre webs afines que se enlazan dentro de contenido útil. Tú revisas cada enlace." },
  { slug: "auditoria-geo", eyebrow: "Técnica", title: "Arreglamos lo que te frena", text: "Rastreo, etiquetas, velocidad, datos estructurados y preparación para IA, ordenados por impacto y con su solución." },
];

const languages = [
  "Español", "English", "Català", "Euskara", "Galego", "Português", "Français", "Deutsch", "Italiano", "Nederlands", "Polski", "Svenska",
  "Dansk", "Norsk", "Suomi", "Čeština", "Română", "Magyar", "Ελληνικά", "Türkçe", "Русский", "Українська", "العربية", "עברית",
  "हिन्दी", "বাংলা", "日本語", "한국어", "中文", "ไทย", "Tiếng Việt", "Bahasa Indonesia", "Bahasa Melayu", "Filipino", "Kiswahili", "Hrvatski",
];

const guides = [
  { tag: "Guía · 24 págs.", title: "GEO sin humo: cómo conseguir que la IA te cite", text: "Qué leen los asistentes, qué no, y una lista de 20 cambios que puedes hacer esta semana." },
  { tag: "Plantilla", title: "Tu primer plan de contenidos en una hoja", text: "La misma estructura que usa nuestro planificador, para que la pruebes a mano." },
  { tag: "Checklist", title: "Antes de publicar: 30 comprobaciones", text: "Del title al JSON-LD, lo que revisamos en cada artículo antes de darle a publicar." },
];

const faqs = [
  { q: "No sé nada de SEO. ¿Esto es para mí?", a: "Sí. Está pensado precisamente para quien no quiere aprender SEO para poder vender. Tú aportas lo que sabes de tu negocio; nosotros, el método." },
  { q: "¿En cuánto tiempo se notan resultados?", a: "Las primeras impresiones en Google suelen aparecer en semanas, pero el crecimiento sólido llega entre el tercer y el sexto mes. Quien te prometa resultados en días, te está vendiendo otra cosa." },
  { q: "¿Google castiga el contenido escrito con IA?", a: "Google castiga el contenido que no ayuda a nadie. Medimos la calidad de cada artículo, añadimos experiencia real de tu marca y citamos fuentes. Y puedes revisar todo antes de publicar." },
  { q: "¿Cómo funciona eso de que la IA me recomiende?", a: "Los asistentes responden a partir de lo que encuentran y entienden en la web. Publicar contenido claro, bien estructurado y citado por otras webs aumenta las opciones de aparecer. Lo medimos a diario para que veas si funciona." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí, sin permanencia y desde el propio panel. Además, si en 60 días no ves más tráfico orgánico, te devolvemos el dinero." },
];

function Statement({ parts, tone = "paper" }: { parts: StatementPart[]; tone?: "paper" | "paper-2" }) {
  return (
    <section className={tone === "paper-2" ? "bg-paper-2" : undefined}>
      <Container className="py-20 sm:py-28 md:py-36 lg:py-44">
        <ScrollStatement parts={parts} className="max-w-[1080px]" />
      </Container>
    </section>
  );
}

export default async function HomePage() {
  const [plans, cases] = await Promise.all([listPlans(), listPublishedCases()]);
  const cheapest = plans.length ? Math.min(...plans.map((p) => p.yearly_price_eur || p.monthly_price_eur)) : null;

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="glow relative overflow-hidden">
        <div aria-hidden className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[36rem]" />
        <Container className="relative flex flex-col items-center pt-14 text-center sm:pt-20 md:pt-24">
          <Eyebrow className="rise">SEO + GEO · en piloto automático</Eyebrow>
          <h1 className="rise rise-2 mt-5 w-full max-w-[1100px] font-display text-[clamp(2.125rem,6.4vw,4.75rem)]">
            <span className="sr-only">Automatiza que te encuentren cuando buscan en Google, ChatGPT, Gemini, Perplexity o Claude.</span>
            <span aria-hidden className="block">Automatiza que te encuentren</span>
            <span aria-hidden className="block md:whitespace-nowrap">
              cuando buscan en <RotatingWord className="max-sm:mx-auto max-sm:block" />
            </span>
          </h1>
          <Lead className="rise rise-2 mt-6 max-w-2xl md:text-xl">
            Escribimos, publicamos y posicionamos el contenido de tu web para que Google y los asistentes de IA te recomienden, sin que tengas que montar un equipo de SEO.
          </Lead>
          <div className="rise rise-3 mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <CtaLink href="/registro" size="lg" className="w-full sm:w-auto">
              Prueba gratis 3 días
            </CtaLink>
            <CtaLink href="#como-funciona" tone="paper" size="lg" arrow={false} className="w-full sm:w-auto">
              Ver cómo funciona
            </CtaLink>
          </div>
          <div className="rise rise-3 mt-7">
            <RatingPill />
          </div>

          <div className="rise rise-3 relative mt-12 w-full max-w-[1100px] sm:mt-16">
            <div aria-hidden className="pointer-events-none absolute -inset-x-10 -top-10 h-40 rounded-full bg-signal/10 blur-3xl" />
            <TiltIn className="relative">
              <PanelMockup />
            </TiltIn>
          </div>
        </Container>

        {/* Plataformas */}
        <div aria-label="Dónde te posicionamos" className="relative mt-10 overflow-hidden border-y border-line bg-paper/70 py-4 backdrop-blur sm:mt-14">
          <p className="sr-only">Te posicionamos en {ENGINES.map((e) => e.name).join(", ")}.</p>
          <div aria-hidden className="ticker flex w-max gap-3 whitespace-nowrap">
            {Array.from({ length: 4 }).flatMap((_, k) =>
              ENGINES.map((e) => (
                <span key={`${k}-${e.name}`} className="inline-flex items-center rounded-full border border-line bg-card px-4 py-2 text-[1.125rem] shadow-[var(--shadow-xs)]">
                  <EngineWordmark name={e.name} decorative />
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* ───────── MARCAS DE EJEMPLO ───────── */}
      {cases.length > 0 && (
        <section aria-label="Sectores de ejemplo" className="border-b border-line bg-paper">
          <Container className="py-10 md:py-12">
            <p className="text-center text-xs font-medium text-ink-3">Funciona en sectores como estos · marcas de ejemplo</p>
            <ul className="mt-6 grid grid-cols-2 items-center gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
              {cases.slice(0, 6).map((c) => (
                <li key={c.slug} className="flex h-8 items-center justify-center">
                  <span className="truncate text-[1.125rem] font-semibold tracking-tight text-ink-3 sm:text-xl" title={c.sector ?? undefined}>
                    {c.company}
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* ───────── FRASE: EQUIPO ───────── */}
      <Statement
        parts={[
          "Tu equipo de expertos en SEO y GEO que trabaja sin descanso,",
          { text: "yeswecan,", tone: "accent" },
          "con",
          { text: "yeswecontent!", tone: "brand" },
        ]}
      />

      {/* ───────── 3 PASOS ───────── */}
      <Section id="como-funciona">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow>Cómo funciona</Eyebrow>
              <Title className="mt-4">
                Crecer en <span className="marker">tres pasos</span>, y ninguno es una reunión.
              </Title>
            </div>
            <Lead className="max-w-sm text-base">Configuras una vez. A partir de ahí, el sistema trabaja cada semana y tú decides cuánto quieres supervisar.</Lead>
          </div>
          <ScrollSteps steps={steps} />
          <div className="mt-6 grid grid-cols-1 items-center gap-10 rounded-3xl border border-line bg-paper-2 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:p-14">
            <div>
              <Eyebrow tone="ink">Lo que pasa cada semana</Eyebrow>
              <Title size="sm" className="mt-4">
                Un artículo se escribe, se publica… y <span className="marker">la IA lo cita</span>.
              </Title>
              <Lead className="mt-4 max-w-md text-base">
                Ejemplo con una marca ficticia: el artículo sale con nota de calidad, FAQ y schema, se publica a su hora y acaba como fuente en la respuesta de un asistente.
              </Lead>
            </div>
            <HeroVisual />
          </div>
        </Container>
      </Section>

      {/* ───────── ANTES Y DESPUÉS ───────── */}
      <Section className="pt-0 sm:pt-0 md:pt-0 lg:pt-0">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>Antes y después</Eyebrow>
            <Title className="mt-4">
              La semana 20 empezó a publicar. <span className="marker">Mira la curva</span>.
            </Title>
            <Lead className="mx-auto mt-5 max-w-2xl">
              Así se ve en Search Console una web que pasa de publicar cuando puede a publicar cada semana con plan, enlaces y datos estructurados.
            </Lead>
          </div>
          <Reveal className="mt-10 md:mt-14">
            <GrowthChart />
          </Reveal>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Reveal>
              <p className="mb-3 text-[13px] font-semibold text-ink-2">Sube en Google</p>
              <RankClimb />
            </Reveal>
            <Reveal delay={120}>
              <p className="mb-3 text-[13px] font-semibold text-ink-2">Y la IA empieza a citarte</p>
              <AiCitations />
            </Reveal>
          </div>
          <p className="mt-5 text-xs text-ink-3">Ejemplo ilustrativo con una marca ficticia. Cada web crece a su ritmo.</p>
        </Container>
      </Section>

      {/* ───────── VISIBILIDAD SIN TRABAJO MANUAL ───────── */}
      <Section tone="paper-2">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>El sistema completo</Eyebrow>
            <Title className="mt-4">
              Visibilidad <span className="marker">sin trabajo manual</span>
            </Title>
            <Lead className="mt-5">Cinco piezas que normalmente necesitan cinco proveedores. Aquí funcionan juntas y se hablan entre sí.</Lead>
          </div>
          <StickyShowcase className="mt-14 grid grid-cols-1 lg:mt-12 lg:grid-cols-2 lg:gap-x-16">
            {featureRows.map((f, i) => {
              const p = getProduct(f.slug)!;
              return (
                <Fragment key={f.slug}>
                  <div data-sx-text={i} className={i ? "pt-16 md:pt-24 lg:pt-0" : ""}>
                    <div className="lg:flex lg:min-h-[80vh] lg:flex-col lg:justify-center">
                      <div className="flex items-center gap-3">
                        <IconBox>
                          <ProductGlyph icon={p.icon} />
                        </IconBox>
                        <Eyebrow tone="ink">
                          {String(i + 1).padStart(2, "0")} · {f.eyebrow}
                        </Eyebrow>
                      </div>
                      <Title as="h3" size="sm" className="mt-5">
                        {f.title}
                      </Title>
                      <Lead className="mt-4 max-w-md text-base">{f.text}</Lead>
                      <ul className="mt-5 space-y-2.5">
                        {p.features.slice(0, 3).map((x) => (
                          <li key={x.title} className="flex gap-2.5 text-[15px] text-ink-2">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-signal-soft text-signal">
                              <Check className="h-3 w-3" aria-hidden />
                            </span>
                            <span>
                              <strong className="font-semibold text-ink">{x.title}.</strong> {x.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <TextLink href={`/producto/${p.slug}`} className="mt-6">
                        Ver {p.name.toLowerCase()}
                      </TextLink>
                    </div>
                  </div>
                  <div data-sx-media={i} className="mt-8 lg:mt-0">
                    <Reveal>
                      <ProductMockup slug={f.slug} />
                    </Reveal>
                  </div>
                </Fragment>
              );
            })}
          </StickyShowcase>
        </Container>
      </Section>

      {/* ───────── FRASE: TU NEGOCIO ───────── */}
      <Statement
        parts={[
          "Mientras tú atiendes tu negocio, nosotros conseguimos que",
          { text: "Google y la IA", tone: "accent" },
          "hablen de ti.",
        ]}
      />

      {/* ───────── SOCIAL ───────── */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow>Visibilidad social</Eyebrow>
              <Title className="mt-4">
                También donde la gente <span className="marker">pregunta en voz alta</span>.
              </Title>
              <Lead className="mt-5 max-w-lg">
                Reddit y Quora son de las fuentes que más consultan los asistentes. Te proponemos respuestas útiles basadas en tus artículos, y convertimos cada artículo en un carrusel para tus redes.
              </Lead>
              <CtaLink href="/producto/social" tone="paper" className="mt-8">
                Cómo funciona
              </CtaLink>
            </div>
            <SocialMockup />
          </div>
        </Container>
      </Section>

      {/* ───────── VISIBILIDAD IA ───────── */}
      <Section tone="ink" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(40% 50% at 80% 10%, rgba(255,79,31,0.22), transparent 70%), radial-gradient(30% 40% at 10% 90%, rgba(212,245,90,0.12), transparent 70%)" }}
        />
        <Container className="relative">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-end">
            <div>
              <Eyebrow tone="paper">Visibilidad en IA</Eyebrow>
              <Title className="mt-4 text-paper">
                Entérate de cuándo la IA <span className="text-lime">te recomienda</span>.
              </Title>
            </div>
            <p className="text-pretty text-base leading-relaxed text-paper/70 sm:text-lg">
              Eliges las preguntas que haría tu cliente. Cada día se las hacemos a cuatro asistentes y apuntamos si sales, en qué posición, con qué fuentes y junto a qué competidores.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-2 md:mt-12">
            {["ChatGPT", "Claude", "Gemini", "Perplexity"].map((m) => (
              <span key={m} className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-[13px] font-medium text-paper">
                <EngineLogo name={m} size={16} alt="" /> {m}
              </span>
            ))}
          </div>
          <Watch className="mt-5">
            <AiMatrixMockup />
          </Watch>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-paper/50">Ejemplo con una marca ficticia · #n = posición en la respuesta</p>
            <Link href="/producto/visibilidad-ia" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-lime transition-colors duration-150 hover:text-paper sm:min-h-0">
              Más sobre visibilidad en IA <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Container>
      </Section>

      {/* ───────── IDIOMAS ───────── */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div>
              <Eyebrow>Idiomas</Eyebrow>
              <Title className="mt-4">
                Más de <span className="marker">50 idiomas</span>, cada uno con su acento.
              </Title>
              <Lead className="mt-5 max-w-md">
                No traducimos: investigamos las búsquedas de cada mercado y escribimos para ese lector. Ideal si vendes fuera o si tu público es bilingüe.
              </Lead>
              <p className="mt-5 inline-flex items-center gap-2 text-sm text-ink-3">
                <Globe className="h-4 w-4" aria-hidden /> Con hreflang y versiones enlazadas entre sí.
              </p>
            </div>
            <Stagger as="ul" className="flex flex-wrap gap-2" label="Algunos de los idiomas disponibles">
              {languages.map((l, i) => (
                <li key={l} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm shadow-[var(--shadow-xs)]" style={{ "--i": i } as CSSProperties}>
                  {l}
                </li>
              ))}
              <li className="rounded-full border border-dashed border-line-2 px-3.5 py-1.5 text-sm text-ink-2" style={{ "--i": languages.length } as CSSProperties}>
                y más…
              </li>
            </Stagger>
          </div>
        </Container>
      </Section>

      {/* ───────── ARTÍCULO DE MUESTRA ───────── */}
      <Section tone="paper-2">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Un artículo de muestra</Eyebrow>
            <Title className="mt-4">
              Así queda un texto <span className="marker">recién salido</span> del horno.
            </Title>
            <Lead className="mt-5">Ejemplo ficticio para una clínica de fisioterapia. Fíjate en la respuesta directa arriba, las preguntas frecuentes y los enlaces internos.</Lead>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:mt-12 lg:grid-cols-[1.7fr_1fr]">
            <EditorMockup />
            <aside className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <Card className="p-5">
                <p className="text-[13px] font-medium text-ink-3">Preguntas frecuentes incluidas</p>
                <ul className="mt-3 space-y-2">
                  {["¿Puedo alternar frío y calor?", "¿Cuánto tiempo aplico el calor?", "¿Cuándo debo pedir cita?"].map((q) => (
                    <li key={q} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13px]">
                      {q} <span aria-hidden className="text-ink-3">+</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="rounded-2xl border border-line bg-ink p-5 font-mono text-[12px] leading-relaxed text-paper shadow-[var(--shadow-xs)]">
                <p className="text-lime">{'<script type="application/ld+json">'}</p>
                <p className="pl-3 text-paper/80">{'"@type": "FAQPage",'}</p>
                <p className="pl-3 text-paper/80">{'"mainEntity": [ … 3 ]'}</p>
                <p className="text-lime">{"</script>"}</p>
              </div>
              <Card className="bg-lime-soft p-5 sm:col-span-2 lg:col-span-1">
                <p className="text-[13px] font-medium text-ink-2">Incluido</p>
                <p className="mt-1.5 text-sm leading-relaxed">Meta descripción · 4 enlaces internos · imagen de portada con alt · programado para el jueves 9:00</p>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>

      {/* ───────── RED DE ENLACES ───────── */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-2 lg:order-1">
              <Watch>
                <NetworkGraphMockup />
              </Watch>
            </div>
            <div className="order-1 lg:order-2">
              <Eyebrow>Red de enlaces</Eyebrow>
              <Title className="mt-4">
                Una red que se hace <span className="marker">más fuerte</span> con cada web que entra.
              </Title>
              <Lead className="mt-5 max-w-lg">
                Cada cliente aporta enlaces desde sus artículos y recibe enlaces de webs de su temática. Cuantas más webs se suman, más opciones relevantes hay para todos. Sin granjas, sin reciprocidad obvia y con tu visto bueno.
              </Lead>
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Afinidad", "solo webs de temática relacionada"],
                  ["Contexto", "enlaces dentro de artículos útiles"],
                  ["Control", "apruebas o rechazas cada uno"],
                ].map(([k, v]) => (
                  <li key={k}>
                    <Card className="h-full p-4">
                      <p className="font-semibold tracking-tight">{k}</p>
                      <p className="mt-1 text-sm text-ink-2">{v}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────── DOS RESULTADOS ───────── */}
      <Section className="pt-0 sm:pt-0 md:pt-0 lg:pt-0">
        <Container>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card className="bg-sky-soft p-7 md:p-10">
              <Eyebrow tone="ink">Resultado 1</Eyebrow>
              <Title as="h3" size="sm" className="mt-4">
                Aparece en las respuestas de la IA
              </Title>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
                Contenido con respuestas directas, datos estructurados, fuentes citadas y presencia en las conversaciones que leen los modelos. Todo lo que facilita que te mencionen.
              </p>
              <div className="mt-6 rounded-xl border border-line bg-card p-4 text-sm shadow-[var(--shadow-xs)]">
                <p className="flex items-center gap-2 text-ink-3">
                  <EngineLogo name="ChatGPT" size={14} alt="" /> «¿Qué fisio me recomiendas en Valencia para la espalda?»
                </p>
                <p className="mt-2">
                  …entre las opciones mejor valoradas está <mark className="rounded bg-lime px-1">Clínica Azahar</mark>, que además publica guías…
                </p>
              </div>
            </Card>
            <Card className="p-7 md:p-10">
              <Eyebrow tone="ink">Resultado 2</Eyebrow>
              <Title as="h3" size="sm" className="mt-4">
                Sube posiciones en Google
              </Title>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-2">Publicación constante, clústeres temáticos, enlazado interno y enlaces externos de calidad: la receta de siempre, sin tener que cocinarla tú.</p>
              <div className="mt-6 space-y-2" aria-hidden>
                {[
                  ["fisioterapia espalda valencia", 14, 3],
                  ["contractura lumbar qué hacer", 38, 6],
                  ["frío o calor dolor espalda", 0, 2],
                ].map(([k, from, to]) => (
                  <div key={k as string} className="flex items-center justify-between rounded-lg border border-line bg-paper-2 px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <EngineLogo name="Google" size={14} alt="" />
                      <span className="truncate">{k}</span>
                    </span>
                    <span className="tabular ml-3 shrink-0 text-xs">
                      <span className="text-ink-3">{from ? `#${from}` : "—"}</span> → <Badge tone="lime" className="px-1.5 font-semibold">#{to}</Badge>
                    </span>
                  </div>
                ))}
                <p className="pt-1 text-xs text-ink-3">Ejemplo ilustrativo</p>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ───────── FRASE: CADA SEMANA ───────── */}
      <Statement
        parts={["Cada semana, más búsquedas que", { text: "terminan en tu web.", tone: "accent" }, "Sin reuniones. Sin excusas. Sin parar."]}
      />

      {/* ───────── CASOS ───────── */}
      {cases.length > 0 && (
        <Section tone="paper-2">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <Eyebrow>Casos de ejemplo</Eyebrow>
                <Title className="mt-4">
                  Lo que pasa cuando el contenido <span className="marker">no se para</span>.
                </Title>
              </div>
              <CtaLink href="/casos" tone="paper">
                Ver todos los casos
              </CtaLink>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:grid-cols-3">
              {cases.slice(0, 3).map((c, i) => (
                <Reveal key={c.slug} delay={i * 120}>
                  <HoverCard href={`/casos/${c.slug}`} className="flex h-full flex-col p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Badge>{c.sector}</Badge>
                      {growth(c) && (
                        <Badge tone="lime" className="tabular font-semibold">
                          {growth(c)}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-5 text-xl font-semibold leading-snug tracking-tight">
                      Cómo {c.company} pasó de {num(c.metric_before ?? 0)} a {num(c.metric_after ?? 0)} {c.metric_label}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-2">{c.summary}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold transition-colors duration-150 group-hover:text-signal">
                      Leer el caso <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </span>
                  </HoverCard>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 text-xs text-ink-3">Casos ilustrativos con empresas ficticias, construidos a partir de escenarios típicos.</p>
          </Container>
        </Section>
      )}

      {/* ───────── PRECIOS (teaser) ───────── */}
      <Section>
        <Container>
          <Card className="grid grid-cols-1 gap-10 p-7 md:grid-cols-[1.2fr_1fr] md:items-center md:p-12 lg:p-14">
            <div>
              <Eyebrow>Precios</Eyebrow>
              <Title className="mt-4">
                Menos que un freelance, <span className="marker">más constante</span> que nadie.
              </Title>
              <Lead className="mt-5 max-w-lg">Un precio por web, todo incluido. Pagando al año ahorras en torno a la mitad. Y si gestionas varias webs, hay descuento por volumen.</Lead>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <CtaLink href="/precios">Ver planes</CtaLink>
                <TextLink href="/agencias">¿Eres agencia?</TextLink>
              </div>
            </div>
            <Stagger className="space-y-3">
              {plans.map((p, i) => (
                <div key={p.id} style={{ "--i": i * 4 } as CSSProperties} className={`flex items-center justify-between rounded-xl border px-5 py-4 ${i === plans.length - 1 && plans.length > 1 ? "border-ink bg-ink text-paper" : "border-line bg-paper-2"}`}>
                  <div>
                    <p className="text-lg font-semibold tracking-tight">{p.name}</p>
                    <p className={`text-[13px] ${i === plans.length - 1 && plans.length > 1 ? "text-paper/65" : "text-ink-2"}`}>
                      {p.articles_per_month} artículos/mes · {p.tracked_prompts} preguntas en IA
                    </p>
                  </div>
                  <p className="text-right">
                    <span className="tabular block text-2xl font-semibold tracking-tight">{eur(p.yearly_price_eur || p.monthly_price_eur)}</span>
                    <span className={`block text-xs ${i === plans.length - 1 && plans.length > 1 ? "text-paper/65" : "text-ink-3"}`}>/mes, pago anual</span>
                  </p>
                </div>
              ))}
              {cheapest !== null && (
                <p className="text-center text-xs text-ink-3" style={{ "--i": plans.length * 4 } as CSSProperties}>
                  Desde {eur(cheapest)}/mes · 3 días gratis
                </p>
              )}
            </Stagger>
          </Card>
        </Container>
      </Section>

      {/* ───────── CHECK GRATIS ───────── */}
      <Section className="pt-0 sm:pt-0 md:pt-0 lg:pt-0">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-lime-soft p-7 md:p-12 lg:p-14">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/60 blur-3xl" />
            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
              <div>
                <Eyebrow tone="ink">Gratis · solo diagnóstico</Eyebrow>
                <Title className="mt-4">¿Tu web está preparada? Mira la nota. El trabajo empieza después.</Title>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
                  El análisis gratuito mide la base técnica (0–100). Si sigues con YesWeContent, pasamos a generar artículos, backlinks, auditoría completa, social y seguimiento en IA — en automático.
                </p>
              </div>
              <form action="/herramientas/auditoria-ia#analizador" method="get" className="surface p-4 sm:p-5">
                <label htmlFor="home-url" className="mb-1.5 block text-[13px] font-medium text-ink-2">
                  Tu web
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
                    <Input id="home-url" name="url" required placeholder="tuweb.com" inputMode="url" autoComplete="url" className="h-11 pl-9" />
                  </div>
                  <Button type="submit" size="lg" className="h-11">
                    Ver diagnóstico
                  </Button>
                </div>
                <p className="mt-3 text-xs text-ink-3">Sin registro. Tras el informe, puedes probar 3 días todo el servicio (contenido, enlaces, panel y más).</p>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────── GUÍAS ───────── */}
      <Section className="pt-0 sm:pt-0 md:pt-0 lg:pt-0">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Guías gratuitas</Eyebrow>
            <Title className="mt-4">
              Para quien prefiere <span className="marker">entenderlo</span> primero.
            </Title>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:grid-cols-3">
            {guides.map((g, i) => (
              <Reveal key={g.title} delay={i * 120}>
                <HoverCard href="/blog" className="flex h-full flex-col p-5">
                  <div className={`mb-5 grid aspect-[3/2] place-items-center rounded-xl ${["bg-signal text-white", "bg-sky-soft text-ink", "bg-paper-2 text-ink"][i]}`}>
                    <BookOpen className="h-9 w-9" aria-hidden strokeWidth={1.5} />
                  </div>
                  <Badge className="w-fit">{g.tag}</Badge>
                  <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{g.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">{g.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold transition-colors duration-150 group-hover:text-signal">
                    Leer en el blog <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </HoverCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ───────── FAQ ───────── */}
      <Section className="pt-0 sm:pt-0 md:pt-0 lg:pt-0">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <Title className="mt-4">
              Lo que <span className="marker">todo el mundo</span> pregunta.
            </Title>
            <Card className="mt-8 p-5">
              <IconBox>
                <Quote />
              </IconBox>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">¿Te queda alguna duda? Escríbenos a hola@yeswecontent.com y te responde una persona.</p>
            </Card>
          </div>
          <Faq items={faqs} />
        </Container>
      </Section>

      <CtaBand
        title={<>Tu próximo cliente ya está preguntando. Que te encuentre.</>}
        text="Tres días gratis, sin permanencia y con garantía de 60 días. Si no te convence, no pagas."
        secondary={{ label: "Ver precios", href: "/precios" }}
      />
    </>
  );
}
