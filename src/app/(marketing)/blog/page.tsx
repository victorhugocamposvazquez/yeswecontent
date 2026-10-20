import type { Metadata } from "next";
import { Container, CtaBand, Eyebrow, Section } from "@/components/marketing/primitives";

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
    color: "bg-lime",
  },
  {
    tag: "Contenido",
    date: "2 oct 2026",
    read: "6 min",
    title: "La regla de los tres párrafos: cómo empezar un artículo que alguien termine",
    excerpt: "Respuesta directa, contexto y promesa. Una estructura sencilla que mejora la lectura y, de paso, las opciones de que te usen como fuente.",
    color: "bg-sky/60",
  },
  {
    tag: "Enlaces",
    date: "18 sep 2026",
    read: "7 min",
    title: "Enlaces que suman y enlaces que restan: una guía para no asustarse",
    excerpt: "Por qué un enlace desde una web pequeña de tu sector vale más que diez desde directorios genéricos, y cómo detectar los que conviene rechazar.",
    color: "bg-signal",
  },
];

export default function BlogPage() {
  return (
    <>
      <section className="border-b border-line">
        <Container className="py-16 md:py-24">
          <Eyebrow>Blog</Eyebrow>
          <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Notas de redacción, <span className="marker">sin humo</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-2">Lo que aprendemos publicando cada semana para nuestras propias webs y las de nuestros clientes. Muy pronto, artículos completos.</p>
        </Container>
      </section>
      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((p, i) => (
              <article key={p.title} className={`flex flex-col rounded-2xl border border-line bg-card ${i === 0 ? "md:col-span-3 md:flex-row" : ""}`}>
                <div className={`grid place-items-center border-b border-line ${p.color} ${i === 0 ? "aspect-[16/9] md:aspect-auto md:w-1/2 md:border-r md:border-b-0" : "aspect-[16/9]"}`}>
                  <span className={`font-display text-7xl ${p.color === "bg-signal" ? "text-white" : "text-ink"}`}>{p.tag}</span>
                </div>
                <div className={`flex flex-1 flex-col p-6 ${i === 0 ? "md:p-10" : ""}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                    {p.tag} · {p.date} · {p.read}
                  </p>
                  <h2 className={`mt-3 font-display leading-tight ${i === 0 ? "text-4xl md:text-5xl" : "text-3xl"}`}>{p.title}</h2>
                  <p className="mt-3 flex-1 text-ink-2">{p.excerpt}</p>
                  <span className="mt-5 w-fit rounded-full bg-paper-2 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">Próximamente</span>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBand title="¿Prefieres que lo escribamos por ti?" />
    </>
  );
}
