import { NextResponse } from "next/server";
import { isDemo } from "@/lib/env";
import { getGlobalSettings } from "@/lib/panel/app-settings";
import { isAuthorizedCron } from "@/lib/panel/auth";
import { buildJsonLd } from "@/lib/panel/generate";
import { CMS_PROVIDERS, publish, toIntegrationConfig } from "@/lib/publish";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Row = {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  body_md: string;
  faq: { q: string; a: string }[];
  cover_url: string | null;
  language: string;
  schema_jsonld: Record<string, unknown> | null;
  content_item_id: string | null;
  content_items: { scheduled_for: string | null } | { scheduled_for: string | null }[] | null;
  sites: { name: string; url: string; schedule: { time?: string } | null } | { name: string; url: string; schedule: { time?: string } | null }[] | null;
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

/**
 * Cron horario: publica los artículos programados cuya fecha (content_items.scheduled_for)
 * ya ha llegado y cuya hora del calendario del sitio (sites.schedule.time, UTC) ha pasado.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDemo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, demo: true, published: 0 });

  const sb = createServiceClient();
  if ((await getGlobalSettings(sb)).generation_enabled === false) return NextResponse.json({ ok: true, skipped: "generation_disabled", published: 0 });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hhmm = now.toISOString().slice(11, 16);

  const { data, error } = await sb
    .from("articles")
    .select("id, site_id, title, slug, meta_description, body_md, faq, cover_url, language, schema_jsonld, content_item_id, content_items(scheduled_for), sites(name, url, schedule)")
    .eq("status", "scheduled")
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = ((data ?? []) as unknown as Row[]).filter((a) => {
    const date = one(a.content_items)?.scheduled_for ?? null;
    if (!date) return true; // programado sin fecha: en la siguiente pasada
    if (date < today) return true;
    if (date > today) return false;
    return (one(a.sites)?.schedule?.time ?? "09:00") <= hhmm;
  });

  const results: { id: string; ok: boolean; url?: string | null; error?: string }[] = [];
  for (const a of due) {
    const { data: integrations } = await sb.from("integrations").select("provider, config, status").eq("site_id", a.site_id).in("provider", CMS_PROVIDERS);
    const integration = (integrations ?? []).filter((i) => i.status === "connected").map(toIntegrationConfig).find(Boolean);
    if (!integration) {
      results.push({ id: a.id, ok: false, error: "Sin integración de publicación" });
      continue;
    }
    const site = one(a.sites);
    const schema = a.schema_jsonld ?? (site ? buildJsonLd({ title: a.title, meta_description: a.meta_description ?? "", faq: a.faq ?? [] }, site) : null);
    const res = await publish({ ...a, faq: a.faq ?? [], schema_jsonld: schema }, integration);
    await sb
      .from("articles")
      .update(res.ok ? { status: "published", published_url: res.url, published_at: now.toISOString(), updated_at: now.toISOString() } : { status: "failed", updated_at: now.toISOString() })
      .eq("id", a.id);
    if (res.ok && a.content_item_id) await sb.from("content_items").update({ status: "published" }).eq("id", a.content_item_id);
    results.push({ id: a.id, ok: res.ok, url: res.url, error: res.error });
  }

  return NextResponse.json({ ok: true, checked: data?.length ?? 0, due: due.length, published: results.filter((r) => r.ok).length, results });
}
