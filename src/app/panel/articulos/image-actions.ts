"use server";

import { revalidatePath } from "next/cache";
import { getArticle, getCurrentSite, listContentItems, listSites } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { insertImage, regenerateImage, replaceImage } from "@/lib/images";
import type { ImageActionState } from "@/lib/images/action-types";
import { createClient } from "@/lib/supabase/server";
import type { ArticleImage } from "@/lib/types";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const fail = (message: string): ImageActionState => ({ ok: false, message, at: Date.now() });

/**
 * Regenera la portada, una imagen interior o la infografía de un artículo (o
 * añade una infografía nueva). En modo demo devuelve una vista previa sin guardar.
 */
export async function regenerateArticleImage(_prev: ImageActionState, fd: FormData): Promise<ImageActionState> {
  const id = str(fd, "id");
  const kind = str(fd, "kind") as ArticleImage["kind"];
  const currentUrl = str(fd, "url") || null;
  const section = str(fd, "section") || undefined;
  const editorBody = String(fd.get("body_md") ?? "");
  if (!["cover", "inline", "infographic"].includes(kind)) return fail("Tipo de imagen no válido.");

  const article = await getArticle(id);
  // La web del artículo (no necesariamente la seleccionada en el panel).
  const site = article ? (await listSites()).find((s) => s.id === article.site_id) ?? (await getCurrentSite()) : null;
  if (!site || !article) return fail("No encontramos ese artículo.");
  const item = article.content_item_id ? (await listContentItems(site.id)).find((c) => c.id === article.content_item_id) : null;
  const images = article.images ?? [];
  const current = kind === "cover" ? images.find((i) => i.kind === "cover") ?? null : images.find((i) => i.url === currentUrl) ?? null;
  const body = editorBody.trim() ? editorBody : article.body_md;

  let img: ArticleImage | null;
  try {
    img = await regenerateImage(
      { siteId: site.id, site, title: article.title, keyword: item?.keyword ?? article.title, cluster: item?.cluster, slug: article.slug, body_md: body },
      current,
      kind,
      section,
    );
  } catch (e) {
    return fail(`No se pudo generar la imagen: ${e instanceof Error ? e.message : "error desconocido"}`);
  }
  if (!img) return fail(kind === "infographic" ? "No hay ninguna lista ni cifras clave en el texto para hacer una infografía." : "No se pudo generar la imagen.");

  // Cuerpo resultante (para imágenes dentro del texto).
  let nextBody: string | undefined;
  let replaced: string | null = null;
  if (kind !== "cover") {
    if (currentUrl && body.includes(currentUrl)) {
      nextBody = replaceImage(body, currentUrl, img);
      replaced = currentUrl;
    } else nextBody = insertImage(body, img);
  }
  const nextImages = kind === "cover" ? [img, ...images.filter((i) => i.kind !== "cover")] : [...images.filter((i) => i.url !== currentUrl), img];

  const label = kind === "cover" ? "Portada regenerada" : kind === "infographic" ? (replaced ? "Infografía actualizada" : "Infografía añadida al texto") : "Imagen regenerada";
  if (isDemo) return { ok: true, message: `${label}. Vista previa en modo demo: no se ha guardado.`, at: Date.now(), kind, image: img, replaced, body_md: nextBody };

  const sb = await createClient();
  const patch: Record<string, unknown> = { images: nextImages, updated_at: new Date().toISOString() };
  if (kind === "cover") patch.cover_url = img.url;
  else if (nextBody) patch.body_md = replaced ? replaceImage(article.body_md, replaced, img) : insertImage(article.body_md, img);
  const { error } = await sb.from("articles").update(patch).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath(`/panel/articulos/${id}`);
  return { ok: true, message: `${label}.`, at: Date.now(), kind, image: img, replaced, body_md: nextBody };
}
