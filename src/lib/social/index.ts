/**
 * Publicación social: un punto de entrada para Instagram, Facebook y Reddit.
 * Quora no tiene API pública de publicación: sus sugerencias se copian y se publican a mano.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccessToken, getIntegrationConfig, type OAuthSecret } from "@/lib/oauth/tokens";
import type { SocialPost } from "@/lib/types";
import { publishFacebookPost, publishInstagramCarousel } from "./meta";
import { postRedditComment } from "./reddit";
import { renderSlide } from "./render-slide";
import { slideUrl } from "./slides";

export interface SocialPublishResult {
  ok: boolean;
  url: string | null;
  externalId?: string | null;
  error?: string;
  /** Error definitivo: no tiene sentido reintentar (p. ej. Quora o falta conexión). */
  permanent?: boolean;
}

export const AUTO_CHANNELS: SocialPost["channel"][] = ["reddit", "instagram", "facebook"];
export const providerForChannel = (c: SocialPost["channel"]) => (c === "reddit" ? "reddit" : c === "quora" ? null : "meta");

type PostRow = Pick<SocialPost, "id" | "site_id" | "channel" | "kind" | "thread_url" | "content" | "slides"> & { article_id: string | null };

/** PNG → JPEG (Instagram solo admite JPEG). Usa sharp si está disponible (Next lo incluye). */
async function toJpeg(png: Buffer): Promise<{ data: Buffer; type: "image/jpeg" | "image/png" }> {
  try {
    const mod = (await import("sharp")) as unknown as { default: (b: Buffer) => { flatten: (o: object) => { jpeg: (o: object) => { toBuffer: () => Promise<Buffer> } } } };
    const data = await mod.default(png).flatten({ background: "#ffffff" }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    return { data, type: "image/jpeg" };
  } catch {
    return { data: png, type: "image/png" };
  }
}

/**
 * Renderiza las diapositivas y las sube al bucket público `social` de Supabase Storage.
 * Si Storage falla, usa la URL firmada de /api/social/slide (PNG) como alternativa.
 */
export async function prepareSlideImages(db: SupabaseClient, post: PostRow, brand: string, coverUrl?: string | null): Promise<string[]> {
  const slides = (post.slides?.length ? post.slides : [post.content]).slice(0, 10);
  const urls: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const params = { text: slides[i].slice(0, 280), brand: brand.slice(0, 60), index: i, total: slides.length };
    try {
      const png = Buffer.from(await renderSlide(params).arrayBuffer());
      const { data, type } = await toJpeg(png);
      const path = `${post.site_id}/${post.id}/${i + 1}.${type === "image/jpeg" ? "jpg" : "png"}`;
      const { error } = await db.storage.from("social").upload(path, data, { contentType: type, upsert: true, cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      urls.push(db.storage.from("social").getPublicUrl(path).data.publicUrl);
    } catch {
      urls.push(slideUrl(params));
    }
  }
  if (!urls.length && coverUrl) urls.push(coverUrl);
  return urls;
}

/** Publica una sugerencia aprobada desde la cuenta conectada del sitio. */
export async function publishSocialPost(db: SupabaseClient, post: PostRow): Promise<SocialPublishResult> {
  try {
    if (post.channel === "quora") return { ok: false, url: null, permanent: true, error: "Quora no ofrece API de publicación: cópiala y publícala tú en Quora." };

    if (post.channel === "reddit") {
      if (!post.thread_url) return { ok: false, url: null, permanent: true, error: "Falta la URL de la conversación de Reddit." };
      const { token } = await getAccessToken(db, post.site_id, "reddit");
      const r = await postRedditComment(token, post.thread_url, post.content);
      return { ok: true, url: r.url, externalId: r.id };
    }

    // Instagram / Facebook
    const cfg = await getIntegrationConfig<OAuthSecret>(db, post.site_id, "meta");
    if (!cfg || cfg.status !== "connected") return { ok: false, url: null, permanent: true, error: "Conecta Instagram y Facebook en Ajustes › Redes sociales." };
    const pageToken = cfg.secret.page_token;
    if (!pageToken || !cfg.meta.page_id) return { ok: false, url: null, permanent: true, error: "Elige la página de Facebook en Ajustes › Redes sociales." };

    const [{ data: site }, { data: article }] = await Promise.all([
      db.from("sites").select("name").eq("id", post.site_id).maybeSingle(),
      post.article_id ? db.from("articles").select("published_url, cover_url").eq("id", post.article_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    const brand = (site?.name as string | undefined) ?? "";
    const link = (article?.published_url as string | null | undefined) ?? null;
    const images = post.kind === "carousel" || post.slides?.length ? await prepareSlideImages(db, post, brand, (article?.cover_url as string | null | undefined) ?? null) : [];

    if (post.channel === "instagram") {
      if (!cfg.meta.ig_user_id) return { ok: false, url: null, permanent: true, error: "La página elegida no tiene una cuenta profesional de Instagram vinculada." };
      if (!images.length) return { ok: false, url: null, permanent: true, error: "Instagram necesita al menos una imagen." };
      const caption = link ? `${post.content}\n\nLee el artículo completo en el enlace de la bio.` : post.content;
      const r = await publishInstagramCarousel(cfg.meta.ig_user_id, pageToken, images, caption.slice(0, 2200));
      return { ok: true, url: r.url, externalId: r.id };
    }

    const r = await publishFacebookPost(cfg.meta.page_id, pageToken, { message: post.content, link, imageUrls: images });
    return { ok: true, url: r.url, externalId: r.id };
  } catch (e) {
    return { ok: false, url: null, error: e instanceof Error ? e.message : String(e) };
  }
}
