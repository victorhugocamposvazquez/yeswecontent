import type { Metadata } from "next";
import { Check, Minus, ShieldCheck, Timer, XCircle } from "lucide-react";
import { listPlans } from "@/lib/data";
import { volumeDiscounts } from "@/lib/demo";
import type { Plan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { Pricing } from "@/components/marketing/pricing";
import { AgencyPortalMockup } from "@/components/marketing/mockups";
import { Container, CtaBand, CtaLink, Eyebrow, Faq, Lead, Section, Title } from "@/components/marketing/primitives";

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
      <section className="glow relative overflow-hidden">
        <Container className="relative pt-14 pb-10 text-center sm:pt-20 md:pt-24 md:pb-12">
          <Eyebrow className="rise">Precios</Eyebrow>
          <Title as="h1" size="lg" className="rise rise-2 mx-auto mt-5 max-w-4xl">
            Más tráfico orgánico en 60 días <span className="marker">o te devolvemos el dinero</span>.
          </Title>
          <Lead className="rise rise-2 mx-auto mt-6 max-w-2xl">Un precio por web, todo incluido. Empieza con 3 días gratis y decide con datos.</Lead>
          <div className="rise rise-3 mt-6 flex flex-wrap justify-center gap-2">
            <Badge className="bg-card px-3 py-1 text-[13px]">
              <Timer className="h-3.5 w-3.5 text-signal" aria-hidden /> 3 días de prueba
            </Badge>
            <Badge className="bg-card px-3 py-1 text-[13px]">
              <ShieldCheck className="h-3.5 w-3.5 text-ok" aria-hidden /> Garantía de 60 días
            </Badge>
            <Badge className="bg-card px-3 py-1 text-[13px]">
              <XCircle className="h-3.5 w-3.5 text-ink-3" aria-hidden /> Sin permanencia
            </Badge>
          </div>
        </Container>
      </section>

      <Section className="pt-4 sm:pt-6 md:pt-8 lg:pt-10">
        <Container>
          {plans.length ? (
            <Pricing plans={plans} discounts={volumeDiscounts} />
          ) : (
            <p className="text-center text-ink-2">Estamos actualizando los planes. Escríbenos a hola@yeswecontent.com.</p>
          )}
        </Container>
      </Section>

      {/* Agencias */}
      <Section tone="paper-2">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <Eyebrow>Agencias y reventa</Eyebrow>
              <Title className="mt-4">
                Véndelo con <span className="marker">tu marca</span>. Nosotros hacemos el trabajo.
              </Title>
              <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Revende con tu marca", "Panel, informes y emails con tu logo, tus colores y tu dominio."],
                  ["Tú controlas qué se ve", "Decide qué módulos y datos ve cada cliente."],
                  ["Todos tus clientes juntos", "Un solo panel para todas las webs, con descuento por volumen."],
                  ["Ejecución en automático", "Plan, artículos, publicación y enlaces, sin ampliar plantilla."],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-signal-soft text-signal">
                      <Check className="h-3 w-3" aria-hidden />
                    </span>
                    <span>
                      <p className="font-semibold tracking-tight">{t}</p>
                      <p className="mt-0.5 text-sm text-ink-2">{d}</p>
                    </span>
                  </li>
                ))}
              </ul>
              <CtaLink href="/agencias#contacto" className="mt-8">
                Reservar una llamada de 15 min
              </CtaLink>
            </div>
            <AgencyPortalMockup />
          </div>
        </Container>
      </Section>

      {/* Comparativa */}
      {plans.length > 0 && (
        <Section id="comparativa">
          <Container>
            <div className="max-w-2xl">
              <Eyebrow>Comparativa</Eyebrow>
              <Title className="mt-4">
                Todo lo que incluye, <span className="marker">al detalle</span>.
              </Title>
            </div>
            {/* Con 1–2 planes cabe en móvil: sin contenedor de scroll, así la cabecera puede quedarse fija bajo el menú. */}
            <div className={cn("mt-10 rounded-2xl border border-line bg-card shadow-[var(--shadow-xs)] md:mt-12", plans.length > 2 ? "scroll-x" : "overflow-clip")}>
              <table className="w-full text-sm" style={{ minWidth: plans.length > 2 ? `${200 + plans.length * 96}px` : undefined }}>
                <caption className="sr-only">Comparativa de planes</caption>
                <thead className="sticky top-16 z-[2]">
                  <tr className="border-b border-line bg-card/95 backdrop-blur">
                    <th scope="col" className="sticky left-0 z-[1] w-1/2 bg-card px-4 py-4 text-left text-[13px] font-medium text-ink-3 sm:px-5">
                      Funcionalidad
                    </th>
                    {plans.map((p) => (
                      <th key={p.id} scope="col" className="px-2 py-4 text-center text-base font-semibold tracking-tight sm:px-4 sm:text-lg">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                {groups.map((g) => (
                  <tbody key={g.title}>
                    <tr className="bg-paper-2">
                      <th colSpan={plans.length + 1} scope="colgroup" className="px-4 py-2.5 text-left text-[13px] font-semibold text-ink sm:px-5">
                        <span className="sticky left-4 sm:left-5">{g.title}</span>
                      </th>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.label} className="border-t border-line">
                        <th scope="row" className="sticky left-0 z-[1] bg-card px-4 py-3 text-left font-normal text-ink-2 sm:px-5">
                          {r.label}
                          {r.hint && <span className="block text-xs text-ink-3">{r.hint}</span>}
                        </th>
                        {plans.map((p, t) => {
                          const v = r.value(p, t);
                          return (
                            <td key={p.id} className="px-2 py-3 text-center sm:px-4">
                              {v === true ? (
                                <span className="mx-auto grid h-5 w-5 place-items-center rounded-full bg-ok-soft text-ok">
                                  <Check className="h-3 w-3" aria-label="Incluido" />
                                </span>
                              ) : v === false ? (
                                <Minus className="mx-auto h-4 w-4 text-ink-3" aria-label="No incluido" />
                              ) : (
                                <span className="tabular font-semibold">{v}</span>
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

      <Section tone="paper-2">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <Title className="mt-4">
              Antes de <span className="marker">decidir</span>.
            </Title>
          </div>
          <Faq items={faqs} />
        </Container>
      </Section>

      <div className="pt-14 sm:pt-16 md:pt-24 lg:pt-28">
        <CtaBand title="Tres días para verlo con tus propios ojos." text="No se cobra nada hasta el cuarto día y cancelas con un clic desde el panel." />
      </div>
    </>
  );
}
