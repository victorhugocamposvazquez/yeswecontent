import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, Globe, Minus, Quote, Search, Star, X } from "lucide-react";
import { listPlans } from "@/lib/data";
import { eur, num } from "@/lib/utils";
import { getProduct } from "@/lib/marketing/products";
import { growth, listPublishedCases } from "@/lib/marketing/cases";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { RotatingWord } from "@/components/marketing/rotating-word";
import { BrandLogo } from "@/components/marketing/brand-logo";
import { ENGINES, RATING } from "@/lib/marketing/social-proof";
import { Container, CtaBand, CtaLink, Eyebrow, Faq, ProductGlyph, Section, Ticket, Title } from "@/components/marketing/primitives";

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

const prompts = [
  { q: "mejor tienda de cerámica artesanal online", r: ["#2", "#3", null, "fuente"] },
  { q: "vajilla de gres apta para lavavajillas", r: ["#1", "#2", "#4", "#1"] },
  { q: "regalo hecho a mano para una boda", r: [null, "#5", null, null] },
  { q: "cómo cuidar piezas de barro esmaltado", r: ["fuente", "#1", "#2", "fuente"] },
];
const models = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

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

export default async function HomePage() {
  const [plans, cases] = await Promise.all([listPlans(), listPublishedCases()]);
  const cheapest = plans.length ? Math.min(...plans.map((p) => p.yearly_price_eur || p.monthly_price_eur)) : null;

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden border-b border-line">
        <Container className="relative flex flex-col items-center py-16 text-center md:py-24">
          <Eyebrow>SEO + GEO · en piloto automático</Eyebrow>
          <h1 className="mt-6 font-display text-4xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="sr-only">Automatiza que te encuentren cuando buscan en Google, ChatGPT, Gemini, Perplexity o Claude.</span>
            <span aria-hidden className="block">Automatiza que te encuentren</span>
            <span aria-hidden className="block">
              cuando buscan en <RotatingWord />
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-2 md:text-xl">
            Escribimos, publicamos y posicionamos el contenido de tu web para que Google y los asistentes de IA te recomienden, sin que tengas que montar un equipo de SEO.
          </p>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
            <CtaLink href="/registro" size="lg">
              Prueba gratis 3 días
            </CtaLink>
            <CtaLink href="#como-funciona" tone="paper" size="lg" arrow={false}>
              Ver cómo funciona
            </CtaLink>
          </div>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <div className="flex -space-x-2" aria-hidden>
              {RATING.avatars.map((a, i) => (
                <span
                  key={a}
                  className={`grid h-9 w-9 place-items-center rounded-full border border-line font-mono text-[10px] font-bold ${["bg-lime", "bg-sky", "bg-signal text-white", "bg-paper-2", "bg-card"][i % 5]}`}
                >
                  {a}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex text-signal" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </span>
              <span className="font-semibold tabular-nums">
                {RATING.score.toLocaleString("es-ES")}/{RATING.outOf}
              </span>
              <span className="text-ink-2">{RATING.label}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* ───────── TICKER DE MOTORES ───────── */}
      <section aria-label="Dónde te posicionamos" className="overflow-hidden border-b border-line bg-paper-2 py-4">
        <p className="sr-only">Te posicionamos en {ENGINES.map((e) => e.name).join(", ")}.</p>
        <div aria-hidden className="ticker flex w-max gap-3 whitespace-nowrap">
          {Array.from({ length: 4 }).flatMap((_, k) =>
            ENGINES.map((e) => (
              <span key={`${k}-${e.name}`} className="inline-flex items-center gap-2.5 rounded-full border border-line bg-card px-4 py-2 text-ink-2">
                <BrandLogo src={e.logo} className="h-5 w-5 text-ink" />
                <span className="text-sm font-semibold">{e.name}</span>
              </span>
            )),
          )}
        </div>
      </section>

      {/* ───────── FRANJA DE SECTORES (marcas de ejemplo) ───────── */}
      {cases.length > 0 && (
        <section aria-label="Sectores de ejemplo" className="border-b border-line bg-card">
          <Container className="flex flex-col items-center gap-4 py-7 md:flex-row md:justify-between">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">Funciona en sectores como · marcas de ejemplo</p>
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {cases.map((c) => (
                <li key={c.slug} className="flex items-baseline gap-2">
                  <span className="font-display text-2xl">{c.company}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">{c.sector}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

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
            <p className="max-w-sm text-ink-2">Configuras una vez. A partir de ahí, el sistema trabaja cada semana y tú decides cuánto quieres supervisar.</p>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="relative rounded-2xl border border-line bg-card p-7">
                <span className="font-mono text-sm font-semibold text-signal">{s.n}</span>
                <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-ink-2 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 grid items-center gap-12 rounded-2xl border border-line bg-paper-2 p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <Eyebrow tone="ink">Lo que pasa cada semana</Eyebrow>
              <p className="mt-4 font-display text-3xl leading-[1.1] md:text-4xl">
                Un artículo se escribe, se publica… y <span className="marker">la IA lo cita</span>.
              </p>
              <p className="mt-4 max-w-md text-ink-2">
                Ejemplo con una marca ficticia: el artículo sale con nota de calidad, FAQ y schema, se publica a su hora y acaba como fuente en la respuesta de un asistente.
              </p>
            </div>
            <HeroVisual />
          </div>
        </Container>
      </Section>

      {/* ───────── VISIBILIDAD SIN TRABAJO MANUAL ───────── */}
      <Section className="border-y border-line bg-paper-2">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>El sistema completo</Eyebrow>
            <Title className="mt-4">
              Visibilidad <span className="marker">sin trabajo manual</span>
            </Title>
            <p className="mt-5 text-lg text-ink-2">Cinco piezas que normalmente necesitan cinco proveedores. Aquí funcionan juntas y se hablan entre sí.</p>
          </div>
          <div className="mt-16 space-y-20 md:space-y-28">
            {featureRows.map((f, i) => {
              const p = getProduct(f.slug)!;
              return (
                <div key={f.slug} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                  <div className={i % 2 ? "md:order-2" : ""}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-card">
                        <ProductGlyph icon={p.icon} className="h-5 w-5" />
                      </span>
                      <Eyebrow tone="ink">
                        {String(i + 1).padStart(2, "0")} · {f.eyebrow}
                      </Eyebrow>
                    </div>
                    <h3 className="mt-5 font-display text-3xl leading-[1.1] md:text-4xl">{f.title}</h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-2">{f.text}</p>
                    <ul className="mt-5 space-y-2">
                      {p.features.slice(0, 3).map((x) => (
                        <li key={x.title} className="flex gap-2 text-ink-2">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-signal" aria-hidden />
                          <span>
                            <strong className="font-semibold text-ink">{x.title}.</strong> {x.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/producto/${p.slug}`} className="mt-6 inline-flex items-center gap-1 font-semibold underline decoration-2 underline-offset-4 hover:text-signal">
                      Ver {p.name.toLowerCase()} <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                  <div className={i % 2 ? "md:order-1" : ""}>
                    <Ticket {...p.sample} />
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* ───────── SOCIAL ───────── */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow>Visibilidad social</Eyebrow>
              <Title className="mt-4">
                También donde la gente <span className="marker">pregunta en voz alta</span>.
              </Title>
              <p className="mt-5 max-w-lg text-lg text-ink-2">
                Reddit y Quora son de las fuentes que más consultan los asistentes. Te proponemos respuestas útiles basadas en tus artículos, y convertimos cada artículo en un carrusel para tus redes.
              </p>
              <CtaLink href="/producto/social" tone="paper" className="mt-8">
                Cómo funciona
              </CtaLink>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-card p-5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Agente de Reddit · r/Ceramics</p>
                  <span className="rounded-full bg-paper-2 px-2 py-0.5 text-xs">Borrador</span>
                </div>
                <p className="mt-3 font-semibold">«¿Qué esmalte es seguro para tazas de uso diario?»</p>
                <p className="mt-2 border-l-4 border-signal pl-3 text-sm leading-relaxed text-ink-2">
                  Lo importante es que el esmalte esté certificado sin plomo y que la pieza esté vitrificada. Escribimos una guía con las pruebas que hacemos en el taller, por si te sirve…
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-card p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Agente de Quora</p>
                <p className="mt-3 text-sm font-semibold">«¿Merece la pena la cerámica artesanal frente a la industrial?»</p>
                <p className="mt-2 text-xs text-ink-3">Respuesta lista para revisar</p>
              </div>
              <div className="relative rounded-2xl border border-line bg-signal p-5 text-signal-ink">
                <span className="absolute -top-3 right-4 rounded-full border border-line bg-lime px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink">Nuevo</span>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/80">Carrusel · Instagram y Facebook</p>
                <div className="mt-3 flex gap-1.5" aria-hidden>
                  {["01", "02", "03", "04"].map((n, i) => (
                    <span key={n} className={`grid h-14 w-11 place-items-center rounded-md border border-line font-display text-lg ${i === 0 ? "bg-paper text-ink" : "bg-white/20"}`}>
                      {n}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/85">8 diapositivas a partir del último artículo</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────── VISIBILIDAD IA ───────── */}
      <section className="border-y border-line bg-ink py-20 text-paper md:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <div>
              <Eyebrow tone="paper">Visibilidad en IA</Eyebrow>
              <h2 className="mt-4 font-display text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
                Entérate de cuándo la IA <span className="text-lime">te recomienda</span>.
              </h2>
            </div>
            <p className="text-lg text-paper/75">
              Eliges las preguntas que haría tu cliente. Cada día se las hacemos a cuatro asistentes y apuntamos si sales, en qué posición, con qué fuentes y junto a qué competidores.
            </p>
          </div>
          <div className="mt-12 overflow-x-auto rounded-2xl border border-paper/20">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Ejemplo de seguimiento de menciones en asistentes de IA</caption>
              <thead>
                <tr className="border-b border-paper/20 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60">
                  <th className="px-5 py-4 font-normal">Pregunta seguida</th>
                  {models.map((m) => (
                    <th key={m} className="px-4 py-4 text-center font-normal">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prompts.map((p) => (
                  <tr key={p.q} className="border-b border-paper/10 last:border-0">
                    <td className="px-5 py-4 font-display text-xl">«{p.q}»</td>
                    {p.r.map((r, i) => (
                      <td key={i} className="px-4 py-4 text-center">
                        {r === null ? (
                          <span className="inline-flex items-center gap-1 text-paper/40">
                            <X className="h-4 w-4" aria-hidden /> <span className="sr-only">No aparece</span>
                          </span>
                        ) : r === "fuente" ? (
                          <span className="rounded-full border border-lime px-2.5 py-1 font-mono text-[11px] text-lime">fuente</span>
                        ) : (
                          <span className="rounded-full bg-lime px-2.5 py-1 font-mono text-[11px] font-bold text-ink">{r}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/50">Ejemplo con una marca ficticia · #n = posición en la respuesta</p>
            <Link href="/producto/visibilidad-ia" className="inline-flex items-center gap-1 font-semibold text-lime underline decoration-2 underline-offset-4">
              Más sobre visibilidad en IA <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Container>
      </section>

      {/* ───────── IDIOMAS ───────── */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow>Idiomas</Eyebrow>
              <Title className="mt-4">
                Más de <span className="marker">50 idiomas</span>, cada uno con su acento.
              </Title>
              <p className="mt-5 max-w-md text-lg text-ink-2">
                No traducimos: investigamos las búsquedas de cada mercado y escribimos para ese lector. Ideal si vendes fuera o si tu público es bilingüe.
              </p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm text-ink-3">
                <Globe className="h-4 w-4" aria-hidden /> Con hreflang y versiones enlazadas entre sí.
              </p>
            </div>
            <ul className="flex flex-wrap gap-2" aria-label="Algunos de los idiomas disponibles">
              {languages.map((l) => (
                <li
                  key={l}
                  className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm"
                >
                  {l}
                </li>
              ))}
              <li className="rounded-full border border-dashed border-line px-3.5 py-1.5 text-sm text-ink-2">y más…</li>
            </ul>
          </div>
        </Container>
      </Section>

      {/* ───────── ARTÍCULO DE MUESTRA ───────── */}
      <Section className="border-y border-line bg-paper-2">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Un artículo de muestra</Eyebrow>
            <Title className="mt-4">
              Así queda un texto <span className="marker">recién salido</span> del horno.
            </Title>
            <p className="mt-5 text-lg text-ink-2">Ejemplo ficticio para una clínica de fisioterapia. Fíjate en la respuesta directa arriba, las preguntas frecuentes y los enlaces internos.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <article className="rounded-2xl border border-line bg-card p-6 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:p-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Blog · Clínica Azahar · 6 min</p>
              <h3 className="mt-3 font-display text-3xl leading-[1.1] md:text-4xl">¿Frío o calor para el dolor de espalda? Depende de cuándo empezó</h3>
              <div className="mt-6 rounded-xl border-l-4 border-signal bg-paper p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">Respuesta corta</p>
                <p className="mt-1 leading-relaxed">
                  Si el dolor apareció hace menos de 48 horas tras un golpe o un esfuerzo, frío. Si es una molestia que arrastras desde hace semanas, calor. Ante dolor intenso u hormigueo, consulta.
                </p>
              </div>
              <h4 className="mt-7 text-xl font-semibold">Por qué el frío funciona en las primeras horas</h4>
              <p className="mt-2 leading-relaxed text-ink-2">
                El frío reduce el flujo de sangre en la zona y calma la inflamación inicial. Aplica una bolsa envuelta en un paño durante 15 minutos, nunca directamente sobre la piel. Si quieres entender qué pasa en una{" "}
                <span className="font-medium text-ink underline decoration-signal decoration-2 underline-offset-2">contractura lumbar</span>, te lo contamos en detalle.
              </p>
              <h4 className="mt-6 text-xl font-semibold">Preguntas frecuentes</h4>
              <ul className="mt-3 space-y-2">
                {["¿Puedo alternar frío y calor?", "¿Cuánto tiempo aplico el calor?", "¿Cuándo debo pedir cita?"].map((q) => (
                  <li key={q} className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5 text-sm">
                    {q} <span aria-hidden className="font-mono">+</span>
                  </li>
                ))}
              </ul>
            </article>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-line bg-card p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">Nota de calidad</p>
                <p className="mt-2 font-display text-6xl leading-none">
                  91<span className="text-2xl text-ink-3">/100</span>
                </p>
                <dl className="mt-5 space-y-2.5 text-sm">
                  {[
                    ["Legibilidad", 94],
                    ["Cobertura del tema", 88],
                    ["Estructura", 95],
                    ["Señales SEO", 90],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <div className="flex justify-between">
                        <dt className="text-ink-2">{k}</dt>
                        <dd className="font-mono">{v}</dd>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-paper-2">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-2xl border border-line bg-ink p-6 font-mono text-[12px] leading-relaxed text-paper">
                <p className="text-lime">{"<script type=\"application/ld+json\">"}</p>
                <p className="pl-3">{'"@type": "FAQPage",'}</p>
                <p className="pl-3">{'"mainEntity": [ … 3 ]'}</p>
                <p className="text-lime">{"</script>"}</p>
              </div>
              <div className="rounded-2xl border border-line bg-lime p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em]">Incluido</p>
                <p className="mt-2 text-sm">Meta descripción · 4 enlaces internos · imagen de portada con alt · programado para el jueves 9:00</p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* ───────── RED DE ENLACES ───────── */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1">
              <NetworkDiagram />
            </div>
            <div className="order-1 lg:order-2">
              <Eyebrow>Red de enlaces</Eyebrow>
              <Title className="mt-4">
                Una red que se hace <span className="marker">más fuerte</span> con cada web que entra.
              </Title>
              <p className="mt-5 max-w-lg text-lg text-ink-2">
                Cada cliente aporta enlaces desde sus artículos y recibe enlaces de webs de su temática. Cuantas más webs se suman, más opciones relevantes hay para todos. Sin granjas, sin reciprocidad obvia y con tu visto bueno.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Afinidad", "solo webs de temática relacionada"],
                  ["Contexto", "enlaces dentro de artículos útiles"],
                  ["Control", "apruebas o rechazas cada uno"],
                ].map(([k, v]) => (
                  <li key={k} className="rounded-xl border border-line bg-card p-4">
                    <p className="font-semibold">{k}</p>
                    <p className="mt-1 text-sm text-ink-2">{v}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────── DOS RESULTADOS ───────── */}
      <Section className="pt-0 md:pt-0">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-sky/50 p-8 md:p-10">
              <Eyebrow tone="ink">Resultado 1</Eyebrow>
              <h3 className="mt-4 font-display text-3xl leading-[1.1] md:text-4xl">Aparece en las respuestas de la IA</h3>
              <p className="mt-4 text-ink-2">
                Contenido con respuestas directas, datos estructurados, fuentes citadas y presencia en las conversaciones que leen los modelos. Todo lo que facilita que te mencionen.
              </p>
              <div className="mt-6 rounded-xl border border-line bg-card p-4 text-sm">
                <p className="text-ink-3">«¿Qué fisio me recomiendas en Valencia para la espalda?»</p>
                <p className="mt-2">
                  …entre las opciones mejor valoradas está <mark className="bg-lime px-1">Clínica Azahar</mark>, que además publica guías…
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-card p-8 md:p-10">
              <Eyebrow tone="ink">Resultado 2</Eyebrow>
              <h3 className="mt-4 font-display text-3xl leading-[1.1] md:text-4xl">Sube posiciones en Google</h3>
              <p className="mt-4 text-ink-2">Publicación constante, clústeres temáticos, enlazado interno y enlaces externos de calidad: la receta de siempre, sin tener que cocinarla tú.</p>
              <div className="mt-6 space-y-2" aria-hidden>
                {[
                  ["fisioterapia espalda valencia", 14, 3],
                  ["contractura lumbar qué hacer", 38, 6],
                  ["frío o calor dolor espalda", 0, 2],
                ].map(([k, from, to]) => (
                  <div key={k as string} className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2 text-sm">
                    <span className="truncate">{k}</span>
                    <span className="ml-3 shrink-0 font-mono text-xs">
                      <span className="text-ink-3">{from ? `#${from}` : "—"}</span> → <span className="rounded bg-lime px-1.5 font-bold">#{to}</span>
                    </span>
                  </div>
                ))}
                <p className="pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Ejemplo ilustrativo</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────── CASOS ───────── */}
      {cases.length > 0 && (
        <Section className="border-y border-line bg-paper-2">
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
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {cases.slice(0, 3).map((c) => (
                <Link key={c.slug} href={`/casos/${c.slug}`} className="group flex flex-col rounded-2xl border border-line bg-card p-6 transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{c.sector}</span>
                    {growth(c) && <span className="rounded-full bg-lime px-2.5 py-0.5 font-mono text-xs font-bold">{growth(c)}</span>}
                  </div>
                  <h3 className="mt-4 font-display text-3xl leading-[1.05]">
                    Cómo {c.company} pasó de {num(c.metric_before ?? 0)} a {num(c.metric_after ?? 0)} {c.metric_label}
                  </h3>
                  <p className="mt-3 flex-1 text-sm text-ink-2">{c.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold group-hover:text-signal">
                    Leer el caso <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Casos ilustrativos con empresas ficticias, construidos a partir de escenarios típicos.</p>
          </Container>
        </Section>
      )}

      {/* ───────── PRECIOS (teaser) ───────── */}
      <Section>
        <Container>
          <div className="grid gap-10 rounded-2xl border border-line bg-card p-8 md:grid-cols-[1.2fr_1fr] md:items-center md:p-14">
            <div>
              <Eyebrow>Precios</Eyebrow>
              <Title className="mt-4">
                Menos que un freelance, <span className="marker">más constante</span> que nadie.
              </Title>
              <p className="mt-5 max-w-lg text-lg text-ink-2">Un precio por web, todo incluido. Pagando al año ahorras en torno a la mitad. Y si gestionas varias webs, hay descuento por volumen.</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <CtaLink href="/precios">Ver planes</CtaLink>
                <Link href="/agencias" className="font-semibold underline decoration-2 underline-offset-4">
                  ¿Eres agencia?
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {plans.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-line bg-paper px-5 py-4">
                  <div>
                    <p className="font-display text-3xl">{p.name}</p>
                    <p className="text-sm text-ink-2">
                      {p.articles_per_month} artículos/mes · {p.tracked_prompts} preguntas en IA
                    </p>
                  </div>
                  <p className="text-right">
                    <span className="block text-2xl font-semibold">{eur(p.yearly_price_eur || p.monthly_price_eur)}</span>
                    <span className="block text-xs text-ink-3">/mes, pago anual</span>
                  </p>
                </div>
              ))}
              {cheapest !== null && <p className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Desde {eur(cheapest)}/mes · 3 días gratis</p>}
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────── CHECK GRATIS ───────── */}
      <Section className="pt-0 md:pt-0">
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-lime p-8 md:p-14">
            <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
              <div>
                <Eyebrow tone="ink">Gratis, en un minuto</Eyebrow>
                <h2 className="mt-4 font-display text-3xl leading-[1.1] sm:text-4xl md:text-5xl">¿Está tu web lista para que la IA te recomiende?</h2>
              </div>
              <form action="/herramientas/auditoria-ia" method="get" className="rounded-2xl border border-line bg-card p-4 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:p-5">
                <label htmlFor="home-url" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
                  Tu web
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
                    <input
                      id="home-url"
                      name="url"
                      required
                      placeholder="tuweb.com"
                      inputMode="url"
                      autoComplete="url"
                      className="w-full rounded-lg border border-line bg-paper py-3 pr-4 pl-9 outline-none focus:ring-4 focus:ring-signal/30"
                    />
                  </div>
                  <button type="submit" className="rounded-lg border border-line bg-signal px-6 py-3 font-semibold text-signal-ink shadow-sm">
                    Analizar
                  </button>
                </div>
                <p className="mt-3 text-xs text-ink-3">Revisamos robots.txt, sitemap, etiquetas, datos estructurados y llms.txt. No hace falta registrarse.</p>
              </form>
            </div>
          </div>
        </Container>
      </Section>

      {/* ───────── GUÍAS ───────── */}
      <Section className="pt-0 md:pt-0">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow>Guías gratuitas</Eyebrow>
              <Title className="mt-4">
                Para quien prefiere <span className="marker">entenderlo</span> primero.
              </Title>
            </div>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {guides.map((g, i) => (
              <Link key={g.title} href="/blog" className="group relative flex flex-col rounded-2xl border border-line bg-card p-6 transition hover:shadow-md">
                <div className={`mb-6 grid aspect-[3/2] place-items-center rounded-xl border border-line ${["bg-signal", "bg-sky/60", "bg-paper-2"][i]}`}>
                  <BookOpen className={`h-10 w-10 ${i === 0 ? "text-white" : "text-ink"}`} aria-hidden />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{g.tag}</span>
                <h3 className="mt-2 font-display text-2xl leading-tight">{g.title}</h3>
                <p className="mt-2 flex-1 text-sm text-ink-2">{g.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold group-hover:text-signal">
                  Leer en el blog <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* ───────── FAQ ───────── */}
      <Section className="pt-0 md:pt-0">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <Title className="mt-4">
              Lo que <span className="marker">todo el mundo</span> pregunta.
            </Title>
            <div className="mt-8 rounded-2xl border border-line bg-card p-5">
              <Quote className="h-6 w-6 text-signal" aria-hidden />
              <p className="mt-2 text-ink-2">¿Te queda alguna duda? Escríbenos a hola@yeswecontent.com y te responde una persona.</p>
            </div>
          </div>
          <Faq items={faqs} />
        </Container>
      </Section>

      <CtaBand
        title={
          <>
            Tu próximo cliente ya está preguntando. <span className="">Que te encuentre.</span>
          </>
        }
        text="Tres días gratis, sin permanencia y con garantía de 60 días. Si no te convence, no pagas."
        secondary={{ label: "Ver precios", href: "/precios" }}
      />
    </>
  );
}

function NetworkDiagram() {
  const nodes = [
    { x: 200, y: 160, r: 34, label: "tu web", main: true },
    { x: 70, y: 70, r: 20, label: "cerámica" },
    { x: 330, y: 60, r: 22, label: "decoración" },
    { x: 360, y: 210, r: 18, label: "regalos" },
    { x: 60, y: 250, r: 22, label: "hogar" },
    { x: 210, y: 300, r: 16, label: "artesanía" },
    { x: 150, y: 30, r: 14, label: "" },
    { x: 380, y: 130, r: 12, label: "" },
    { x: 20, y: 160, r: 12, label: "" },
    { x: 300, y: 300, r: 14, label: "" },
  ];
  const edges = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [2, 3], [4, 5], [1, 4], [3, 5], [6, 1], [6, 2], [7, 2], [7, 3], [8, 1], [8, 4], [9, 3], [9, 5],
  ];
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:p-6">
      <svg viewBox="0 0 400 330" className="h-auto w-full" role="img" aria-label="Diagrama de la red de enlaces entre webs afines">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="var(--ink)"
            strokeWidth={a === 0 ? 2.5 : 1.25}
            strokeDasharray={a === 0 ? undefined : "4 4"}
            opacity={a === 0 ? 1 : 0.45}
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.main ? "var(--signal)" : n.label ? "var(--lime)" : "var(--paper-2)"} stroke="var(--ink)" strokeWidth="2.5" />
            {n.label && (
              <text
                x={n.x}
                y={n.main ? n.y + 5 : n.y + n.r + 14}
                textAnchor="middle"
                fontSize={n.main ? 14 : 11}
                fontWeight={n.main ? 700 : 500}
                fill={n.main ? "#fff" : "var(--ink)"}
                fontFamily="var(--font-mono), monospace"
              >
                {n.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        <span className="flex items-center gap-1.5">
          <Minus className="h-3 w-3" aria-hidden /> enlace activo
        </span>
        <span>esquema ilustrativo</span>
      </div>
    </div>
  );
}
