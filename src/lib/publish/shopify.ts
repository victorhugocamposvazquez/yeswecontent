import { absoluteAsset, articleHtml, coverAlt, readError } from "./html";
import type { PublishResult, PublishableArticle, ShopifyConfig } from "./types";

/** Shopify Admin REST: crea un artículo en un blog de la tienda. */
export async function publishShopify(a: PublishableArticle, c: ShopifyConfig): Promise<PublishResult> {
  const shop = c.shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const version = c.api_version ?? "2025-07";
  const res = await fetch(`https://${shop}/admin/api/${version}/blogs/${c.blog_id}/articles.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shopify-access-token": c.access_token },
    body: JSON.stringify({
      article: {
        title: a.title,
        handle: a.slug,
        author: c.author ?? "Equipo editorial",
        body_html: articleHtml(a),
        summary_html: a.meta_description ?? "",
        published: true,
        ...(a.cover_url ? { image: { src: absoluteAsset(a.cover_url), alt: coverAlt(a) } } : {}),
        metafields: a.meta_description
          ? [{ key: "description_tag", value: a.meta_description, type: "single_line_text_field", namespace: "global" }]
          : [],
      },
    }),
  });
  if (!res.ok) return { ok: false, url: null, error: await readError(res) };
  const json = (await res.json()) as { article: { id: number; handle: string } };
  // La URL pública depende del handle del blog; la reconstruimos de forma aproximada.
  return { ok: true, url: `https://${shop}/blogs/${c.blog_id}/${json.article.handle}`, externalId: String(json.article.id) };
}
