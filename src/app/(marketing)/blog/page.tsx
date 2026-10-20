import type { Metadata } from "next";
import { Badge, Card } from "@/components/ui";
import { Container, CtaBand, Eyebrow, Lead, Section, Title } from "@/components/marketing/primitives";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notas sobre SEO, GEO y contenido que funciona, escritas sin humo.",
  alternates: { canonical: "/blog" },
};

const posts = [
  {
    tag: "GEO",
    date: "14 oct 2026",
    read: "8 min",
    title: "Qué lee de verdad un asistente de IA cuando pregunta por tu sector",
    excerpt:
      "Spoiler: no es tu página de inicio. Repasamos qué tipo de páginas acaban citadas en las respuestas y por qué las comparativas honestas ganan a los textos de autobombo.",
    color: "bg-lime-soft text-ink",
  },
  {
    tag: "Contenido",
    date: "2 oct 2026",
    read: "6 min",
    title: "La regla de los tres párrafos: cómo empezar un artículo que alguien termine",
    excerpt: "Respuesta directa, contexto y promesa. Una estructura sencilla que mejora la lectura y, de paso, las opciones de que te usen como fuente.",
    color: "bg-sky-soft text-ink",
  },
  {
    tag: "Enlaces",
    date: "18 sep 2026",
    read: "7 min",
    title: "Enlaces que suman y enlaces que restan: una guía para no asustarse",
    excerpt: "Por qué un enlace desde una web pequeña de tu sector vale más que diez desde directorios genéricos, y cómo detectar los que conviene rechazar.",
    color: "bg-signal text-white",
  },
];

export default function BlogPage() {
  return (
    <>
      <section className="glow relative overflow-hidden border-b border-line">
        <Container className="relative py-14 sm:py-20 md:py-24">
          <Eyebrow className="rise">Blog</Eyebrow>
          <Title as="h1" size="lg" className="rise rise-2 mt-5 max-w-4xl">
            Notas de redacción, <span className="marker">sin humo</span>.
          </Title>
          <Lead className="rise rise-2 mt-6 max-w-2xl">Lo que aprendemos publicando cada semana para nuestras propias webs y las de nuestros clientes. Muy pronto, artículos completos.</Lead>
        </Container>
      </section>
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {posts.map((p, i) => (
              <Card key={p.title} className={`flex flex-col overflow-hidden ${i === 0 ? "md:col-span-3 md:flex-row" : ""}`}>
                <div className={`grid place-items-center ${p.color} ${i === 0 ? "aspect-[16/9] md:aspect-auto md:w-1/2" : "aspect-[16/9]"}`}>
                  <span className="font-display text-[clamp(2.5rem,6vw,4.5rem)]">{p.tag}</span>
                </div>
                <div className={`flex flex-1 flex-col p-6 ${i === 0 ? "md:p-10" : ""}`}>
                  <p className="text-xs text-ink-3">
                    {p.tag} · {p.date} · {p.read}
                  </p>
                  <h2 className={`mt-3 font-semibold leading-snug tracking-tight ${i === 0 ? "text-[clamp(1.5rem,3vw,2.25rem)]" : "text-xl"}`}>{p.title}</h2>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-2">{p.excerpt}</p>
                  <Badge className="mt-5 w-fit">Próximamente</Badge>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBand title="¿Prefieres que lo escribamos por ti?" />
    </>
  );
}
