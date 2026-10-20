import { articleHtml, coverAlt, fetchCover, readError } from "./html";
import type { PublishResult, PublishableArticle, WordpressConfig } from "./types";

/** WordPress REST API con contraseña de aplicación (Usuarios → Perfil → Contraseñas de aplicación). */
export async function publishWordpress(a: PublishableArticle, c: WordpressConfig): Promise<PublishResult> {
  const base = c.url.replace(/\/$/, "");
  const auth = Buffer.from(`${c.username}:${c.app_password.replace(/\s+/g, "")}`).toString("base64");
  const featured = await uploadFeatured(a, base, auth);
  const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
    body: JSON.stringify({
      title: a.title,
      slug: a.slug,
      content: articleHtml(a),
      excerpt: a.meta_description ?? "",
      status: c.status ?? "publish",
      ...(c.category_id ? { categories: [c.category_id] } : {}),
      ...(featured ? { featured_media: featured } : {}),
    }),
  });
  if (!res.ok) return { ok: false, url: null, error: await readError(res) };
  const json = (await res.json()) as { id: number; link: string };
  return { ok: true, url: json.link, externalId: String(json.id) };
}

/** Sube la portada a la biblioteca de medios y devuelve su id (o null si falla: se publica sin ella). */
async function uploadFeatured(a: PublishableArticle, base: string, auth: string): Promise<number | null> {
  const cover = await fetchCover(a);
  if (!cover) return null;
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": cover.contentType, "content-disposition": `attachment; filename="${cover.filename}"` },
      body: cover.bytes,
    });
    if (!res.ok) return null;
    const media = (await res.json()) as { id: number };
    await fetch(`${base}/wp-json/wp/v2/media/${media.id}`, {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: JSON.stringify({ alt_text: coverAlt(a), title: a.title }),
    }).catch(() => null);
    return media.id;
  } catch {
    return null;
  }
}
