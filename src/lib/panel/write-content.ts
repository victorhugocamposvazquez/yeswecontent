import "server-only";
import { commitBacklinks, listInternalCandidates } from "@/lib/links";
import { generateArticleWithEngine } from "@/lib/panel/generate";
import { getArticleQuota, quotaExceededMessage } from "@/lib/panel/quotas";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { ContentItem, Site } from "@/lib/types";

export type WriteContentResult =
  | { ok: true; articleId: string; source: "claude" | "demo" }
  | { ok: false; error: string };

type Sb = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceClient>;

/**
 * Redacta un tema `planned` → artículo en `review`.
 * Si falla a mitad, el content_item vuelve a `planned` (no se queda en `writing`).
 */
export async function writeContentItem(
  site: Site,
  item: ContentItem,
  opts?: { service?: boolean; skipQuota?: boolean },
): Promise<WriteContentResult> {
  if (!opts?.skipQuota) {
    const q = await getArticleQuota(site.id, { service: opts?.service });
    if (q.remaining <= 0) return { ok: false, error: quotaExceededMessage(q) };
  }

  const sb: Sb = opts?.service ? createServiceClient() : await createClient();
  await sb.from("content_items").update({ status: "writing" }).eq("id", item.id).eq("site_id", site.id);

  try {
    const g = await generateArticleWithEngine(item, site, {
      internalCandidates: await listInternalCandidates(site.id),
    });
    const row = {
      site_id: site.id,
      content_item_id: item.id,
      title: g.title,
      slug: g.slug,
      meta_description: g.meta_description,
      body_md: g.body_md,
      faq: g.faq,
      schema_jsonld: g.schema_jsonld,
      cover_url: g.cover_url,
      images: g.images,
      language: item.language,
      word_count: g.score.word_count,
      quality_score: g.score.score,
      quality_breakdown: g.score.breakdown,
      status: "review",
    };
    let { data, error } = await sb.from("articles").insert(row).select("id").single();
    if (error && /images/.test(error.message)) {
      const { images: _images, ...rest } = row;
      void _images;
      ({ data, error } = await sb.from("articles").insert(rest).select("id").single());
    }
    if (error || !data) {
      await sb.from("content_items").update({ status: "planned" }).eq("id", item.id);
      return { ok: false, error: error?.message ?? "No se pudo guardar el artículo." };
    }
    await sb.from("content_items").update({ status: "review" }).eq("id", item.id);
    if (g.backlinks.length) await commitBacklinks(data.id, site.id, g.backlinks).catch((e) => console.warn("[links]", e));
    return { ok: true, articleId: data.id, source: g.source };
  } catch (e) {
    try {
      await sb.from("content_items").update({ status: "planned" }).eq("id", item.id);
    } catch {
      /* best-effort: no dejar writing forever */
    }
    return { ok: false, error: e instanceof Error ? e.message : "Error al redactar el artículo." };
  }
}
