/**
 * Graph API de Meta: páginas de Facebook, cuenta profesional de Instagram vinculada,
 * publicación en la página y carruseles de Instagram (Content Publishing API).
 */
import "server-only";
import { META_GRAPH, readJson } from "@/lib/oauth/providers";

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram?: { id: string; username: string | null } | null;
}

export async function listMetaPages(userToken: string): Promise<MetaPage[]> {
  const out: MetaPage[] = [];
  let url: string | null = `${META_GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token=${encodeURIComponent(userToken)}`;
  for (let i = 0; url && i < 10; i++) {
    const r: { data?: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[]; paging?: { next?: string } } = await readJson(
      await fetch(url, { cache: "no-store" }),
      "Páginas de Facebook",
    );
    for (const p of r.data ?? [])
      out.push({ id: p.id, name: p.name, access_token: p.access_token, instagram: p.instagram_business_account ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username ?? null } : null });
    url = r.paging?.next ?? null;
  }
  return out;
}

const form = (data: Record<string, string>) => new URLSearchParams(data);

/** Publicación en la página: texto + enlace, o varias fotos con texto. */
export async function publishFacebookPost(pageId: string, pageToken: string, opts: { message: string; link?: string | null; imageUrls?: string[] }): Promise<{ id: string; url: string }> {
  let id: string;
  if (opts.imageUrls?.length) {
    // Subimos las fotos sin publicar y las adjuntamos a una única publicación.
    const media: string[] = [];
    for (const url of opts.imageUrls.slice(0, 10)) {
      const ph = await readJson<{ id: string }>(await fetch(`${META_GRAPH}/${pageId}/photos`, { method: "POST", body: form({ url, published: "false", access_token: pageToken }) }), "Foto de Facebook");
      media.push(ph.id);
    }
    const body = form({ message: opts.link ? `${opts.message}\n\n${opts.link}` : opts.message, access_token: pageToken });
    media.forEach((m, i) => body.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: m })));
    id = (await readJson<{ id: string }>(await fetch(`${META_GRAPH}/${pageId}/feed`, { method: "POST", body }), "Publicación de Facebook")).id;
  } else {
    const body = form({ message: opts.message, access_token: pageToken, ...(opts.link ? { link: opts.link } : {}) });
    id = (await readJson<{ id: string }>(await fetch(`${META_GRAPH}/${pageId}/feed`, { method: "POST", body }), "Publicación de Facebook")).id;
  }
  return { id, url: `https://www.facebook.com/${id}` };
}

async function waitForContainer(containerId: string, token: string) {
  for (let i = 0; i < 20; i++) {
    const s = await readJson<{ status_code?: string; status?: string }>(await fetch(`${META_GRAPH}/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`, { cache: "no-store" }), "Estado en Instagram");
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Instagram no ha podido procesar la imagen (${s.status ?? s.status_code}).`);
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Instagram tarda demasiado en procesar las imágenes. Lo reintentaremos.");
}

/**
 * Carrusel (2–10 imágenes JPEG accesibles públicamente) o imagen única.
 * Flujo: contenedor por imagen → contenedor CAROUSEL → media_publish.
 */
export async function publishInstagramCarousel(igUserId: string, token: string, imageUrls: string[], caption: string): Promise<{ id: string; url: string | null }> {
  const urls = imageUrls.slice(0, 10);
  if (!urls.length) throw new Error("El carrusel no tiene imágenes.");
  let creationId: string;
  if (urls.length === 1) {
    creationId = (await readJson<{ id: string }>(await fetch(`${META_GRAPH}/${igUserId}/media`, { method: "POST", body: form({ image_url: urls[0], caption, access_token: token }) }), "Imagen de Instagram")).id;
  } else {
    const children: string[] = [];
    for (const url of urls) {
      const c = await readJson<{ id: string }>(await fetch(`${META_GRAPH}/${igUserId}/media`, { method: "POST", body: form({ image_url: url, is_carousel_item: "true", access_token: token }) }), "Imagen de Instagram");
      children.push(c.id);
    }
    for (const c of children) await waitForContainer(c, token);
    creationId = (await readJson<{ id: string }>(await fetch(`${META_GRAPH}/${igUserId}/media`, { method: "POST", body: form({ media_type: "CAROUSEL", children: children.join(","), caption, access_token: token }) }), "Carrusel de Instagram")).id;
  }
  await waitForContainer(creationId, token);
  const published = await readJson<{ id: string }>(await fetch(`${META_GRAPH}/${igUserId}/media_publish`, { method: "POST", body: form({ creation_id: creationId, access_token: token }) }), "Publicación en Instagram");
  const info = await fetch(`${META_GRAPH}/${published.id}?fields=permalink&access_token=${encodeURIComponent(token)}`, { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<{ permalink?: string }>) : {}))
    .catch(() => ({}) as { permalink?: string });
  return { id: published.id, url: (info as { permalink?: string }).permalink ?? null };
}
