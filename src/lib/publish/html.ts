import { siteUrl } from "@/lib/env";
import { markdownToHtml } from "@/lib/panel/markdown";
import type { PublishableArticle } from "./types";

const appOrigin = () => siteUrl.replace(/\/$/, "");

/** URL absoluta para las imágenes servidas por la app (/api/images/…). */
export const absoluteAsset = (u: string | null | undefined) => (!u ? null : u.startsWith("/") ? `${appOrigin()}${u}` : u);

/** Texto alternativo de la portada. */
export const coverAlt = (a: PublishableArticle) => a.images?.find((i) => i.kind === "cover")?.alt ?? a.title;

/** Descarga la portada para subirla al CMS. */
export async function fetchCover(a: PublishableArticle): Promise<{ bytes: ArrayBuffer; contentType: string; filename: string } | null> {
  const url = absoluteAsset(a.cover_url);
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type")?.split(";")[0] ?? "image/png";
    const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : contentType.includes("svg") ? "svg" : "png";
    return { bytes: await res.arrayBuffer(), contentType, filename: `${a.slug || "portada"}.${ext}` };
  } catch {
    return null;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML final del artículo: cuerpo + FAQ + JSON-LD. */
export function articleHtml(a: PublishableArticle, { withSchema = true } = {}) {
  const faq = a.faq?.length
    ? `\n<section class="ywc-faq"><h2>Preguntas frecuentes</h2>\n${a.faq.map((f) => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`).join("\n")}\n</section>`
    : "";
  const schema =
    withSchema && a.schema_jsonld
      ? `\n<script type="application/ld+json">${JSON.stringify(a.schema_jsonld).replace(/</g, "\\u003c")}</script>`
      : "";
  // Las imágenes servidas por la app necesitan URL absoluta en el CMS.
  const body = markdownToHtml(a.body_md).replace(/src="\/(?!\/)/g, `src="${appOrigin()}/`);
  return `${body}${faq}${schema}`;
}

export async function readError(res: Response) {
  const text = await res.text().catch(() => "");
  return `${res.status} ${res.statusText} ${text.slice(0, 300)}`.trim();
}
