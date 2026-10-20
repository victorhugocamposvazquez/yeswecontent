import "server-only";
import { isDemo, siteUrl } from "@/lib/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const ARTICLES_BUCKET = "articles";

/**
 * Sube una imagen al bucket público `articles` (ruta `<site_id>/<archivo>`) y
 * devuelve su URL pública, o null si no hay Supabase o la subida falla.
 */
export async function uploadArticleImage(
  bytes: Uint8Array,
  { siteId, name, contentType }: { siteId: string; name: string; contentType: string },
): Promise<string | null> {
  if (isDemo) return null;
  try {
    const sb = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : await createClient();
    const path = `${siteId}/${name}`;
    const { error } = await sb.storage.from(ARTICLES_BUCKET).upload(path, bytes, { contentType, upsert: true, cacheControl: "31536000" });
    if (error) {
      console.warn("[images] subida a Storage fallida:", error.message);
      return null;
    }
    return sb.storage.from(ARTICLES_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.warn("[images] Storage no disponible:", e instanceof Error ? e.message : e);
    return null;
  }
}

export const fileStem = (slug: string, kind: string) => `${(slug || "articulo").slice(0, 60)}-${kind}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Convierte rutas relativas (/api/images/render?...) en absolutas para los CMS. */
export const absoluteUrl = (u: string | null | undefined) => (!u ? null : u.startsWith("/") ? `${siteUrl.replace(/\/$/, "")}${u}` : u);
