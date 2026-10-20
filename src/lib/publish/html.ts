import { markdownToHtml } from "@/lib/panel/markdown";
import type { PublishableArticle } from "./types";

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
  return `${markdownToHtml(a.body_md)}${faq}${schema}`;
}

export async function readError(res: Response) {
  const text = await res.text().catch(() => "");
  return `${res.status} ${res.statusText} ${text.slice(0, 300)}`.trim();
}
