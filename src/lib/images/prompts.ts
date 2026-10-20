/**
 * Prompts de imagen construidos a partir del artículo y del estilo visual del
 * sitio (sites.visual_style), y textos alternativos descriptivos en español.
 */
import type { Site } from "@/lib/types";

export type ImageSite = Pick<Site, "name" | "niche" | "visual_style" | "url"> & { seo_settings?: Site["seo_settings"] };

export interface ImageSpec {
  kind: "cover" | "inline";
  prompt: string;
  alt: string;
  /** Título que se dibuja en el respaldo editorial. */
  title: string;
  kicker?: string;
  section?: string;
}

const NO_TEXT = "No text, no letters, no typography, no logos, no watermarks, no frames.";

function styleLine(site: ImageSite) {
  const v = site.visual_style ?? {};
  return [
    v.style ? `Visual style: ${v.style}.` : "Visual style: editorial photography, natural light, shallow depth of field.",
    v.palette ? `Colour palette: ${v.palette}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function coverSpec(a: { title: string; keyword: string; cluster?: string | null }, site: ImageSite): ImageSpec {
  return {
    kind: "cover",
    title: a.title,
    kicker: a.cluster ?? undefined,
    prompt: `Editorial blog cover image for an article titled "${a.title}" (topic: ${a.keyword}). Brand: ${site.name}${site.niche ? `, ${site.niche}` : ""}. ${styleLine(site)} Wide horizontal composition with a clear focal subject and calm negative space on the left. Realistic, high quality, magazine look. ${NO_TEXT}`,
    alt: `${capitalize(a.keyword)}: imagen de portada del artículo «${a.title}»`,
  };
}

export function inlineSpec(a: { title: string; keyword: string }, section: string, context: string, site: ImageSite): ImageSpec {
  return {
    kind: "inline",
    title: section,
    kicker: a.keyword,
    section,
    prompt: `Illustrative image for the section "${section}" of a blog article about ${a.keyword} by ${site.name}. Context: ${context.slice(0, 400)}. ${styleLine(site)} Show a concrete, realistic scene that explains the idea. ${NO_TEXT}`,
    alt: inlineAlt(section, a.keyword, site),
  };
}

/** Prompt para que Claude escriba prompts de imagen y alt text más finos. */
export function claudeImagePrompt(a: { title: string; keyword: string }, sections: { section: string; context: string }[], site: ImageSite) {
  return `Vas a preparar las imágenes de un artículo del blog de ${site.name} (${site.niche ?? "—"}).
Título: ${a.title}
Palabra clave: ${a.keyword}
Estilo visual de la marca: ${site.visual_style?.style ?? "fotografía editorial con luz natural"} · Paleta: ${site.visual_style?.palette ?? "libre"}

Secciones que llevarán imagen:
${sections.map((s, i) => `${i + 1}. ${s.section}: ${s.context.slice(0, 300)}`).join("\n")}

Para la portada y para cada sección devuelve:
- "prompt": en inglés, para un generador de imágenes; describe una escena concreta y realista coherente con el estilo y la paleta, sin texto, letras ni logos.
- "alt": en español, 8–16 palabras, describe lo que se ve y menciona el tema de forma natural (sin "imagen de").

Devuelve un JSON: {"cover": {"prompt": string, "alt": string}, "inline": [{"prompt": string, "alt": string}]} con tantos elementos en "inline" como secciones, en el mismo orden.`;
}

export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Alt de una imagen interior: la sección y el tema, sin repetirse. */
function inlineAlt(section: string, keyword: string, site: ImageSite) {
  const sec = capitalize(section.replace(/[:.?¿!¡]+$/g, "").trim());
  if (fold(sec).includes(fold(keyword))) return site.niche ? `${sec}: escena ilustrativa de ${site.niche.toLowerCase()}` : `${sec}: escena ilustrativa`;
  return `${sec}, aplicado a ${keyword.toLowerCase()}`;
}
