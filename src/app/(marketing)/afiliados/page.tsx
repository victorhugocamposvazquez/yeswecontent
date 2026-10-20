import type { Metadata } from "next";
import { Gift, Link2, Wallet } from "lucide-react";
import { Card } from "@/components/ui";
import { Container, CtaLink, Eyebrow, Faq, IconBox, Lead, Section, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Programa de afiliados",
  description: "Recomienda yeswecontent y llévate una comisión recurrente por cada cliente que llegue de tu parte.",
  alternates: { canonical: "/afiliados" },
};

export default function AfiliadosPage() {
  return (
    <>
      <section className="glow relative overflow-hidden border-b border-line">
        <Container className="relative py-14 sm:py-20 md:py-24">
          <Eyebrow className="rise">Afiliados</Eyebrow>
          <Title as="h1" size="lg" className="rise rise-2 mt-5 max-w-4xl">
            Recomiéndanos y cobra <span className="marker">cada mes</span>.
          </Title>
          <Lead className="rise rise-2 mt-6 max-w-2xl">
            Si escribes, enseñas o asesoras sobre marketing, tu audiencia probablemente necesita contenido constante. Te damos un enlace y una comisión recurrente del 25% durante los primeros 12 meses de cada cliente.
          </Lead>
          <CtaLink href="/registro?ref=afiliados" size="lg" className="rise rise-3 mt-8">
            Quiero mi enlace
          </CtaLink>
        </Container>
      </section>
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {[
              { I: Link2, t: "1. Comparte tu enlace", d: "Lo tienes en tu panel nada más crear la cuenta. La cookie dura 60 días." },
              { I: Gift, t: "2. Tu audiencia gana", d: "Quien llega con tu enlace tiene 7 días de prueba en lugar de 3." },
              { I: Wallet, t: "3. Tú cobras", d: "25% de cada pago durante 12 meses. Liquidamos mensualmente a partir de 50 €." },
            ].map(({ I, t, d }) => (
              <Card key={t} className="p-6 sm:p-7">
                <IconBox>
                  <I />
                </IconBox>
                <h2 className="mt-4 text-lg font-semibold tracking-tight sm:text-xl">{t}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{d}</p>
              </Card>
            ))}
          </div>
          <p className="mt-5 text-xs text-ink-3">Condiciones orientativas, sujetas a las bases del programa.</p>
        </Container>
      </Section>
      <Section tone="paper-2">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Eyebrow>Dudas</Eyebrow>
            <Title className="mt-4">
              Preguntas <span className="marker">rápidas</span>
            </Title>
          </div>
          <Faq
            items={[
              { q: "¿Tengo que ser cliente?", a: "No, aunque ayuda: es más fácil recomendar lo que usas." },
              { q: "¿Puedo pujar por la marca en anuncios?", a: "No. No se permite pujar por «yeswecontent» ni variantes en buscadores." },
              { q: "¿Cómo veo mis resultados?", a: "En la sección de referidos del panel: clics, altas, clientes activos y comisiones." },
            ]}
          />
        </Container>
      </Section>
    </>
  );
}
