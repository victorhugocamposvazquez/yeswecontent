import { createHmac } from "node:crypto";
import { absoluteAsset, articleHtml, readError } from "./html";
import type { PublishResult, PublishableArticle, WebhookConfig } from "./types";

export const signPayload = (secret: string, timestamp: string, body: string) => createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

/**
 * Webhook genérico. Firma: cabecera `X-YWC-Signature: t=<timestamp>,v1=<hmac>`
 * donde hmac = HMAC-SHA256(secret, `${timestamp}.${body}`). Si responde JSON con
 * `{ url }`, la usamos como URL publicada.
 */
export async function publishWebhook(a: PublishableArticle, c: WebhookConfig): Promise<PublishResult> {
  const body = JSON.stringify({
    event: "article.published",
    article: {
      id: a.id,
      title: a.title,
      slug: a.slug,
      language: a.language,
      meta_description: a.meta_description,
      body_markdown: a.body_md,
      body_html: articleHtml(a),
      faq: a.faq,
      cover_url: absoluteAsset(a.cover_url),
      images: (a.images ?? []).map((i) => ({ ...i, url: absoluteAsset(i.url) })),
      schema_jsonld: a.schema_jsonld ?? null,
    },
    sent_at: new Date().toISOString(),
  });
  const t = Math.floor(Date.now() / 1000).toString();
  const res = await fetch(c.url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-ywc-signature": `t=${t},v1=${signPayload(c.secret, t, body)}`, "user-agent": "yeswecontent-webhook/1.0" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) return { ok: false, url: null, error: await readError(res) };
  const json = (await res.json().catch(() => ({}))) as { url?: string; id?: string };
  return { ok: true, url: json.url ?? null, externalId: json.id };
}
