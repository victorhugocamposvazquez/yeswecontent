import { NextResponse } from "next/server";
import { syncSiteAnalytics, type SyncResult } from "@/lib/analytics/sync";
import { isDemo } from "@/lib/env";
import { isAuthorizedCron } from "@/lib/panel/auth";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron diario (04:00 UTC): sincroniza Search Console y GA4 de cada sitio con Google conectado.
 * Trae los últimos 5 días (Search Console consolida con 2–3 días de retraso);
 * si el sitio no se ha sincronizado nunca, trae 90 días.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (isDemo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, demo: true, synced: 0 });

  const db = createServiceClient();
  const { data, error } = await db.from("integrations").select("site_id, config").eq("provider", "google").eq("status", "connected").limit(Number(process.env.ANALYTICS_BATCH ?? 500));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const started = Date.now();
  const results: SyncResult[] = [];
  for (const row of data ?? []) {
    if (Date.now() - started > 270_000) break; // margen antes del límite de la función
    const meta = ((row.config as { meta?: { last_sync_at?: string | null } } | null)?.meta ?? {}) as { last_sync_at?: string | null };
    results.push(await syncSiteAnalytics(db, row.site_id as string, { days: meta.last_sync_at ? 5 : 90 }));
  }
  return NextResponse.json({ ok: true, sites: data?.length ?? 0, synced: results.filter((r) => r.ok).length, results });
}
