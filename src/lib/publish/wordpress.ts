import { articleHtml, readError } from "./html";
import type { PublishResult, PublishableArticle, WordpressConfig } from "./types";

/** WordPress REST API con contraseña de aplicación (Usuarios → Perfil → Contraseñas de aplicación). */
export async function publishWordpress(a: PublishableArticle, c: WordpressConfig): Promise<PublishResult> {
  const base = c.url.replace(/\/$/, "");
  const auth = Buffer.from(`${c.username}:${c.app_password.replace(/\s+/g, "")}`).toString("base64");
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
    }),
  });
  if (!res.ok) return { ok: false, url: null, error: await readError(res) };
  const json = (await res.json()) as { id: number; link: string };
  return { ok: true, url: json.link, externalId: String(json.id) };
}
