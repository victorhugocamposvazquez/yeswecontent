import { NextResponse } from "next/server";
import { isDemo } from "@/lib/env";
import { getGlobalSettings } from "@/lib/panel/app-settings";
import { isAuthorizedCron } from "@/lib/panel/auth";
import { getArticleQuota } from "@/lib/panel/quotas";
import { writeContentItem } from "@/lib/panel/write-content";
import { createServiceClient } from "@/lib/supabase/server";
import type { ContentItem, Site } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron diario: redacta temas `planned` con cuota disponible (antes del publish).
 * Límite blando por ejecución para no agotar el timeout de la función.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDemo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, demo: true, written: 0 });

  const sb = createServiceClient();
  if ((await getGlobalSettings(sb)).generation_enabled === false) {
    return NextResponse.json({ ok: true, skipped: "generation_disabled", written: 0 });
  }

  const batch = Math.min(20, Math.max(1, Number(process.env.GENERATE_BATCH) || 8));
  const { data: items, error } = await sb
    .from("content_items")
    .select("*, sites(*)")
    .eq("status", "planned")
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(80);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const written: string[] = [];
  const failed: { id: string; error: string }[] = [];
  const quotaCache = new Map<string, Awaited<ReturnType<typeof getArticleQuota>>>();

  for (const raw of items ?? []) {
    if (written.length >= batch) break;
    const site = (Array.isArray(raw.sites) ? raw.sites[0] : raw.sites) as Site | null;
    if (!site?.id) continue;
    const item = raw as ContentItem & { sites?: unknown };
    let q = quotaCache.get(site.id);
    if (!q) {
      q = await getArticleQuota(site.id, { service: true });
      quotaCache.set(site.id, q);
    }
    if (q.remaining <= 0) continue;

    const r = await writeContentItem(site, item, { service: true });
    if (r.ok) {
      written.push(r.articleId);
      quotaCache.set(site.id, { ...q, used: q.used + 1, remaining: Math.max(0, q.remaining - 1) });
    } else {
      failed.push({ id: item.id, error: r.error });
    }
  }

  return NextResponse.json({ ok: true, written: written.length, ids: written, failed: failed.slice(0, 10) });
}
