import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemo } from "@/lib/env";
import * as demo from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";
import type { InternalCandidate } from "./internal";

/** Artículos publicados del propio sitio, candidatos al enlazado interno. */
export async function listInternalCandidates(siteId: string, opts: { excludeId?: string; db?: SupabaseClient } = {}): Promise<InternalCandidate[]> {
  if (isDemo) {
    return demo.articles
      .filter((a) => a.published_url && a.id !== opts.excludeId)
      .map((a) => {
        const ci = demo.contentItems.find((c) => c.id === a.content_item_id);
        return { url: a.published_url!, title: a.title, keyword: ci?.keyword ?? null, cluster: ci?.cluster ?? null };
      });
  }
  try {
    const sb = opts.db ?? (await createClient());
    const { data } = await sb
      .from("articles")
      .select("id, title, published_url, content_items(keyword, cluster)")
      .eq("site_id", siteId)
      .eq("status", "published")
      .not("published_url", "is", null)
      .order("published_at", { ascending: false })
      .limit(200);
    return (data ?? [])
      .filter((a) => a.id !== opts.excludeId)
      .map((a) => {
        const ci = (Array.isArray(a.content_items) ? a.content_items[0] : a.content_items) as { keyword?: string; cluster?: string } | null;
        return { url: a.published_url as string, title: a.title as string, keyword: ci?.keyword ?? null, cluster: ci?.cluster ?? null };
      });
  } catch {
    return [];
  }
}
