import type { Metadata } from "next";
import { Building2, Eye, Layers, Palette, Receipt, Users } from "lucide-react";
import { volumeDiscounts } from "@/lib/demo";
import { Card } from "@/components/ui";
import { AgencyForm } from "@/components/marketing/agency-form";
import { AgencyPortalMockup } from "@/components/marketing/mockups";
import { Container, CtaLink, Eyebrow, Faq, IconBox, Lead, Section, Title } from "@/components/marketing/primitives";

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
      <section className="relative overflow-hidden bg-ink text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(45% 60% at 85% 20%, rgba(255,79,31,0.22), transparent 70%), radial-gradient(35% 45% at 10% 100%, rgba(212,245,90,0.14), transparent 70%)" }}
        />
        <Container className="relative grid grid-cols-1 items-center gap-12 py-14 sm:py-20 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <Eyebrow tone="paper" className="rise">
              Para agencias
            </Eyebrow>
            <Title as="h1" size="lg" className="rise rise-2 mt-5">
              Más clientes de SEO <span className="text-lime">sin contratar</span> a nadie más.
            </Title>
            <p className="text-pretty rise rise-2 mt-6 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
              Ofrece contenido, enlaces y visibilidad en IA con tu propia marca. Nosotros ponemos la maquinaria; tú, la relación con el cliente y el criterio.
            </p>
            <div className="rise rise-3 mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <CtaLink href="#contacto" tone="lime" size="lg">
                Reservar una llamada de 15 min
              </CtaLink>
              <CtaLink href="/precios#volumen" tone="paper" size="lg" arrow={false}>
                Ver descuentos
              </CtaLink>
            </div>
          </div>
          <div className="rise rise-3">
            <AgencyPortalMockup />
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
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:gap-5 lg:grid-cols-3">
            {pillars.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="p-6 sm:p-7">
                <IconBox>
                  <Icon />
                </IconBox>
                <h3 className="mt-4 text-lg font-semibold tracking-tight sm:text-xl">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Cómo empezar</Eyebrow>
            <Title className="mt-4">Tres pasos y estás vendiendo.</Title>
          </div>
          <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {[
              ["1", "Llamada de 15 minutos", "Vemos cuántos clientes tienes, qué vendes y si encajamos. Sin presentaciones eternas."],
              ["2", "Configuramos tu marca", "Logo, colores, subdominio y remitente de emails. Lo dejamos listo contigo."],
              ["3", "Das de alta clientes", `Cada web nueva suma al descuento por volumen, hasta un ${maxPct}%.`],
            ].map(([n, t, d]) => (
              <li key={n}>
                <Card className="h-full p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">{n}</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{d}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="contacto" className="scroll-mt-16">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>Hablemos</Eyebrow>
            <Title className="mt-4">
              Reserva <span className="marker">15 minutos</span> y lo vemos.
            </Title>
            <Lead className="mt-5 max-w-md">Déjanos tus datos y te proponemos un par de huecos. Si no encajamos, te lo diremos en la misma llamada.</Lead>
            <Faq items={faqs} className="mt-10" />
          </div>
          <AgencyForm />
        </Container>
      </Section>
    </>
  );
}
