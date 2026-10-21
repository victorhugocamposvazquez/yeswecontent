/**
 * Lectura de contenido publicado para la API headless, los feeds y el blog alojado.
 * No depende de la sesión del usuario: usa service role y filtra siempre por
 * sitio + estado "published". En modo demo devuelve los artículos de Tierrafina.
 */
import "server-only";
import { cache } from "react";
import { isDemo, siteUrl } from "@/lib/env";
import * as demo from "@/lib/demo";
import { buildJsonLd } from "@/lib/panel/jsonld";
import { markdownToHtml } from "@/lib/panel/markdown";
import { createServiceClient } from "@/lib/supabase/server";
import type { Article, Site } from "@/lib/types";

export type HeadlessArticle = Article & { tags?: string[] | null; schema_jsonld?: Record<string, unknown> | null };
export type HeadlessSite = Pick<Site, "id" | "name" | "url" | "language" | "description" | "niche" | "visual_style">;

export interface HostedBlogConfig {
  site_id: string;
  enabled: boolean;
  delivery_mode?: "platform" | "subdomain" | "folder";
  custom_domain: string | null;
  public_base_url: string | null;
  title: string | null;
  tagline: string | null;
  theme: { accent?: string; background?: string; text?: string; font?: "sans" | "serif" };
  verified_at?: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isValidSiteId = (id: string) => (isDemo ? /^[a-z0-9_]{2,40}$/i.test(id) : UUID.test(id));

/** Las portadas generadas pueden ser rutas relativas (/api/images/…): fuera de la app deben ser absolutas. */
export const absUrl = (u: string | null | undefined) => (u ? (u.startsWith("/") && !u.startsWith("//") ? `${siteUrl.replace(/\/$/, "")}${u}` : u) : null);
const normalize = <T extends { cover_url: string | null }>(a: T): T => ({ ...a, cover_url: absUrl(a.cover_url) });

/* ───────── demo ───────── */

const demoTags = (a: Article) => {
  const item = demo.contentItems.find((c) => c.id === a.content_item_id);
  return item?.cluster ? [item.cluster.toLowerCase()] : [];
};
const demoPublished = (): HeadlessArticle[] =>
  demo.articles.filter((a) => a.status === "published").map((a) => ({ ...a, tags: demoTags(a) }));

const demoHosted: HostedBlogConfig = {
  site_id: demo.demoSite.id,
  enabled: true,
  delivery_mode: "subdomain",
  custom_domain: "blog.tierrafina.es",
  public_base_url: "https://blog.tierrafina.es",
  title: "Diario del taller",
  tagline: "Cerámica hecha a mano, explicada sin prisas.",
  theme: {},
};

/* ───────── consultas ───────── */

export const getHeadlessSite = cache(async (siteId: string): Promise<HeadlessSite | null> => {
  if (!isValidSiteId(siteId)) return null;
  if (isDemo) return demo.demoSites.find((s) => s.id === siteId) ?? null;
  const sb = createServiceClient();
  const { data } = await sb.from("sites").select("id, name, url, language, description, niche, visual_style").eq("id", siteId).maybeSingle();
  return data;
});

export interface ListOptions { lang?: string | null; tag?: string | null; page?: number; perPage?: number; withBody?: boolean }

export async function listPublished(siteId: string, o: ListOptions = {}): Promise<{ items: HeadlessArticle[]; total: number }> {
  const page = Math.max(1, o.page ?? 1);
  const perPage = Math.min(100, Math.max(1, o.perPage ?? 20));
  if (isDemo) {
    if (siteId !== demo.demoSite.id) return { items: [], total: 0 };
    let all = demoPublished().sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
    if (o.lang) all = all.filter((a) => a.language === o.lang);
    if (o.tag) all = all.filter((a) => a.tags?.includes(o.tag!.toLowerCase()));
    return { items: all.slice((page - 1) * perPage, page * perPage).map(normalize), total: all.length };
  }
  const sb = createServiceClient();
  const cols = o.withBody
    ? "*"
    : "id, site_id, title, slug, meta_description, cover_url, language, word_count, faq, tags, published_url, published_at, created_at, updated_at, status";
  let q = sb.from("articles").select(cols, { count: "exact" }).eq("site_id", siteId).eq("status", "published");
  if (o.lang) q = q.eq("language", o.lang);
  if (o.tag) q = q.contains("tags", [o.tag.toLowerCase()]);
  const { data, count } = await q.order("published_at", { ascending: false, nullsFirst: false }).range((page - 1) * perPage, page * perPage - 1);
  return { items: ((data ?? []) as unknown as HeadlessArticle[]).map(normalize), total: count ?? 0 };
}

export const getPublishedBySlug = cache(async (siteId: string, slug: string, lang?: string | null): Promise<HeadlessArticle | null> => {
  if (!/^[a-z0-9][a-z0-9-_]{0,200}$/i.test(slug)) return null;
  if (isDemo) {
    if (siteId !== demo.demoSite.id) return null;
    const found = demoPublished().find((a) => a.slug === slug && (!lang || a.language === lang));
    return found ? normalize(found) : null;
  }
  const sb = createServiceClient();
  let q = sb.from("articles").select("*").eq("site_id", siteId).eq("status", "published").eq("slug", slug);
  if (lang) q = q.eq("language", lang);
  const { data } = await q.order("published_at", { ascending: false }).limit(1).maybeSingle();
  return data ? normalize(data as HeadlessArticle) : null;
});

export const getHostedBlog = cache(async (siteId: string): Promise<HostedBlogConfig | null> => {
  if (isDemo) return siteId === demo.demoSite.id ? demoHosted : null;
  const sb = createServiceClient();
  const { data } = await sb.from("hosted_blogs").select("site_id, enabled, delivery_mode, custom_domain, public_base_url, title, tagline, theme, verified_at").eq("site_id", siteId).maybeSingle();
  return (data as HostedBlogConfig | null) ?? null;
});

/* ───────── serialización ───────── */

/** Imágenes Markdown ![alt](url) presentes en el cuerpo. */
export function extractImages(md: string): { url: string; alt: string }[] {
  const out: { url: string; alt: string }[] = [];
  for (const m of md.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g)) out.push({ alt: m[1], url: m[2] });
  return out;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML del artículo listo para incrustar (cuerpo + FAQ), ya escapado. */
export function articleBodyHtml(a: Pick<HeadlessArticle, "body_md" | "faq">) {
  const faq = a.faq?.length
    ? `\n<section class="ywc-faq"><h2>Preguntas frecuentes</h2>\n${a.faq.map((f) => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`).join("\n")}\n</section>`
    : "";
  return `${markdownToHtml(a.body_md ?? "")}${faq}`;
}

/** Base pública del blog alojado (sin barra final). */
export function hostedBaseUrl(siteId: string, hosted: HostedBlogConfig | null) {
  if (hosted?.enabled && hosted.public_base_url) return hosted.public_base_url.replace(/\/$/, "");
  if (hosted?.enabled && hosted.custom_domain) return `https://${hosted.custom_domain}`;
  return `${siteUrl.replace(/\/$/, "")}/blog-hosted/${siteId}`;
}

/** URL canónica de un artículo: la publicada en la web del cliente o la del blog alojado. */
export function canonicalFor(a: Pick<HeadlessArticle, "published_url" | "slug">, siteId: string, hosted: HostedBlogConfig | null) {
  if (hosted?.enabled) return `${hostedBaseUrl(siteId, hosted)}/${a.slug}`;
  return a.published_url ?? `${hostedBaseUrl(siteId, hosted)}/${a.slug}`;
}

export function jsonLdFor(a: HeadlessArticle, site: HeadlessSite, url: string) {
  if (a.schema_jsonld && typeof a.schema_jsonld === "object") return a.schema_jsonld;
  const ld = buildJsonLd({ title: a.title, meta_description: a.meta_description ?? "", faq: a.faq ?? [] }, site, url);
  const art = ld["@graph"][0] as Record<string, unknown>;
  Object.assign(art, {
    "@type": "BlogPosting",
    inLanguage: a.language,
    datePublished: a.published_at,
    dateModified: a.updated_at,
    ...(a.cover_url ? { image: a.cover_url } : {}),
    ...(a.word_count ? { wordCount: a.word_count } : {}),
  });
  return ld;
}

const dedupeImages = <T extends { url: string }>(list: T[]) => list.filter((img, i) => list.findIndex((x) => x.url === img.url) === i);

const readingTime = (words: number) => Math.max(1, Math.round(words / 220));

/** Representación pública de un artículo (lista o detalle). */
export function serializeArticle(a: HeadlessArticle, site: HeadlessSite, hosted: HostedBlogConfig | null, full: boolean) {
  const url = canonicalFor(a, site.id, hosted);
  const base = {
    id: a.id,
    title: a.title,
    slug: a.slug,
    language: a.language,
    excerpt: a.meta_description,
    url,
    cover: a.cover_url ? { url: a.cover_url, alt: a.title } : null,
    tags: a.tags ?? [],
    word_count: a.word_count,
    reading_time_minutes: readingTime(a.word_count),
    published_at: a.published_at,
    updated_at: a.updated_at,
  };
  if (!full) return base;
  return {
    ...base,
    meta: {
      title: a.title,
      description: a.meta_description,
      canonical_url: url,
      og_image: a.cover_url,
      robots: "index, follow",
    },
    html: articleBodyHtml(a),
    markdown: a.body_md,
    faq: a.faq ?? [],
    json_ld: jsonLdFor(a, site, url),
    images: dedupeImages([
      ...(a.cover_url ? [{ url: a.cover_url, alt: a.title, kind: "cover" }] : []),
      ...(a.images ?? []).map((i) => ({ url: absUrl(i.url) ?? i.url, alt: i.alt, kind: i.kind, ...(i.section ? { section: i.section } : {}) })),
      ...extractImages(a.body_md ?? "").map((i) => ({ ...i, kind: "inline" })),
    ]),
  };
}
