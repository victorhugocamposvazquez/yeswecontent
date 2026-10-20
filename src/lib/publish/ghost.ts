import { createHmac } from "node:crypto";
import { articleHtml, readError } from "./html";
import type { GhostConfig, PublishResult, PublishableArticle } from "./types";

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/** Token JWT HS256 de la Admin API de Ghost a partir de la clave "id:secret". */
export function ghostToken(adminKey: string) {
  const [id, secret] = adminKey.split(":");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
  const payload = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" }));
  const sig = b64url(createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export async function publishGhost(a: PublishableArticle, c: GhostConfig): Promise<PublishResult> {
  const base = c.url.replace(/\/$/, "");
  const res = await fetch(`${base}/ghost/api/admin/posts/?source=html`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Ghost ${ghostToken(c.admin_key)}` },
    body: JSON.stringify({
      posts: [
        {
          title: a.title,
          slug: a.slug,
          html: articleHtml(a, { withSchema: false }),
          custom_excerpt: a.meta_description?.slice(0, 300) ?? null,
          meta_description: a.meta_description ?? null,
          feature_image: a.cover_url,
          status: c.status ?? "published",
          codeinjection_head: a.schema_jsonld ? `<script type="application/ld+json">${JSON.stringify(a.schema_jsonld).replace(/</g, "\\u003c")}</script>` : null,
        },
      ],
    }),
  });
  if (!res.ok) return { ok: false, url: null, error: await readError(res) };
  const json = (await res.json()) as { posts: { id: string; url: string }[] };
  return { ok: true, url: json.posts[0]?.url ?? null, externalId: json.posts[0]?.id };
}
