import "server-only";
import { z } from "zod";
import { hasClaude } from "@/lib/env";
import type { ContentItem, Site } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { askClaudeJSON } from "./claude";
import { SYSTEM_STRATEGIST, analyzeSitePrompt, articlePrompt, contentPlanPrompt } from "./prompts";
import { buildJsonLd } from "./jsonld";
import { scoreArticle, type ScoreResult } from "./score";

export { buildJsonLd };

/* ───────── Análisis de la web ───────── */

export const siteAnalysisSchema = z.object({
  name: z.string().default(""),
  niche: z.string().default(""),
  audience: z.string().default(""),
  description: z.string().default(""),
  language: z.string().default("es"),
  tone: z.string().default(""),
  competitors: z.array(z.object({ name: z.string(), url: z.string() })).default([]),
});
export type SiteAnalysis = z.infer<typeof siteAnalysisSchema>;

export function extractFromHtml(html: string) {
  const pick = (re: RegExp) => re.exec(html)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const lang = pick(/<html[^>]+lang=["']([a-zA-Z-]+)["']/i).slice(0, 2).toLowerCase() || "es";
  const heads = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
  return { title, description, lang, heads: heads.slice(0, 30), text };
}

export async function analyzeSite(url: URL): Promise<{ analysis: SiteAnalysis; source: "claude" | "heuristic" | "demo" }> {
  let html = "";
  try {
    const res = await fetch(url, { headers: { "user-agent": "yeswecontent-bot/1.0 (+https://yeswecontent.com)" }, signal: AbortSignal.timeout(8000), redirect: "follow" });
    html = (await res.text()).slice(0, 400_000);
  } catch {
    // Seguimos con la URL como única pista.
  }
  const ex = extractFromHtml(html);
  const host = url.hostname.replace(/^www\./, "");
  const fallbackName = (ex.title.split(/[|·–—-]/)[0] || host.split(".")[0]).trim();

  if (hasClaude && html) {
    try {
      const raw = await askClaudeJSON<unknown>({
        system: SYSTEM_STRATEGIST,
        prompt: analyzeSitePrompt(url.toString(), [`Título: ${ex.title}`, `Descripción: ${ex.description}`, `Encabezados: ${ex.heads.join(" / ")}`, ex.text].join("\n")),
        maxTokens: 1500,
      });
      const analysis = siteAnalysisSchema.parse(raw);
      return { analysis: { ...analysis, name: analysis.name || fallbackName }, source: "claude" };
    } catch {
      // Caemos a la heurística.
    }
  }

  const name = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
  return {
    source: html ? "heuristic" : "demo",
    analysis: {
      name,
      niche: ex.heads[0] || "Negocio online",
      audience: "Personas que buscan en Google y en asistentes de IA soluciones como las que ofrece la marca",
      description: ex.description || `${name} es un negocio online que ofrece sus productos y servicios en ${host}.`,
      language: ["es", "en", "fr", "de", "it", "pt", "ca"].includes(ex.lang) ? ex.lang : "es",
      tone: "Cercano, claro y práctico",
      competitors: [],
    },
  };
}

/* ───────── Plan de contenidos ───────── */

export const planItemSchema = z.object({
  title: z.string(),
  keyword: z.string(),
  cluster: z.string().nullable().default(null),
  intent: z.enum(["informational", "commercial", "transactional", "navigational"]).nullable().default("informational"),
  search_volume: z.coerce.number().nullable().default(null),
  difficulty: z.coerce.number().nullable().default(null),
});
export type PlanItem = z.infer<typeof planItemSchema>;

type PlanSite = Pick<Site, "name" | "url" | "niche" | "audience" | "description" | "language">;

export async function generatePlan(site: PlanSite, count: number, existing: string[], month: string): Promise<{ items: PlanItem[]; source: "claude" | "demo" }> {
  if (hasClaude) {
    try {
      const raw = await askClaudeJSON<{ items: unknown[] }>({ system: SYSTEM_STRATEGIST, prompt: contentPlanPrompt(site, count, existing, month), maxTokens: 6000 });
      const items = z.array(planItemSchema).parse(raw.items).slice(0, count);
      if (items.length) return { items, source: "claude" };
    } catch {
      // Demo como plan B.
    }
  }
  const topic = (site.niche ?? site.name).toLowerCase().split(/[,.;]/)[0].trim();
  const templates: [string, string, PlanItem["intent"]][] = [
    ["Guía completa de {t} para principiantes", "Guías", "informational"],
    ["Cuánto cuesta {t} en 2026 y de qué depende", "Precios", "commercial"],
    ["Errores habituales con {t} y cómo evitarlos", "Guías", "informational"],
    ["{T}: preguntas frecuentes respondidas por expertos", "Dudas", "informational"],
    ["Cómo elegir {t}: checklist en 7 puntos", "Comparativas", "commercial"],
    ["Tendencias de {t} para el próximo año", "Tendencias", "informational"],
    ["{T} para empresas: lo que conviene saber", "Profesionales", "commercial"],
    ["Mantenimiento y cuidados de {t} paso a paso", "Cuidados", "informational"],
    ["Mejores alternativas en {t} según tu presupuesto", "Comparativas", "commercial"],
    ["Glosario de {t}: términos que oirás a menudo", "Dudas", "informational"],
  ];
  const cap = topic.charAt(0).toUpperCase() + topic.slice(1);
  const items = Array.from({ length: count }, (_, i) => {
    const [tpl, cluster, intent] = templates[i % templates.length];
    const title = tpl.replace("{t}", topic).replace("{T}", cap) + (i >= templates.length ? ` (${Math.floor(i / templates.length) + 1})` : "");
    return {
      title,
      keyword: `${topic} ${["guía", "precio", "errores", "preguntas", "cómo elegir", "tendencias", "empresas", "cuidados", "alternativas", "glosario"][i % 10]}`,
      cluster,
      intent,
      search_volume: 300 + ((i * 731) % 4200),
      difficulty: 10 + ((i * 17) % 45),
    } satisfies PlanItem;
  });
  return { items, source: "demo" };
}

/* ───────── Artículo ───────── */

export const articleSchema = z.object({
  title: z.string(),
  meta_title: z.string().default(""),
  meta_description: z.string().default(""),
  slug: z.string().default(""),
  body_md: z.string(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});
export type GeneratedArticle = z.infer<typeof articleSchema> & { schema_jsonld: Record<string, unknown>; score: ScoreResult; source: "claude" | "demo" };

type ArticleSite = Pick<Site, "name" | "url" | "niche" | "audience" | "description" | "language" | "brand_voice" | "seo_settings">;
type ArticleItem = Pick<ContentItem, "title" | "keyword" | "intent" | "cluster">;

export async function generateArticle(item: ArticleItem, site: ArticleSite, internalLinks: { title: string; url: string }[] = []): Promise<GeneratedArticle> {
  let base: z.infer<typeof articleSchema> | null = null;
  let source: "claude" | "demo" = "demo";
  if (hasClaude) {
    try {
      const raw = await askClaudeJSON<unknown>({ system: SYSTEM_STRATEGIST, prompt: articlePrompt(item, site, internalLinks), maxTokens: 12000 });
      base = articleSchema.parse(raw);
      source = "claude";
    } catch {
      base = null;
    }
  }
  if (!base) base = demoArticle(item, site, internalLinks);
  const slug = base.slug || slugify(item.keyword || base.title);
  const score = scoreArticle({
    title: base.title,
    body_md: base.body_md,
    keyword: item.keyword,
    meta_description: base.meta_description,
    faq: base.faq,
    schema: site.seo_settings?.schema !== false,
    min_words: site.seo_settings?.min_words,
    internal_links: site.seo_settings?.internal_links,
  });
  return { ...base, slug, schema_jsonld: buildJsonLd(base, site), score, source };
}

function demoArticle(item: ArticleItem, site: ArticleSite, links: { title: string; url: string }[]) {
  const we = site.brand_voice?.person === "tú" || site.brand_voice?.person === "yo" ? "yo" : "nosotros";
  const k = item.keyword;
  const linkLine = links.length ? `\n\nSi quieres profundizar, te recomendamos ${links.slice(0, 3).map((l) => `[${l.title.toLowerCase()}](${l.url})`).join(", ")}.` : "";
  const body_md = `${item.title.replace(/[.?]$/, "")}: la respuesta corta es que depende de tres factores (el uso, el presupuesto y el mantenimiento que estés dispuesto a asumir). En esta guía te explicamos cómo valorar cada uno para que aciertes con ${k} a la primera.

## Qué es exactamente ${k}

Cuando hablamos de ${k} nos referimos a una decisión que mucha gente toma deprisa y luego lamenta. En ${site.name} lo vemos a diario: quien se informa antes ahorra tiempo y dinero.

## Cómo elegir bien: los criterios que importan

- **Uso real.** Piensa en cómo lo vas a usar el día a día, no en el caso ideal.
- **Calidad frente a precio.** Lo barato suele salir caro a medio plazo.
- **Mantenimiento.** Pregunta siempre qué cuidados necesita.
- **Garantía y servicio.** Un buen proveedor responde cuando hay un problema.

### Una comprobación rápida antes de decidir

Haz estas tres preguntas: ¿resuelve mi necesidad principal?, ¿encaja en mi presupuesto total?, ¿sé a quién acudir si falla?

## Errores frecuentes con ${k}

1. Comparar solo por precio.
2. No leer las condiciones.
3. Olvidar los costes de mantenimiento.

## Cómo lo hacemos ${we === "yo" ? "yo" : "en " + site.name}

${site.description ?? "Trabajamos con cuidado y sin prisas."} Si tienes dudas, escríbenos y te orientamos sin compromiso.${linkLine}

## En resumen

Elegir bien ${k} es cuestión de método: define el uso, compara con criterio y piensa a largo plazo.`;
  return {
    title: item.title,
    meta_title: item.title.slice(0, 60),
    meta_description: `${item.title}. Criterios claros, errores a evitar y consejos prácticos de ${site.name} para acertar a la primera.`.slice(0, 158),
    slug: slugify(k),
    body_md,
    faq: [
      { q: `¿Cuánto tiempo dura ${k}?`, a: "Depende del uso y del mantenimiento, pero con cuidados básicos muchos años." },
      { q: `¿Qué es lo más importante al elegir ${k}?`, a: "Que se ajuste a tu uso real; después, la calidad y el servicio." },
      { q: `¿Puedo pedir asesoramiento a ${site.name}?`, a: "Sí, escríbenos y te respondemos en menos de 24 horas laborables." },
    ],
  };
}
