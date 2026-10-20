import type { Metadata } from "next";
import { Building2, Eye, Layers, Palette, Receipt, Users } from "lucide-react";
import { volumeDiscounts } from "@/lib/demo";
import { AgencyForm } from "@/components/marketing/agency-form";
import { Container, CtaLink, Eyebrow, Faq, Section, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Agencias y marca blanca",
  description: "Ofrece SEO y visibilidad en IA con tu marca: panel en marca blanca, portal de clientes, informes y ejecución automática. Reserva una llamada de 15 minutos.",
  alternates: { canonical: "/agencias" },
};

const pillars = [
  { icon: Palette, title: "Marca blanca de verdad", text: "Tu logo, tus colores y tu dominio en el panel, los informes y los emails. Tus clientes no ven nuestro nombre en ninguna parte." },
  { icon: Building2, title: "Portal para tus clientes", text: "Cada cliente entra a su espacio para aprobar temas, ver artículos, informes y facturas. Tú decides qué módulos ve." },
  { icon: Layers, title: "Todas las webs en un panel", text: "Cambia de cliente con un clic, compara resultados y detecta quién necesita atención esta semana." },
  { icon: Users, title: "Tu equipo, con permisos", text: "Invita a redactores, account managers o freelances con permisos por cliente." },
  { icon: Eye, title: "Tú controlas la visibilidad", text: "Oculta métricas, modelos o funciones que no quieras enseñar. Muestra solo lo que suma." },
  { icon: Receipt, title: "Margen para ti", text: "Precio mayorista con descuento por volumen. Pones tu precio de venta; la diferencia es tuya." },
];

const faqs = [
  { q: "¿Mis clientes sabrán que uso yeswecontent?", a: "No, salvo que tú se lo digas. El portal funciona en tu subdominio, con tu marca, y los emails salen con tu remitente." },
  { q: "¿Cómo se factura?", a: "Te facturamos a ti, con descuento por volumen según el número de webs activas. Tú facturas a tus clientes como prefieras; el portal puede mostrar tus facturas si quieres." },
  { q: "¿Puedo combinarlo con mis servicios actuales?", a: "Es lo habitual: la ejecución recurrente la hace el sistema y tu equipo se centra en estrategia, relación con el cliente y trabajos a medida." },
  { q: "¿Hay un mínimo de webs?", a: "No. Puedes empezar con un cliente y crecer. El descuento empieza a partir de dos webs." },
];

export default function AgenciasPage() {
  const maxPct = Math.max(...volumeDiscounts.map((d) => d.pct));
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-ink text-paper">
        <Container className="relative grid grid-cols-1 items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Eyebrow tone="paper">Para agencias</Eyebrow>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
              Más clientes de SEO <span className="text-lime">sin contratar</span> a nadie más.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-paper/75">
              Ofrece contenido, enlaces y visibilidad en IA con tu propia marca. Nosotros ponemos la maquinaria; tú, la relación con el cliente y el criterio.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <CtaLink href="#contacto" tone="lime" size="lg">
                Reservar una llamada de 15 min
              </CtaLink>
              <CtaLink href="/precios#volumen" tone="paper" size="lg" arrow={false}>
                Ver descuentos
              </CtaLink>
            </div>
          </div>
          {/* Mock del portal */}
          <div className="rounded-2xl border border-paper/20 bg-paper p-4 text-ink shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)]">
            <div className="flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-paper">
              <span className="font-display text-xl">Tu Agencia</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/60">portal.tuagencia.com</span>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {[
                ["Clínica Azahar", "8 artículos · +3 menciones IA", "ok"],
                ["Rutas Norte", "12 artículos · 3 idiomas", "ok"],
                ["Pedalea", "Pendiente de aprobar plan", "warn"],
                ["LegalClaro", "6 artículos · auditoría 84", "ok"],
              ].map(([n, d, s]) => (
                <li key={n} className="flex items-center justify-between gap-3 px-1 py-3">
                  <span>
                    <span className="block font-semibold">{n}</span>
                    <span className="block text-xs text-ink-3">{d}</span>
                  </span>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s === "ok" ? "bg-ok" : "bg-warn"}`} aria-hidden />
                </li>
              ))}
            </ul>
            <p className="mt-2 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Ejemplo ilustrativo</p>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Qué incluye</Eyebrow>
            <Title className="mt-4">
              Tu servicio, <span className="marker">nuestra sala de máquinas</span>.
            </Title>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-line bg-card p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-lime">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-ink-2">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-line bg-paper-2">
        <Container className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {[
            ["1", "Llamada de 15 minutos", "Vemos cuántos clientes tienes, qué vendes y si encajamos. Sin presentaciones eternas."],
            ["2", "Configuramos tu marca", "Logo, colores, subdominio y remitente de emails. Lo dejamos listo contigo."],
            ["3", "Das de alta clientes", `Cada web nueva suma al descuento por volumen, hasta un ${maxPct}%.`],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span className="font-display text-7xl leading-none text-signal">{n}</span>
              <h3 className="mt-3 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-ink-2">{d}</p>
            </div>
          ))}
        </Container>
      </Section>

      <Section id="contacto" className="scroll-mt-16">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>Hablemos</Eyebrow>
            <Title className="mt-4">
              Reserva <span className="marker">15 minutos</span> y lo vemos.
            </Title>
            <p className="mt-5 max-w-md text-lg text-ink-2">Déjanos tus datos y te proponemos un par de huecos. Si no encajamos, te lo diremos en la misma llamada.</p>
            <Faq items={faqs} className="mt-10" />
          </div>
          <AgencyForm />
        </Container>
      </Section>
    </>
  );
}
