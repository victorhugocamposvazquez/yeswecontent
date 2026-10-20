import type { Metadata } from "next";
import { Gift, Link2, Wallet } from "lucide-react";
import { Container, CtaLink, Eyebrow, Faq, Section, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Programa de afiliados",
  description: "Recomienda yeswecontent y llévate una comisión recurrente por cada cliente que llegue de tu parte.",
  alternates: { canonical: "/afiliados" },
};

export default function AfiliadosPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <Container className="relative py-16 md:py-24">
          <Eyebrow>Afiliados</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Recomiéndanos y cobra <span className="marker">cada mes</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-2">
            Si escribes, enseñas o asesoras sobre marketing, tu audiencia probablemente necesita contenido constante. Te damos un enlace y una comisión recurrente del 25% durante los primeros 12 meses de cada cliente.
          </p>
          <CtaLink href="/registro?ref=afiliados" size="lg" className="mt-8">
            Quiero mi enlace
          </CtaLink>
        </Container>
      </section>
      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { I: Link2, t: "1. Comparte tu enlace", d: "Lo tienes en tu panel nada más crear la cuenta. La cookie dura 60 días." },
              { I: Gift, t: "2. Tu audiencia gana", d: "Quien llega con tu enlace tiene 7 días de prueba en lugar de 3." },
              { I: Wallet, t: "3. Tú cobras", d: "25% de cada pago durante 12 meses. Liquidamos mensualmente a partir de 50 €." },
            ].map(({ I, t, d }) => (
              <div key={t} className="rounded-2xl border border-line bg-card p-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-lime">
                  <I className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="mt-5 text-xl font-semibold">{t}</h2>
                <p className="mt-2 text-ink-2">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Condiciones orientativas, sujetas a las bases del programa.</p>
        </Container>
      </Section>
      <Section className="pt-0 md:pt-0">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Title>
            Preguntas <span className="marker">rápidas</span>
          </Title>
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
