/**
 * Plantillas de prompts para Claude. Todas piden JSON estricto para poder
 * validarlo con zod en el servidor.
 */
import type { ContentItem, Site } from "@/lib/types";

const langName: Record<string, string> = { es: "español de España", en: "inglés", fr: "francés", de: "alemán", it: "italiano", pt: "portugués", ca: "catalán" };
export const languageLabel = (code: string) => langName[code] ?? code;

export const SYSTEM_STRATEGIST =
  "Eres estratega de contenidos SEO y GEO (optimización para respuestas de IA). Respondes solo con JSON válido, sin texto antes ni después y sin bloques de código.";

export function analyzeSitePrompt(url: string, extract: string) {
  return `Analiza la página de inicio de ${url}. Este es el contenido extraído (título, descripción, encabezados y texto):

"""
${extract.slice(0, 12000)}
"""

Devuelve un JSON con esta forma:
{"name": string, "niche": string, "audience": string, "description": string, "language": "es"|"en"|"fr"|"de"|"it"|"pt"|"ca", "competitors": [{"name": string, "url": string}], "tone": string}

- "description": 1–2 frases sobre qué vende o hace el negocio, en español.
- "audience": a quién se dirige, en una frase.
- "competitors": hasta 5 competidores reales y conocidos del mismo mercado (no inventes dominios si no estás seguro; omite en ese caso).
- "tone": cómo suena su marca en 4–8 palabras.`;
}

export function contentPlanPrompt(site: Pick<Site, "name" | "url" | "niche" | "audience" | "description" | "language">, count: number, existing: string[], month: string) {
  return `Crea el plan de contenidos de ${month} para ${site.name} (${site.url}).
Nicho: ${site.niche ?? "—"}
Público: ${site.audience ?? "—"}
Descripción: ${site.description ?? "—"}
Idioma de los artículos: ${languageLabel(site.language)}

Ya publicados o planificados (no repitas): ${existing.slice(0, 60).join(" | ") || "ninguno"}

Propón ${count} artículos agrupados en 3–5 clústeres temáticos. Prioriza búsquedas con intención clara y preguntas que la gente hace a ChatGPT o Perplexity.
Devuelve un JSON: {"items": [{"title": string, "keyword": string, "cluster": string, "intent": "informational"|"commercial"|"transactional"|"navigational", "search_volume": number, "difficulty": number}]}
"search_volume" es tu estimación mensual y "difficulty" de 0 a 100.`;
}

export function articlePrompt(
  item: Pick<ContentItem, "title" | "keyword" | "intent" | "cluster">,
  site: Pick<Site, "name" | "url" | "niche" | "audience" | "description" | "language" | "brand_voice" | "seo_settings">,
  internalLinks: { title: string; url: string }[],
) {
  const v = site.brand_voice ?? {};
  const s = site.seo_settings ?? {};
  return `Escribe un artículo para el blog de ${site.name} (${site.url}).

Tema: ${item.title}
Palabra clave principal: ${item.keyword}
Intención: ${item.intent ?? "informational"} · Clúster: ${item.cluster ?? "—"}
Negocio: ${site.description ?? site.niche ?? "—"}
Público: ${site.audience ?? "—"}
Idioma: ${languageLabel(site.language)}

Voz de marca:
- Tono: ${v.tone ?? "cercano y claro"}
- Persona gramatical: ${v.person ?? "nosotros"}
- Palabras que nunca usamos: ${(v.avoid ?? []).join(", ") || "ninguna"}
${v.examples?.length ? `- Ejemplo de cómo escribimos: """${v.examples[0].slice(0, 1500)}"""` : ""}

Requisitos SEO/GEO:
- Mínimo ${s.min_words ?? 1200} palabras.
- Primer párrafo: respuesta directa a la pregunta en 40–60 palabras.
- Subtítulos ## y ### claros; listas cuando ayuden.
- Incluye ${s.internal_links ?? 3} enlaces internos en Markdown elegidos de esta lista (si está vacía, omítelos): ${internalLinks.map((l) => `[${l.title}](${l.url})`).join(", ") || "—"}
- ${s.faq === false ? "Sin sección de preguntas frecuentes." : "Incluye 3–5 preguntas frecuentes con respuestas breves."}
- No inventes datos, cifras ni testimonios.

Devuelve un JSON:
{"title": string, "meta_title": string (≤ 60 caracteres), "meta_description": string (140–160 caracteres), "slug": string, "body_md": string (Markdown, sin el H1), "faq": [{"q": string, "a": string}]}`;
}

export function visibilityPrompt(prompt: string) {
  return `${prompt}

Responde como lo harías a cualquier persona que te lo pregunte, nombrando marcas o webs concretas cuando sea útil.`;
}
