import { NextResponse } from "next/server";
import { isDemo } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/panel/auth";
import { publishSocialPost } from "@/lib/social";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_ATTEMPTS = 3;

/** Cron cada 15 min: publica las social_posts programadas cuya hora ya ha llegado. */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDemo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, demo: true, published: 0 });

  const db = createServiceClient();
  const { data, error } = await db
    .from("social_posts")
    .select("id, site_id, article_id, channel, kind, thread_url, content, slides, attempts")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for")
    .limit(Number(process.env.SOCIAL_BATCH ?? 20));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: string; ok: boolean; url?: string | null; error?: string }[] = [];
  for (const post of data ?? []) {
    const res = await publishSocialPost(db, post);
    const attempts = ((post.attempts as number | null) ?? 0) + 1;
    const now = new Date().toISOString();
    const patch = res.ok
      ? { status: "published", published_url: res.url, published_at: now, external_id: res.externalId ?? null, attempts, last_error: null }
      : res.permanent || attempts >= MAX_ATTEMPTS
        ? { status: "failed", attempts, last_error: res.error ?? "Error desconocido" }
        : // Reintento con espera creciente (15, 30 min…)
          { attempts, last_error: res.error ?? "Error desconocido", scheduled_for: new Date(Date.now() + attempts * 15 * 60_000).toISOString() };
    await db.from("social_posts").update(patch).eq("id", post.id);
    results.push({ id: post.id as string, ok: res.ok, url: res.url, error: res.error });
  }

  return NextResponse.json({ ok: true, due: data?.length ?? 0, published: results.filter((r) => r.ok).length, results });
}
