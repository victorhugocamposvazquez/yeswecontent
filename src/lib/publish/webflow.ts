import { articleHtml, readError } from "./html";
import type { PublishResult, PublishableArticle, WebflowConfig } from "./types";

/** Webflow Data API v2: crea un ítem en una colección CMS (opcionalmente en vivo). */
export async function publishWebflow(a: PublishableArticle, c: WebflowConfig): Promise<PublishResult> {
  const f = { name: "name", slug: "slug", body: "post-body", summary: "post-summary", ...c.field_map };
  const endpoint = `https://api.webflow.com/v2/collections/${c.collection_id}/items${c.live === false ? "" : "/live"}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${c.token}` },
    body: JSON.stringify({
      isArchived: false,
      isDraft: c.live === false,
      fieldData: { [f.name]: a.title, [f.slug]: a.slug, [f.body]: articleHtml(a), [f.summary]: a.meta_description ?? "" },
    }),
  });
  if (!res.ok) return { ok: false, url: null, error: await readError(res) };
  const json = (await res.json()) as { id: string };
  return { ok: true, url: null, externalId: json.id };
}
