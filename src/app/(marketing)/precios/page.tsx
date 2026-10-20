import type { Metadata } from "next";
import { Check, Minus, ShieldCheck, Timer } from "lucide-react";
import { listPlans } from "@/lib/data";
import { volumeDiscounts } from "@/lib/demo";
import type { Plan } from "@/lib/types";
import { Pricing } from "@/components/marketing/pricing";
import { Container, CtaBand, CtaLink, Eyebrow, Faq, Section, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Precios",
  description: "Planes por web con todo incluido: artículos, publicación automática, enlaces y seguimiento en IA. 3 días gratis y garantía de 60 días.",
  alternates: { canonical: "/precios" },
};

type Cell = string | boolean;
type Row = { label: string; hint?: string; value: (p: Plan, tier: number) => Cell };

const groups: { title: string; rows: Row[] }[] = [
  {
    title: "Contenido",
    rows: [
      { label: "Artículos al mes", value: (p) => String(p.articles_per_month) },
      { label: "Plan de contenidos mensual", value: () => true },
      { label: "Investigación de palabras clave", value: () => true },
      { label: "Nota de calidad 0–100", value: () => true },
      { label: "FAQ y datos estructurados JSON-LD", value: () => true },
      { label: "Imágenes con tu estilo visual", value: () => true },
      { label: "Actualización de artículos antiguos", value: () => true },
      { label: "Idiomas", value: (p) => String(p.languages) },
    ],
  },
  {
    title: "Publicación",
    rows: [
      { label: "WordPress, Shopify, Webflow y Ghost", value: () => true },
      { label: "Webhook o API", value: () => true },
      { label: "Calendario de publicación", value: () => true },
      { label: "Enlazado interno automático", value: () => true },
    ],
  },
  {
    title: "Backlinks",
    rows: [
      { label: "Créditos de enlaces al mes", value: (p) => String(p.backlink_credits) },
      { label: "Acceso a la red de intercambio", value: () => true },
      { label: "Revisión manual de cada enlace", value: () => true },
    ],
  },
  {
    title: "Visibilidad IA",
    rows: [
      { label: "Preguntas seguidas", value: (p) => String(p.tracked_prompts) },
      { label: "Modelos", hint: "ChatGPT, Claude, Gemini, Perplexity", value: (_, t) => (t > 0 ? "4" : "3") },
      { label: "Fuentes citadas y competidores", value: () => true },
      { label: "Agentes de Reddit y Quora", value: (_, t) => t > 0 },
      { label: "Carruseles para Instagram y Facebook", value: (p) => (p.social_cadence === "daily" ? "Diarios" : "Semanales") },
    ],
  },
  {
    title: "Analítica e integraciones",
    rows: [
      { label: "Google Search Console", value: () => true },
      { label: "Google Analytics 4", value: () => true },
      { label: "Tráfico desde asistentes de IA", value: () => true },
      { label: "Auditoría técnica y GEO mensual", value: () => true },
      { label: "Informe compartible por enlace", value: () => true },
    ],
  },
  {
    title: "Equipo y soporte",
    rows: [
      { label: "Usuarios", value: (p) => (p.seats ? String(p.seats) : "Ilimitados") },
      { label: "Editora de contenidos asignada", value: (_, t) => t > 0 },
      { label: "Soporte", value: (_, t) => (t > 0 ? "Prioritario" : "Email") },
    ],
  },
];

const faqs = [
  { q: "No soy experto en SEO. ¿Lo voy a saber usar?", a: "Sí. Las decisiones técnicas las toma el sistema y te las explica en cristiano. Tú solo apruebas temas y, si quieres, revisas textos." },
  { q: "¿Cuánto se tarda en ver resultados?", a: "Las primeras señales en Search Console suelen llegar en pocas semanas. El crecimiento consistente se ve entre el tercer y el sexto mes de publicación constante. Por eso la garantía es de 60 días: para que tengas tiempo de ver la tendencia." },
  { q: "¿Cómo funciona el intercambio de enlaces?", a: "Cada web de la red da enlaces desde sus artículos y gana créditos que se convierten en enlaces recibidos desde webs de temática afín. Repartimos los enlaces para evitar reciprocidad directa y puedes revisar y rechazar cada uno." },
  { q: "¿Google penaliza el contenido creado con IA?", a: "Google no penaliza la herramienta, penaliza el contenido de poco valor. Cada artículo pasa un control de calidad, incluye información real de tu negocio y fuentes, y puedes revisarlo antes de publicar." },
  { q: "¿Qué tipo de artículos escribís?", a: "Guías, comparativas, listas, tutoriales, respuestas a preguntas concretas, artículos de producto y páginas locales. El plan mezcla formatos según la intención de cada búsqueda." },
  { q: "¿Cómo funciona la prueba y la garantía?", a: "Tienes 3 días gratis para ver el plan y los primeros artículos. Si después de 60 días de suscripción no ves más tráfico orgánico en Search Console que al empezar, nos escribes y te devolvemos lo pagado. Sin letra pequeña rebuscada." },
  { q: "¿Puedo cambiar de plan o cancelar?", a: "Cuando quieras, desde el panel. Al subir de plan se prorratea; al cancelar, mantienes el acceso hasta el final del periodo pagado." },
];

export default async function PreciosPage() {
  const plans = await listPlans();

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Container className="relative py-16 text-center md:py-24">
          <Eyebrow>Precios</Eyebrow>
          <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Más tráfico orgánico en 60 días <span className="marker">o te devolvemos el dinero</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-2">Un precio por web, todo incluido. Empieza con 3 días gratis y decide con datos.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5">
              <Timer className="h-3.5 w-3.5" aria-hidden /> 3 días de prueba
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Garantía de 60 días
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5">Sin permanencia</span>
          </div>
        </Container>
      </section>

      <Section className="pt-14 md:pt-16">
        <Container>
          {plans.length ? (
            <Pricing plans={plans} discounts={volumeDiscounts} />
          ) : (
            <p className="text-center text-ink-2">Estamos actualizando los planes. Escríbenos a hola@yeswecontent.com.</p>
          )}
        </Container>
      </Section>

      {/* Agencias */}
      <Section className="pt-0 md:pt-0">
        <Container>
          <div className="grid gap-10 rounded-2xl border border-line bg-ink p-8 text-paper md:grid-cols-[1.1fr_1fr] md:p-14">
            <div>
              <Eyebrow tone="paper">Agencias y reventa</Eyebrow>
              <h2 className="mt-4 font-display text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
                Véndelo con <span className="text-lime">tu marca</span>. Nosotros hacemos el trabajo.
              </h2>
              <CtaLink href="/agencias#contacto" tone="lime" className="mt-8">
                Reservar una llamada de 15 min
              </CtaLink>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                ["Revende con tu marca", "Panel, informes y emails con tu logo, tus colores y tu dominio."],
                ["Tú controlas qué se ve", "Decide qué módulos y datos ve cada cliente."],
                ["Todos tus clientes juntos", "Un solo panel para todas las webs, con descuento por volumen."],
                ["Ejecución en automático", "Plan, artículos, publicación y enlaces, sin ampliar plantilla."],
              ].map(([t, d]) => (
                <li key={t} className="rounded-2xl border border-paper/20 p-5">
                  <p className="font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-paper/70">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* Comparativa */}
      {plans.length > 0 && (
        <Section className="pt-0 md:pt-0" id="comparativa">
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>Comparativa</Eyebrow>
              <Title className="mt-4">
                Todo lo que incluye, <span className="marker">al detalle</span>.
              </Title>
            </div>
            <div className="mt-12 overflow-x-auto rounded-2xl border border-line bg-card">
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">Comparativa de planes</caption>
                <thead className="sticky top-0">
                  <tr className="border-b border-line bg-card">
                    <th scope="col" className="w-1/2 px-5 py-5 text-left font-mono text-[11px] font-normal uppercase tracking-[0.16em] text-ink-3">
                      Funcionalidad
                    </th>
                    {plans.map((p) => (
                      <th key={p.id} scope="col" className="px-4 py-5 text-center font-display text-2xl font-normal">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                {groups.map((g) => (
                  <tbody key={g.title}>
                    <tr className="bg-paper-2">
                      <th colSpan={plans.length + 1} scope="colgroup" className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
                        {g.title}
                      </th>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.label} className="border-t border-line">
                        <th scope="row" className="px-5 py-3.5 text-left font-normal">
                          {r.label}
                          {r.hint && <span className="block text-xs text-ink-3">{r.hint}</span>}
                        </th>
                        {plans.map((p, t) => {
                          const v = r.value(p, t);
                          return (
                            <td key={p.id} className="px-4 py-3.5 text-center">
                              {v === true ? (
                                <Check className="mx-auto h-5 w-5 text-ok" aria-label="Incluido" />
                              ) : v === false ? (
                                <Minus className="mx-auto h-5 w-5 text-ink-3" aria-label="No incluido" />
                              ) : (
                                <span className="font-semibold tabular-nums">{v}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </Container>
        </Section>
      )}

      <Section className="pt-0 md:pt-0">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <Title className="mt-4">
              Antes de <span className="marker">decidir</span>.
            </Title>
          </div>
          <Faq items={faqs} />
        </Container>
      </Section>

      <CtaBand title="Tres días para verlo con tus propios ojos." text="No se cobra nada hasta el cuarto día y cancelas con un clic desde el panel." />
    </>
  );
}
