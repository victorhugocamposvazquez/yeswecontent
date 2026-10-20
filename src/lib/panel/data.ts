/**
 * Datos adicionales del panel (complementan src/lib/data.ts). En modo demo
 * devuelven los datos de ejemplo; con Supabase consultan respetando RLS.
 */
import "server-only";
import { isDemo } from "@/lib/env";
import * as demo from "@/lib/demo";
import { getAuditByToken } from "@/lib/data";
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
  return (data ?? []).map((r) => {
    const received = r.target_site_id === siteId;
    return {
      id: r.id,
      direction: received ? "received" : "given",
      partner_domain: received ? host(r.source_article_url ?? "") || "—" : host(r.target_url),
      source_article_url: r.source_article_url,
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
  const { data } = await sb.from("integrations").select("id, site_id, provider, status, created_at").eq("site_id", siteId);
  return data ?? [];
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

export async function getWorkspace(workspaceId: string): Promise<{ id: string; name: string; kind: string; white_label: Record<string, string>; referral_code: string | null } | null> {
  if (isDemo) return { id: "w_demo", name: "Tierrafina", kind: "business", white_label: {}, referral_code: "tierra26" };
  const sb = await createClient();
  const { data } = await sb.from("workspaces").select("id, name, kind, white_label, referral_code").eq("id", workspaceId).maybeSingle();
  return data;
}

/**
 * Analítica. Los datos reales llegan cuando se conecta Search Console / GA4
 * (TODO: sincronización periódica). Mientras tanto, fuera de demo devolvemos vacío.
 */
export async function getAnalytics(): Promise<{
  connected: boolean;
  traffic: TrafficPoint[];
  topQueries: typeof demo.topQueries;
  aiReferrers: typeof demo.aiReferrers;
}> {
  if (isDemo) return { connected: true, traffic: demo.traffic, topQueries: demo.topQueries, aiReferrers: demo.aiReferrers };
  return { connected: false, traffic: [], topQueries: [], aiReferrers: [] };
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
  // TODO: leer facturas desde Stripe (invoices.list por customer) cuando esté el portal.
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
