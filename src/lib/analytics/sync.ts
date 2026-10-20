/**
 * Sincroniza Search Console y GA4 → analytics_daily / analytics_snapshots.
 * Lo llama el cron diario (/api/cron/analytics) y el panel justo después de elegir propiedad.
 * Necesita un cliente con service role (las tablas de analítica son de solo lectura con RLS).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccessToken, updateIntegrationMeta } from "@/lib/oauth/tokens";
import { aiLabelFor, ga4AiSessions, ga4SessionsByDay, gscDaily, gscTop } from "./google";

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

interface DailyRow {
  site_id: string;
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
  sessions: number;
  ai_visits: number;
  ai_sources: Record<string, number>;
  updated_at: string;
}

export interface SyncResult {
  siteId: string;
  ok: boolean;
  days: number;
  gsc: boolean;
  ga4: boolean;
  error?: string;
}

export async function syncSiteAnalytics(db: SupabaseClient, siteId: string, { days = 90 }: { days?: number } = {}): Promise<SyncResult> {
  const result: SyncResult = { siteId, ok: false, days: 0, gsc: false, ga4: false };
  try {
    const { token, meta } = await getAccessToken(db, siteId, "google");
    if (!meta.gsc_property && !meta.ga4_property) return { ...result, ok: true, error: "Sin propiedad elegida" };

    const start = day(-days);
    const end = day(-1);
    const now = new Date().toISOString();
    const rows = new Map<string, DailyRow>();
    const row = (date: string) => {
      let r = rows.get(date);
      if (!r) {
        r = { site_id: siteId, date, clicks: 0, impressions: 0, ctr: 0, position: null, sessions: 0, ai_visits: 0, ai_sources: {}, updated_at: now };
        rows.set(date, r);
      }
      return r;
    };
    const errors: string[] = [];

    if (meta.gsc_property) {
      try {
        const [daily, queries, pages] = await Promise.all([
          gscDaily(token, meta.gsc_property, start, end),
          gscTop(token, meta.gsc_property, "query", day(-28), end),
          gscTop(token, meta.gsc_property, "page", day(-28), end),
        ]);
        for (const d of daily) Object.assign(row(d.date), { clicks: Math.round(d.clicks), impressions: Math.round(d.impressions), ctr: d.ctr, position: d.position });
        const { error } = await db.from("analytics_snapshots").upsert(
          [
            { site_id: siteId, kind: "top_queries", data: queries.map((q) => ({ query: q.key, clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, position: q.position })), period_start: day(-28), period_end: end, updated_at: now },
            { site_id: siteId, kind: "top_pages", data: pages.map((p) => ({ page: p.key, clicks: p.clicks, impressions: p.impressions, ctr: p.ctr, position: p.position })), period_start: day(-28), period_end: end, updated_at: now },
          ],
          { onConflict: "site_id,kind" },
        );
        if (error) throw new Error(error.message);
        result.gsc = true;
      } catch (e) {
        errors.push(`Search Console: ${e instanceof Error ? e.message : e}`);
      }
    }

    if (meta.ga4_property) {
      try {
        const [sessions, ai] = await Promise.all([ga4SessionsByDay(token, meta.ga4_property, start, end), ga4AiSessions(token, meta.ga4_property, start, end)]);
        for (const s of sessions) row(s.date).sessions = s.sessions;
        for (const a of ai) {
          const label = aiLabelFor(a.source);
          if (!label) continue;
          const r = row(a.date);
          r.ai_visits += a.sessions;
          r.ai_sources[label] = (r.ai_sources[label] ?? 0) + a.sessions;
        }
        result.ga4 = true;
      } catch (e) {
        errors.push(`GA4: ${e instanceof Error ? e.message : e}`);
      }
    }

    // Solo escribimos las columnas de las fuentes que han respondido, para no pisar datos buenos con ceros.
    const list = [...rows.values()].map((r) => {
      const out: Record<string, unknown> = { site_id: r.site_id, date: r.date, updated_at: r.updated_at };
      if (result.gsc) Object.assign(out, { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
      if (result.ga4) Object.assign(out, { sessions: r.sessions, ai_visits: r.ai_visits, ai_sources: r.ai_sources });
      return out;
    });
    for (let i = 0; i < list.length; i += 500) {
      const { error } = await db.from("analytics_daily").upsert(list.slice(i, i + 500), { onConflict: "site_id,date" });
      if (error) throw new Error(error.message);
    }
    result.days = list.length;
    result.ok = errors.length === 0;
    if (errors.length) result.error = errors.join(" · ");
    await updateIntegrationMeta(db, siteId, "google", { last_sync_at: now, last_error: result.error ?? null }, result.ok || result.gsc || result.ga4 ? "connected" : undefined);
    return result;
  } catch (e) {
    return { ...result, error: e instanceof Error ? e.message : String(e) };
  }
}
