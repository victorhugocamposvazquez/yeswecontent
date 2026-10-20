import type { Site } from "@/lib/types";

/** JSON-LD (Article + FAQPage) que acompaña a cada artículo. */
export function buildJsonLd(a: { title: string; meta_description: string; faq: { q: string; a: string }[] }, site: Pick<Site, "name" | "url">, url?: string) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: a.title,
      description: a.meta_description,
      inLanguage: "es-ES",
      publisher: { "@type": "Organization", name: site.name, url: site.url },
      ...(url ? { mainEntityOfPage: url } : {}),
    },
  ];
  if (a.faq.length)
    graph.push({
      "@type": "FAQPage",
      mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  return { "@context": "https://schema.org", "@graph": graph };
}
