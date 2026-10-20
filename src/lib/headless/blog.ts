/** Contexto compartido de las páginas del blog alojado. */
import "server-only";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/env";
import { getHeadlessSite, getHostedBlog, hostedBaseUrl } from "./content";
import { HOSTED_HEADER } from "./hosts";
import { blogTheme } from "./theme";

export async function getBlogContext(siteId: string) {
  const [site, hosted, h] = await Promise.all([getHeadlessSite(siteId), getHostedBlog(siteId), headers()]);
  if (!site) return null;

  // Enlaces: raíz en dominio propio, prefijo del proxy inverso, o ruta interna.
  const prefix = h.get("x-forwarded-prefix");
  const base = h.get(HOSTED_HEADER) ? "" : prefix && /^\/[a-z0-9/_-]*$/i.test(prefix) ? prefix.replace(/\/$/, "") : `/blog-hosted/${siteId}`;

  return {
    site,
    hosted,
    theme: blogTheme(site.visual_style, hosted),
    base,
    canonicalBase: hostedBaseUrl(siteId, hosted),
    title: hosted?.title || `Blog de ${site.name}`,
    tagline: hosted?.tagline || site.description || "",
    indexable: !!hosted?.enabled,
    feedUrl: `${siteUrl.replace(/\/$/, "")}/api/v1/sites/${siteId}/feed.xml`,
  };
}

export const fmtLongDate = (d: string | null, lang = "es") =>
  d ? new Intl.DateTimeFormat(lang === "es" ? "es-ES" : lang, { day: "numeric", month: "long", year: "numeric" }).format(new Date(d)) : "";

/** JSON-LD seguro para <script> (evita cerrar la etiqueta). */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
