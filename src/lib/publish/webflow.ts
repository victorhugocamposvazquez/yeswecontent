import { absoluteAsset, articleHtml, coverAlt, readError } from "./html";
import type { PublishResult, PublishableArticle, WebflowConfig } from "./types";

/**
 * Webflow Data API v2: crea un ítem en una colección CMS (opcionalmente en vivo).
 * La portada va al campo de imagen (`field_map.image`, por defecto "main-image",
 * el de la plantilla de blog). Si la colección no tiene ese campo, se reintenta sin imagen.
 */
export async function publishWebflow(a: PublishableArticle, c: WebflowConfig): Promise<PublishResult> {
  const f = { name: "name", slug: "slug", body: "post-body", summary: "post-summary", image: "main-image", ...c.field_map };
  const endpoint = `https://api.webflow.com/v2/collections/${c.collection_id}/items${c.live === false ? "" : "/live"}`;
  const fieldData: Record<string, unknown> = { [f.name]: a.title, [f.slug]: a.slug, [f.body]: articleHtml(a), [f.summary]: a.meta_description ?? "" };
  const cover = absoluteAsset(a.cover_url);
  const send = (data: Record<string, unknown>) =>
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${c.token}` },
      body: JSON.stringify({ isArchived: false, isDraft: c.live === false, fieldData: data }),
    });
  let res = await send(cover && f.image ? { ...fieldData, [f.image]: { url: cover, alt: coverAlt(a) } } : fieldData);
  if (!res.ok && cover && res.status === 400) res = await send(fieldData);
  if (!res.ok) return { ok: false, url: null, error: await readError(res) };
  const json = (await res.json()) as { id: string };
  return { ok: true, url: null, externalId: json.id };
}
