/**
 * Datos del portal de clientes de agencia (marca blanca) y de la gestión de
 * clientes desde la agencia. En modo demo devuelve los datos de Nido Studio;
 * con Supabase consulta respetando RLS (ver migración 0003_client_portal.sql).
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { isDemo } from "@/lib/env";
import { getVisibility, listArticles, listContentItems } from "@/lib/data";
import { getAnalytics, listIntegrations } from "@/lib/panel/data";
import { createClient } from "@/lib/supabase/server";
import type { Integration, Site } from "@/lib/types";
import * as demo from "./demo";
import type {
  Agency,
  AgencyClient,
  AgencyClientRow,
  ClientInvoice,
  ClientMember,
  ClientMessage,
  ClientSiteSettings,
  PortalContext,
  PortalResults,
  WhiteLabel,
} from "./types";

/** Cookie que fija qué cliente está previsualizando la agencia. */
export const PREVIEW_COOKIE = "ywc_portal_as";

export const DEFAULT_BRAND_COLOR = "#2f5bea";

const HEX = /^#[0-9a-f]{6}$/i;
export const safeColor = (c: string | undefined | null) => (c && HEX.test(c) ? c : DEFAULT_BRAND_COLOR);

/** Texto blanco o casi negro según el contraste con el color de la agencia. */
export function inkFor(hex: string) {
  const n = parseInt(safeColor(hex).slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? "#15130f" : "#ffffff";
}

export const agencyName = (a: Agency) => a.white_label.brand_name?.trim() || a.name;

/* ───────── portal del cliente ───────── */

export type PortalResolution = { ok: true; ctx: PortalContext } | { ok: false; reason: "login" | "no-access" };

export const resolvePortal = cache(async (): Promise<PortalResolution> => {
  const as = (await cookies()).get(PREVIEW_COOKIE)?.value ?? null;

  if (isDemo) {
    const client = demo.demoClients.find((c) => c.site_id === as) ?? demo.demoClients[0];
    const site = demo.demoClientSites.find((s) => s.id === client.site_id)!;
    const contact = demo.demoContact(site.id);
    return {
      ok: true,
      ctx: {
        agency: demo.demoAgency,
        client,
        site,
        viewer: as ? { ...demo.demoAgencyUser } : { id: null, name: contact.name, email: contact.email },
        preview: !!as,
      },
    };
  }

  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth.user;
  if (!user) return { ok: false, reason: "login" };
  const { data: profile } = await sb.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle();
  const viewer = { id: user.id, name: profile?.full_name ?? (profile?.email ?? user.email ?? "").split("@")[0], email: profile?.email ?? user.email ?? "" };

  let siteId: string | null = null;
  let preview = false;

  if (as && /^[0-9a-f-]{36}$/i.test(as)) {
    // La agencia previsualiza: debe ser owner/editor del workspace (de agencia) dueño del sitio.
    const { data: st } = await sb.from("sites").select("id, workspace_id").eq("id", as).maybeSingle();
    if (st) {
      const { data: m } = await sb.from("workspace_members").select("role, workspaces!inner(kind)").eq("workspace_id", st.workspace_id).eq("user_id", user.id).maybeSingle();
      const ws = (Array.isArray(m?.workspaces) ? m?.workspaces[0] : m?.workspaces) as { kind?: string } | undefined;
      if (m && ["owner", "editor"].includes(m.role) && ws?.kind === "agency") {
        siteId = st.id;
        preview = true;
      }
    }
  }

  if (!siteId) {
    // Activa invitaciones pendientes a su email y busca su sitio de cliente.
    await sb.rpc("activate_client_membership");
    const { data: rows } = await sb.from("client_site_members").select("site_id").eq("user_id", user.id).eq("status", "active").order("invited_at").limit(5);
    for (const r of rows ?? []) {
      const { data: st } = await sb.from("sites").select("id, workspace_id").eq("id", r.site_id).maybeSingle();
      if (!st) continue;
      const { data: m } = await sb.from("workspace_members").select("role").eq("workspace_id", st.workspace_id).eq("user_id", user.id).maybeSingle();
      if (m?.role === "client") {
        siteId = st.id;
        break;
      }
    }
  }
  if (!siteId) return { ok: false, reason: "no-access" };

  const [{ data: site }, { data: client }] = await Promise.all([
    sb.from("sites").select("*").eq("id", siteId).maybeSingle(),
    sb.from("agency_clients").select("*").eq("site_id", siteId).maybeSingle(),
  ]);
  if (!site || !client) return { ok: false, reason: "no-access" };
  const { data: ws } = await sb.from("workspaces").select("id, name, kind, white_label").eq("id", client.agency_workspace_id).maybeSingle();
  if (!ws || ws.kind !== "agency") return { ok: false, reason: "no-access" };

  return {
    ok: true,
    ctx: {
      agency: { id: ws.id, name: ws.name, white_label: (ws.white_label ?? {}) as WhiteLabel },
      client: client as AgencyClient,
      site: site as Site,
      viewer,
      preview,
    },
  };
});

/** Para páginas: el layout ya ha redirigido si no hay acceso. */
export async function getPortal(): Promise<PortalContext> {
  const r = await resolvePortal();
  if (!r.ok) throw new Error("Sin acceso al portal");
  return r.ctx;
}

/** Marca para favicon/OG sin redirecciones. */
export async function getPortalBrand(): Promise<{ name: string; color: string; logo: string | null }> {
  const r = await resolvePortal().catch(() => null);
  if (!r?.ok) return { name: "Portal de clientes", color: DEFAULT_BRAND_COLOR, logo: null };
  const wl = r.ctx.agency.white_label;
  return { name: agencyName(r.ctx.agency), color: safeColor(wl.primary_color), logo: wl.logo_url || null };
}

export async function getPortalResults(site: Site): Promise<PortalResults> {
  if (isDemo)
    return {
      traffic: demo.demoClientTraffic(site.id),
      articles: demo.demoClientArticles(site.id),
      items: demo.demoContentItems(site.id),
      checks: demo.demoClientChecks(site.id),
      analyticsConnected: true,
    };
  const [articles, items, vis, analytics] = await Promise.all([listArticles(site.id), listContentItems(site.id), getVisibility(site.id), getAnalytics(site.id)]);
  return { traffic: analytics.traffic, articles, items, checks: vis.checks, analyticsConnected: analytics.connected };
}

export async function listClientInvoices(siteId: string, { includeDrafts = false } = {}): Promise<ClientInvoice[]> {
  if (isDemo)
    return demo.demoInvoices
      .filter((i) => i.site_id === siteId && (includeDrafts || i.status !== "draft"))
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at));
  const sb = await createClient();
  let q = sb.from("client_invoices").select("*").eq("site_id", siteId);
  if (!includeDrafts) q = q.neq("status", "draft");
  const { data } = await q.order("issued_at", { ascending: false });
  return (data ?? []) as ClientInvoice[];
}

export async function getClientInvoice(siteId: string, id: string): Promise<ClientInvoice | null> {
  if (isDemo) return demo.demoInvoices.find((i) => i.id === id && i.site_id === siteId) ?? null;
  const sb = await createClient();
  const { data } = await sb.from("client_invoices").select("*").eq("id", id).eq("site_id", siteId).maybeSingle();
  return (data as ClientInvoice) ?? null;
}

export async function listClientMessages(siteId: string): Promise<ClientMessage[]> {
  if (isDemo) return demo.demoMessages.filter((m) => m.site_id === siteId);
  const sb = await createClient();
  const { data } = await sb.from("client_messages").select("id, site_id, author_name, author_side, body, created_at").eq("site_id", siteId).order("created_at").limit(200);
  return (data ?? []) as ClientMessage[];
}

export async function listClientMembers(siteId: string): Promise<ClientMember[]> {
  if (isDemo) return demo.demoMembers.filter((m) => m.site_id === siteId);
  const sb = await createClient();
  const { data } = await sb.from("client_site_members").select("id, site_id, email, full_name, role, status, invited_at").eq("site_id", siteId).order("invited_at");
  return (data ?? []) as ClientMember[];
}

export async function getClientSiteSettings(siteId: string): Promise<ClientSiteSettings> {
  if (isDemo) return demo.demoSiteSettings(siteId);
  const sb = await createClient();
  const { data } = await sb.from("client_site_settings").select("site_id, brand, custom_domain, domain_verified_at").eq("site_id", siteId).maybeSingle();
  return (data as ClientSiteSettings) ?? { site_id: siteId, brand: {}, custom_domain: null, domain_verified_at: null };
}

export async function listClientIntegrations(siteId: string): Promise<Integration[]> {
  if (isDemo) return siteId === "s_arboleda" ? [{ id: "i_wp", site_id: siteId, provider: "wordpress", status: "connected", created_at: new Date().toISOString() }] : [];
  return listIntegrations(siteId);
}

/** Destino del CNAME para dominios propios del blog o del portal. */
export const CNAME_TARGET = process.env.NEXT_PUBLIC_PORTAL_CNAME ?? "portal.yeswecontent.com";

/* ───────── lado agencia ───────── */

export type AgencyContext = { agency: Agency; user: { id: string | null; name: string; email: string }; role: "owner" | "editor" | "viewer" };

export const getAgencyContext = cache(async (): Promise<AgencyContext | null | "login"> => {
  if (isDemo) return { agency: demo.demoAgency, user: demo.demoAgencyUser, role: "owner" };
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return "login";
  const { data: profile } = await sb.from("profiles").select("email, full_name").eq("id", auth.user.id).maybeSingle();
  const { data } = await sb
    .from("workspace_members")
    .select("role, workspaces!inner(id, name, kind, white_label)")
    .eq("user_id", auth.user.id)
    .in("role", ["owner", "editor", "viewer"])
    .eq("workspaces.kind", "agency")
    .limit(1);
  const row = data?.[0];
  if (!row) return null;
  const ws = (Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces) as { id: string; name: string; white_label: WhiteLabel | null };
  return {
    agency: { id: ws.id, name: ws.name, white_label: ws.white_label ?? {} },
    user: { id: auth.user.id, name: profile?.full_name ?? (profile?.email ?? "").split("@")[0], email: profile?.email ?? auth.user.email ?? "" },
    role: row.role as AgencyContext["role"],
  };
});

const monthStart = () => {
  const d = isDemo ? new Date("2026-10-20T09:00:00Z") : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
};

export async function listAgencyClients(agencyId: string): Promise<AgencyClientRow[]> {
  if (isDemo) {
    const since = monthStart();
    return demo.demoClients.map((c) => {
      const s = demo.demoClientSites.find((x) => x.id === c.site_id)!;
      const inv = demo.demoInvoices.filter((i) => i.site_id === c.site_id).sort((a, b) => b.issued_at.localeCompare(a.issued_at))[0];
      return {
        ...c,
        site: { id: s.id, name: s.name, url: s.url },
        published_this_month: demo.demoClientArticles(s.id).filter((a) => a.published_at && a.published_at >= since).length,
        last_invoice: inv ? { number: inv.number, status: inv.status, amount_cents: inv.amount_cents, issued_at: inv.issued_at } : null,
        members: demo.demoMembers.filter((m) => m.site_id === c.site_id).length,
      };
    });
  }
  const sb = await createClient();
  const { data: clients } = await sb.from("agency_clients").select("*").eq("agency_workspace_id", agencyId).order("created_at");
  const ids = (clients ?? []).map((c) => c.site_id as string);
  if (!ids.length) return [];
  const [{ data: sites }, { data: invoices }, { data: arts }, { data: members }] = await Promise.all([
    sb.from("sites").select("id, name, url").in("id", ids),
    sb.from("client_invoices").select("site_id, number, status, amount_cents, issued_at").in("site_id", ids).order("issued_at", { ascending: false }),
    sb.from("articles").select("site_id").in("site_id", ids).eq("status", "published").gte("published_at", monthStart()),
    sb.from("client_site_members").select("site_id").in("site_id", ids),
  ]);
  return (clients ?? []).map((c) => {
    const s = (sites ?? []).find((x) => x.id === c.site_id);
    const inv = (invoices ?? []).find((i) => i.site_id === c.site_id);
    return {
      ...(c as AgencyClient),
      site: { id: c.site_id, name: s?.name ?? c.client_name, url: s?.url ?? "" },
      published_this_month: (arts ?? []).filter((a) => a.site_id === c.site_id).length,
      last_invoice: inv ? { number: inv.number, status: inv.status, amount_cents: inv.amount_cents, issued_at: inv.issued_at } : null,
      members: (members ?? []).filter((m) => m.site_id === c.site_id).length,
    };
  });
}

export async function getAgencyClient(agencyId: string, siteId: string): Promise<{ client: AgencyClient; site: Site } | null> {
  if (isDemo) {
    const client = demo.demoClients.find((c) => c.site_id === siteId);
    const site = demo.demoClientSites.find((s) => s.id === siteId);
    return client && site ? { client, site } : null;
  }
  if (!/^[0-9a-f-]{36}$/i.test(siteId)) return null;
  const sb = await createClient();
  const [{ data: client }, { data: site }] = await Promise.all([
    sb.from("agency_clients").select("*").eq("site_id", siteId).eq("agency_workspace_id", agencyId).maybeSingle(),
    sb.from("sites").select("*").eq("id", siteId).maybeSingle(),
  ]);
  return client && site ? { client: client as AgencyClient, site: site as Site } : null;
}

/** Siguiente número de factura correlativo de la agencia: PREFIJO-AAAA-NNNN. */
export async function nextInvoiceNumber(agency: Agency): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = (agencyName(agency).replace(/[^a-z]/gi, "").slice(0, 4) || "FAC").toUpperCase();
  if (isDemo) return `${prefix}-${year}-0053`;
  const sb = await createClient();
  const { count } = await sb.from("client_invoices").select("id", { count: "exact", head: true }).eq("workspace_id", agency.id).gte("issued_at", `${year}-01-01`);
  return `${prefix}-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}
