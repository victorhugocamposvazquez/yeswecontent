/**
 * Datos adicionales del panel (complementan src/lib/data.ts). En modo demo
 * devuelven los datos de ejemplo; con Supabase consultan respetando RLS.
 */
import "server-only";
import { isDemo } from "@/lib/env";
import * as demo from "@/lib/demo";
import { getAuditByToken, getCurrentSite } from "@/lib/data";
import { toPublicIntegration } from "@/lib/oauth/tokens";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Audit, BacklinkLink, Integration, ProductUpdate, TrafficPoint } from "@/lib/types";

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export async function listBacklinks(siteId: string): Promise<BacklinkLink[]> {
  if (isDemo) return demo.backlinks;
  const sb = await createClient();
  const { data } = await sb
    .from("backlink_links")
    .select("*")
    .or(`source_site_id.eq.${siteId},target_site_id.eq.${siteId}`)
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  // Dominios de las webs socias y títulos de los artículos de origen. Con RLS no
  // se ven las webs de otros clientes, así que usamos service role solo para estos ids.
  const partnerIds = [...new Set(rows.map((r) => (r.target_site_id === siteId ? r.source_site_id : r.target_site_id)))];
  const articleIds = [...new Set(rows.map((r) => r.source_article_id).filter(Boolean))] as string[];
  const lookup = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : sb;
  const [{ data: sites }, { data: arts }] = await Promise.all([
    partnerIds.length ? lookup.from("sites").select("id, url").in("id", partnerIds) : Promise.resolve({ data: [] as { id: string; url: string }[] }),
    articleIds.length ? lookup.from("articles").select("id, title").in("id", articleIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const siteUrl = new Map((sites ?? []).map((s) => [s.id, s.url as string]));
  const title = new Map((arts ?? []).map((a) => [a.id, a.title as string]));
  return rows.map((r) => {
    const received = r.target_site_id === siteId;
    const partnerUrl = siteUrl.get(received ? r.source_site_id : r.target_site_id);
    return {
      id: r.id,
      direction: received ? "received" : "given",
      partner_domain: partnerUrl ? host(partnerUrl) : received ? host(r.source_article_url ?? "") || "—" : host(r.target_url),
      source_article_url: r.source_article_url,
      source_article_title: r.source_article_id ? title.get(r.source_article_id) ?? null : null,
      source_article_id: received ? null : r.source_article_id ?? null,
      target_url: r.target_url,
      anchor: r.anchor,
      domain_rating: r.domain_rating,
      status: r.status,
      created_at: r.created_at,
    } satisfies BacklinkLink;
  });
}

export async function listIntegrations(siteId: string): Promise<Integration[]> {
  if (isDemo) return demo.integrations;
  const sb = await createClient();
  const { data } = await sb.from("integrations").select("id, site_id, provider, status, config, created_at").eq("site_id", siteId);
  // Nunca devolvemos `config` tal cual: solo la cuenta conectada y los metadatos no sensibles.
  return (data ?? []).map(toPublicIntegration);
}

export async function listCompetitors(siteId: string): Promise<{ id: string; url: string; name: string | null }[]> {
  if (isDemo)
    return [
      { id: "co1", url: "https://barroyfuego.com", name: "Barro y Fuego" },
      { id: "co2", url: "https://lalozadecasa.es", name: "La Loza de Casa" },
      { id: "co3", url: "https://ceramicadelsur.es", name: "Cerámica del Sur" },
    ];
  const sb = await createClient();
  const { data } = await sb.from("competitors").select("id, url, name").eq("site_id", siteId);
  return data ?? [];
}

export async function listProductUpdates(): Promise<ProductUpdate[]> {
  if (isDemo) return demo.productUpdates;
  const sb = await createClient();
  const { data } = await sb.from("product_updates").select("*").order("published_at", { ascending: false }).limit(30);
  return data ?? [];
}

export async function listTeam(workspaceId: string): Promise<{ email: string; name: string | null; role: string }[]> {
  if (isDemo) return demo.teamMembers;
  const sb = await createClient();
  const { data } = await sb.from("workspace_members").select("role, profiles(email, full_name)").eq("workspace_id", workspaceId);
  return (data ?? []).map((r) => {
    const p = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as { email?: string; full_name?: string | null } | null;
    return { email: p?.email ?? "—", name: p?.full_name ?? null, role: r.role as string };
  });
}

export async function listPendingInvitations(
  workspaceId: string,
): Promise<{ id: string; email: string; role: string; created_at: string }[]> {
  if (isDemo) return [];
  const sb = await createClient();
  const { data } = await sb
    .from("invitations")
    .select("id, email, role, created_at")
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getWorkspace(workspaceId: string): Promise<{ id: string; name: string; kind: string; white_label: Record<string, string>; referral_code: string | null } | null> {
  if (isDemo) return { id: "w_demo", name: "Tierrafina", kind: "business", white_label: {}, referral_code: "tierra26" };
  const sb = await createClient();
  const { data } = await sb.from("workspaces").select("id, name, kind, white_label, referral_code").eq("id", workspaceId).maybeSingle();
  return data;
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}
export interface TopPage {
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}
export interface AnalyticsData {
  /** Hay datos que enseñar (Google conectado con al menos una propiedad elegida). */
  connected: boolean;
  /** Estado de cada fuente, para los estados vacíos del panel. */
  google: { connected: boolean; account: string | null; gsc: boolean; ga4: boolean; lastSync: string | null; error: string | null };
  traffic: TrafficPoint[];
  topQueries: TopQuery[];
  topPages: TopPage[];
  aiReferrers: { source: string; visits: number }[];
}

/**
 * Analítica desde la caché `analytics_daily` / `analytics_snapshots`, que rellena
 * el cron diario /api/cron/analytics a partir de Search Console y GA4.
 * Sin `siteId` usa el sitio activo del panel.
 */
export async function getAnalytics(siteId?: string): Promise<AnalyticsData> {
  if (isDemo)
    return {
      connected: true,
      google: { connected: true, account: "hola@tierrafina.es", gsc: true, ga4: true, lastSync: new Date().toISOString(), error: null },
      traffic: demo.traffic.map((p) => ({ ...p, sessions: Math.round(p.clicks * 1.35 + p.ai_visits) })),
      topQueries: demo.topQueries,
      topPages: [
        { page: "https://tierrafina.es/blog/ceramica-lavavajillas", clicks: 512, impressions: 13900, position: 3.4 },
        { page: "https://tierrafina.es/blog/tazas-artesanales", clicks: 431, impressions: 10100, position: 4.1 },
        { page: "https://tierrafina.es/blog/vajilla-artesanal-guia", clicks: 302, impressions: 15800, position: 6.5 },
      ],
      aiReferrers: demo.aiReferrers,
    };
  const empty: AnalyticsData = { connected: false, google: { connected: false, account: null, gsc: false, ga4: false, lastSync: null, error: null }, traffic: [], topQueries: [], topPages: [], aiReferrers: [] };
  const id = siteId ?? (await getCurrentSite())?.id;
  if (!id) return empty;
  const sb = await createClient();
  const { data: row } = await sb.from("integrations").select("id, site_id, provider, status, config, created_at").eq("site_id", id).eq("provider", "google").maybeSingle();
  if (!row) return empty;
  const g = toPublicIntegration(row);
  const google = {
    connected: g.status === "connected",
    account: g.account_name ?? null,
    gsc: !!g.meta?.gsc_property,
    ga4: !!g.meta?.ga4_property,
    lastSync: g.meta?.last_sync_at ?? null,
    error: g.status === "error" ? (g.meta?.last_error ?? "La conexión con Google ha fallado.") : (g.meta?.last_error ?? null),
  };
  if (!google.gsc && !google.ga4) return { ...empty, google };

  const since = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: days }, { data: snaps }] = await Promise.all([
    sb.from("analytics_daily").select("date, clicks, impressions, sessions, ai_visits, ai_sources").eq("site_id", id).gte("date", since).order("date"),
    sb.from("analytics_snapshots").select("kind, data").eq("site_id", id),
  ]);
  const traffic: TrafficPoint[] = (days ?? []).map((d) => ({ date: d.date, clicks: d.clicks, impressions: d.impressions, ai_visits: d.ai_visits, sessions: d.sessions }));
  const bySource = new Map<string, number>();
  for (const d of days ?? []) for (const [k, v] of Object.entries((d.ai_sources ?? {}) as Record<string, number>)) bySource.set(k, (bySource.get(k) ?? 0) + (Number(v) || 0));
  const snap = <T,>(kind: string) => ((snaps ?? []).find((x) => x.kind === kind)?.data ?? []) as T[];
  return {
    connected: traffic.length > 0,
    google,
    traffic,
    topQueries: snap<TopQuery>("top_queries").slice(0, 10),
    topPages: snap<TopPage>("top_pages").slice(0, 10),
    aiReferrers: [...bySource.entries()].map(([source, visits]) => ({ source, visits })).sort((a, b) => b.visits - a.visits),
  };
}

export function getVisibilityHistory() {
  return isDemo ? demo.visibilityHistory : [];
}

export async function listInvoices(): Promise<{ id: string; date: string; amount: number; status: "pagada" | "pendiente"; url: string | null }[]> {
  if (isDemo)
    return [
      { id: "YWC-2026-0142", date: "2026-10-01", amount: 178800, status: "pagada", url: null },
      { id: "YWC-2025-0981", date: "2025-10-01", amount: 178800, status: "pagada", url: null },
    ];
  // Stripe invoices.list cuando el portal esté cableado; hasta entonces vacío (UI lo dice).
  return [];
}

/**
 * Auditoría compartida por enlace público. Con RLS un visitante anónimo no puede
 * leer `audits`, así que buscamos por token con service role (solo ese registro).
 */
export async function getSharedAudit(token: string): Promise<Audit | null> {
  if (isDemo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return getAuditByToken(token);
  if (!/^[a-z0-9-]{4,64}$/i.test(token)) return null;
  const { data } = await createServiceClient().from("audits").select("id, site_id, url, score, results, share_token, created_at").eq("share_token", token).maybeSingle();
  return data;
}
