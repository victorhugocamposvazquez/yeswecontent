import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sitios sin CMS (solo API de contenido, blog alojado o webhook de framework):
 * el artículo se marca como publicado igualmente para que lo sirvan la API y el blog.
 * Devuelve la URL pública si hay blog alojado, o null.
 */
export async function headlessDelivery(sb: SupabaseClient, siteId: string, slug: string): Promise<{ url: string | null } | null> {
  const [{ data: blog }, { count: keys }, { count: hooks }] = await Promise.all([
    sb.from("hosted_blogs").select("enabled, public_base_url").eq("site_id", siteId).maybeSingle(),
    sb.from("api_keys").select("id", { count: "exact", head: true }).eq("site_id", siteId).is("revoked_at", null),
    sb.from("integrations").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("provider", "framework_webhook").eq("status", "connected"),
  ]);
  if (blog?.enabled) return { url: blog.public_base_url ? `${blog.public_base_url.replace(/\/$/, "")}/${slug}` : null };
  if ((keys ?? 0) > 0 || (hooks ?? 0) > 0) return { url: null };
  return null;
}
