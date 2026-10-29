import "server-only";
import { isDemo } from "@/lib/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type ArticleQuota = {
  limit: number;
  used: number;
  remaining: number;
  planId: string | null;
};

function monthStartIso(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

type Sb = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createServiceClient>;

/** Artículos creados este mes (UTC) frente al cupo del plan del sitio. */
export async function getArticleQuota(siteId: string, opts?: { service?: boolean }): Promise<ArticleQuota> {
  if (isDemo) return { limit: 20, used: 0, remaining: 20, planId: "semilla" };

  const sb: Sb = opts?.service ? createServiceClient() : await createClient();
  const [{ data: sub }, { data: plans }, { count }] = await Promise.all([
    sb.from("subscriptions").select("plan_id").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("plans").select("id, articles_per_month").eq("active", true),
    sb.from("articles").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", monthStartIso()),
  ]);
  const plan = (plans ?? []).find((p) => p.id === sub?.plan_id);
  const limit = plan?.articles_per_month ?? 20;
  const used = count ?? 0;
  return { limit, used, remaining: Math.max(0, limit - used), planId: plan?.id ?? null };
}

export function quotaExceededMessage(q: ArticleQuota) {
  return `Has llegado al cupo de ${q.limit} artículos este mes${q.planId ? ` (plan ${q.planId})` : ""}. Sube de plan o espera al mes que viene.`;
}
