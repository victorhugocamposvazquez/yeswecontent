/**
 * Capa de datos del panel de administración.
 * Modo demo: datos de ejemplo. Con Supabase: service role tras verificar que
 * quien llama es admin (ver guard.ts).
 */
import "server-only";
import { cache } from "react";
import { isDemo } from "@/lib/env";
import * as demo from "@/lib/demo";
import type { AdminUserRow, CaseStudy, Lead, ProductUpdate, Role, Subscription } from "@/lib/types";
import { adminDb } from "./guard";
import { mrrFor } from "./mrr";
import * as ademo from "./demo";
import { usdToEur } from "@/lib/ai/usage";
import type {
  AdminPlan,
  AdminSiteRow,
  AdminSubscriptionRow,
  AiCostOverview,
  AiCostSiteRow,
  AppSettings,
  ModerationLink,
  Overview,
  QueueJob,
  UserDetail,
  VolumeTier,
} from "./types";

type DB = Awaited<ReturnType<typeof adminDb>>["db"];

const DAY = 86_400_000;
const now = () => (isDemo ? new Date("2026-10-20T09:00:00Z") : new Date());
const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

/* ───────── Ajustes globales (tabla app_settings: key text pk, value jsonb) ───────── */

async function readSetting<T>(db: DB, key: string, fallback: T): Promise<T> {
  const { data, error } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error || !data) return fallback;
  return data.value as T;
}

export async function getSettings(): Promise<AppSettings> {
  if (isDemo) return ademo.demoSettings;
  const { db } = await adminDb();
  return { ...ademo.demoSettings, ...(await readSetting<Partial<AppSettings>>(db, "global", {})) };
}

export async function getVolumeTiers(): Promise<VolumeTier[]> {
  if (isDemo) return ademo.demoVolumeTiers;
  const { db } = await adminDb();
  return readSetting(db, "volume_discounts", ademo.demoVolumeTiers);
}

export async function getBannedDomains(): Promise<string[]> {
  if (isDemo) return ademo.demoBannedDomains;
  const { db } = await adminDb();
  return readSetting<string[]>(db, "banned_domains", []);
}

/* ───────── Carga base (una vez por petición) ───────── */

type Row = Record<string, unknown>;
interface Base {
  profiles: { id: string; email: string; full_name: string | null; role: Role; created_at: string }[];
  workspaces: { id: string; name: string; kind: "business" | "agency"; owner_id: string; created_at: string }[];
  sites: { id: string; workspace_id: string; name: string; url: string; created_at: string }[];
  subs: (Subscription & { stripe_customer_id: string | null; stripe_subscription_id: string | null; created_at: string })[];
  plans: AdminPlan[];
  articles: { site_id: string; status: string; published_at: string | null }[];
  integrations: { site_id: string; provider: string; status: string }[];
}

const loadBase = cache(async (): Promise<Base> => {
  const { db } = await adminDb();
  const q = async <T,>(p: PromiseLike<{ data: Row[] | null }>) => ((await p).data ?? []) as T[];
  const [profiles, workspaces, sites, subs, plans, articles, integrations] = await Promise.all([
    q<Base["profiles"][number]>(db.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false }).limit(5000)),
    q<Base["workspaces"][number]>(db.from("workspaces").select("id, name, kind, owner_id, created_at").limit(5000)),
    q<Base["sites"][number]>(db.from("sites").select("id, workspace_id, name, url, created_at").limit(10000)),
    q<Base["subs"][number]>(db.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(10000)),
    q<AdminPlan>(db.from("plans").select("*").order("sort")),
    q<Base["articles"][number]>(db.from("articles").select("site_id, status, published_at").limit(50000)),
    q<Base["integrations"][number]>(db.from("integrations").select("site_id, provider, status").limit(20000)),
  ]);
  return { profiles, workspaces, sites, subs, plans, articles, integrations };
});

function subMrr(b: Base, s: Base["subs"][number]) {
  if (s.status !== "active" && s.status !== "past_due") return 0;
  const plan = b.plans.find((p) => p.id === s.plan_id);
  return plan ? mrrFor(plan, s.interval) : 0;
}

function buildSites(b: Base): AdminSiteRow[] {
  return b.sites.map((s) => {
    const ws = b.workspaces.find((w) => w.id === s.workspace_id);
    const owner = b.profiles.find((p) => p.id === ws?.owner_id);
    const sub = b.subs.find((x) => x.site_id === s.id);
    const arts = b.articles.filter((a) => a.site_id === s.id);
    const published = arts.filter((a) => a.status === "published" && a.published_at).map((a) => a.published_at!).sort();
    const integrations = b.integrations.filter((i) => i.site_id === s.id).map(({ provider, status }) => ({ provider, status }));
    const failed = arts.some((a) => a.status === "failed");
    const last = published.at(-1) ?? null;
    const stale = sub?.status === "active" && (!last || now().getTime() - new Date(last).getTime() > 14 * DAY);
    const health: AdminSiteRow["health"] =
      failed || integrations.some((i) => i.status !== "connected") ? "bad" : stale || integrations.length < 2 ? "warn" : "ok";
    return {
      id: s.id,
      name: s.name,
      url: s.url,
      workspace: ws?.name ?? "—",
      owner_email: owner?.email ?? null,
      plan_id: sub?.plan_id ?? null,
      status: sub?.status ?? null,
      articles: published.length,
      last_published_at: last,
      integrations,
      health,
      created_at: s.created_at,
    };
  });
}

function buildSubs(b: Base): AdminSubscriptionRow[] {
  return b.subs.map((s) => {
    const site = b.sites.find((x) => x.id === s.site_id);
    const ws = b.workspaces.find((w) => w.id === site?.workspace_id);
    const owner = b.profiles.find((p) => p.id === ws?.owner_id);
    return {
      id: s.id,
      site_id: s.site_id,
      site_name: site?.name ?? "—",
      workspace: ws?.name ?? "—",
      email: owner?.email ?? null,
      plan_id: s.plan_id,
      status: s.status,
      interval: s.interval,
      mrr_eur: subMrr(b, s),
      trial_ends_at: s.trial_ends_at,
      current_period_end: s.current_period_end,
      stripe_customer_id: s.stripe_customer_id,
      stripe_subscription_id: s.stripe_subscription_id,
      created_at: s.created_at,
    };
  });
}

function buildUsers(b: Base): (AdminUserRow & { role: Role })[] {
  return b.profiles.map((p) => {
    const ws = b.workspaces.find((w) => w.owner_id === p.id);
    const siteIds = b.sites.filter((s) => s.workspace_id === ws?.id).map((s) => s.id);
    const subs = b.subs.filter((s) => siteIds.includes(s.site_id));
    const main = subs.find((s) => s.status !== "canceled") ?? subs[0];
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      workspace: ws?.name ?? "—",
      sites: siteIds.length,
      plan_id: main?.plan_id ?? null,
      status: main?.status ?? null,
      mrr_eur: subs.reduce((t, s) => t + subMrr(b, s), 0),
      created_at: p.created_at,
    };
  });
}

/* ───────── Listados ───────── */

export async function listAdminUsers(): Promise<(AdminUserRow & { role: Role })[]> {
  if (isDemo) return demo.adminUsers.map((u) => ({ ...u, role: u.id === "u_demo" ? "admin" : "user" }));
  return buildUsers(await loadBase());
}

export async function listAdminSites(): Promise<AdminSiteRow[]> {
  if (isDemo) return ademo.demoAdminSites;
  return buildSites(await loadBase());
}

export async function listAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
  if (isDemo) return ademo.demoAdminSubscriptions;
  return buildSubs(await loadBase());
}

export async function listAdminPlans(): Promise<AdminPlan[]> {
  if (isDemo) return ademo.demoAdminPlans;
  return (await loadBase()).plans;
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const users = await listAdminUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  const plans = await listAdminPlans();
  const plan = plans.find((p) => p.id === user.plan_id);

  if (isDemo) {
    const sites = ademo.demoAdminSites.filter((s) => s.owner_email === user.email);
    const subscriptions = ademo.demoAdminSubscriptions.filter((s) => s.email === user.email);
    const n = Math.max(sites.length, 1);
    return {
      user,
      workspace: { id: `w_${user.id}`, name: user.workspace, kind: user.plan_id === "agencia" ? "agency" : "business", created_at: user.created_at },
      sites,
      subscriptions,
      usage: [
        { label: "Artículos este mes", used: Math.round((plan?.articles_per_month ?? 20) * n * 0.62), limit: plan?.articles_per_month ? plan.articles_per_month * n : null },
        { label: "Prompts de IA rastreados", used: Math.round((plan?.tracked_prompts ?? 10) * n * 0.8), limit: plan?.tracked_prompts ? plan.tracked_prompts * n : null },
        { label: "Créditos de enlaces", used: Math.round((plan?.backlink_credits ?? 20) * n * 0.35), limit: plan?.backlink_credits ? plan.backlink_credits * n : null },
        { label: "Usuarios del equipo", used: 2, limit: plan?.seats ?? null },
      ],
    };
  }

  const { db } = await adminDb();
  const b = await loadBase();
  const ws = b.workspaces.find((w) => w.owner_id === id) ?? null;
  const siteIds = b.sites.filter((s) => s.workspace_id === ws?.id).map((s) => s.id);
  const sites = buildSites(b).filter((s) => siteIds.includes(s.id));
  const subscriptions = buildSubs(b).filter((s) => siteIds.includes(s.site_id));
  const monthStart = new Date(now().getFullYear(), now().getMonth(), 1).toISOString();
  const n = Math.max(siteIds.length, 1);
  const [arts, prompts, members] = siteIds.length
    ? await Promise.all([
        db.from("articles").select("id", { count: "exact", head: true }).in("site_id", siteIds).gte("created_at", monthStart),
        db.from("ai_prompts").select("id", { count: "exact", head: true }).in("site_id", siteIds).eq("active", true),
        ws ? db.from("workspace_members").select("user_id", { count: "exact", head: true }).eq("workspace_id", ws.id) : Promise.resolve({ count: 1 }),
      ])
    : [{ count: 0 }, { count: 0 }, { count: 1 }];
  return {
    user,
    workspace: ws ? { id: ws.id, name: ws.name, kind: ws.kind, created_at: ws.created_at } : null,
    sites,
    subscriptions,
    usage: [
      { label: "Artículos este mes", used: arts.count ?? 0, limit: plan?.articles_per_month ? plan.articles_per_month * n : null },
      { label: "Prompts de IA rastreados", used: prompts.count ?? 0, limit: plan?.tracked_prompts ? plan.tracked_prompts * n : null },
      { label: "Usuarios del equipo", used: members.count ?? 1, limit: plan?.seats ?? null },
    ],
  };
}

export async function listQueue(): Promise<QueueJob[]> {
  if (isDemo) return ademo.demoQueue;
  const { db } = await adminDb();
  const [{ data: items }, { data: arts }, { data: sites }] = await Promise.all([
    db.from("content_items").select("id, site_id, title, status, created_at").in("status", ["writing"]).limit(500),
    db.from("articles").select("id, site_id, title, status, updated_at").in("status", ["review", "failed"]).order("updated_at", { ascending: false }).limit(500),
    db.from("sites").select("id, name"),
  ]);
  const siteName = (id: string) => (sites ?? []).find((s) => s.id === id)?.name ?? "—";
  return [
    ...(items ?? []).map((i) => ({ id: `ci:${i.id}`, site: siteName(i.site_id), title: i.title, stage: "writing" as const, started_at: i.created_at })),
    ...(arts ?? []).map((a) => ({
      id: `a:${a.id}`,
      site: siteName(a.site_id),
      title: a.title,
      stage: a.status === "failed" ? ("failed" as const) : ("review" as const),
      started_at: a.updated_at,
      error: null,
    })),
  ];
}

export async function listModerationLinks(): Promise<ModerationLink[]> {
  if (isDemo) return ademo.demoModerationLinks;
  const { db } = await adminDb();
  const [{ data: links }, { data: sites }] = await Promise.all([
    db.from("backlink_links").select("*").order("created_at", { ascending: false }).limit(2000),
    db.from("sites").select("id, url"),
  ]);
  const dom = (id: string) => host((sites ?? []).find((s) => s.id === id)?.url ?? "—");
  return (links ?? []).map((l) => ({
    id: l.id,
    source_domain: dom(l.source_site_id),
    target_domain: dom(l.target_site_id),
    source_article_url: l.source_article_url,
    target_url: l.target_url,
    anchor: l.anchor,
    domain_rating: l.domain_rating,
    status: l.status,
    created_at: l.created_at,
  }));
}

export async function listLeads(): Promise<Lead[]> {
  if (isDemo) return demo.leads;
  const { db } = await adminDb();
  const { data } = await db.from("leads").select("*").order("created_at", { ascending: false }).limit(5000);
  return (data ?? []) as Lead[];
}

export async function listCaseStudies(): Promise<CaseStudy[]> {
  if (isDemo) return demo.caseStudies;
  const { db } = await adminDb();
  const { data } = await db.from("case_studies").select("*").order("created_at", { ascending: false });
  return (data ?? []) as CaseStudy[];
}

export async function getCaseStudy(id: string): Promise<CaseStudy | null> {
  return (await listCaseStudies()).find((c) => c.id === id) ?? null;
}

export async function listProductUpdates(): Promise<ProductUpdate[]> {
  if (isDemo) return demo.productUpdates;
  const { db } = await adminDb();
  const { data } = await db.from("product_updates").select("*").order("published_at", { ascending: false });
  return (data ?? []) as ProductUpdate[];
}

export async function getProductUpdate(id: string): Promise<ProductUpdate | null> {
  return (await listProductUpdates()).find((c) => c.id === id) ?? null;
}

/* ───────── Resumen ───────── */

export async function getOverview(): Promise<Overview> {
  const [users, subs, plans, queue] = await Promise.all([listAdminUsers(), listAdminSubscriptions(), listAdminPlans(), listQueue()]);
  const t = now();
  const live = subs.filter((s) => s.status !== "canceled");
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id;
  const mix = new Map<string, number>();
  live.forEach((s) => mix.set(planName(s.plan_id), (mix.get(planName(s.plan_id)) ?? 0) + 1));

  let publishedThisMonth: number;
  let mrrHistory: Overview["mrrHistory"];
  if (isDemo) {
    publishedThisMonth = 214;
    mrrHistory = demo.mrrHistory;
  } else {
    const { db } = await adminDb();
    const monthStart = new Date(t.getFullYear(), t.getMonth(), 1).toISOString();
    const { count } = await db.from("articles").select("id", { count: "exact", head: true }).eq("status", "published").gte("published_at", monthStart);
    publishedThisMonth = count ?? 0;
    // Aproximación: sin fecha de cancelación, cuenta las suscripciones vivas creadas antes de cada cierre de mes.
    const b = await loadBase();
    mrrHistory = Array.from({ length: 12 }, (_, i) => {
      const end = new Date(t.getFullYear(), t.getMonth() - 10 + i, 1);
      const total = b.subs
        .filter((s) => s.status !== "canceled" && s.status !== "trialing" && new Date(s.created_at) < end)
        .reduce((acc, s) => {
          const p = b.plans.find((x) => x.id === s.plan_id);
          return acc + (p ? mrrFor(p, s.interval) : 0);
        }, 0);
      return { month: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(end.getTime() - DAY)), mrr: Math.round(total / 100) };
    });
  }

  return {
    mrr: subs.reduce((acc, s) => acc + s.mrr_eur, 0),
    activeSubs: subs.filter((s) => s.status === "active").length,
    trials: subs.filter((s) => s.status === "trialing").length,
    churnPct: subs.length ? Math.round((subs.filter((s) => s.status === "canceled").length / subs.length) * 1000) / 10 : 0,
    newSignups: users.filter((u) => t.getTime() - new Date(u.created_at).getTime() < 30 * DAY).length,
    publishedThisMonth,
    mrrHistory,
    planMix: [...mix].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    recentSignups: [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6),
    failedJobs: queue.filter((q) => q.stage === "failed"),
  };
}

/** Coste interno de APIs de IA del mes en curso, por sitio / empresa. */
export async function getAiCostOverview(): Promise<AiCostOverview> {
  const t = now();
  const monthStart = new Date(t.getFullYear(), t.getMonth(), 1).toISOString();
  const month_label = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(t);

  if (isDemo) {
    const sites: AiCostSiteRow[] = [
      {
        site_id: "s_tierrafina",
        site_name: "Tierrafina",
        workspace_id: "w1",
        workspace_name: "Tierrafina SL",
        owner_email: "demo@yeswecontent.com",
        calls: 48,
        input_tokens: 920_000,
        output_tokens: 410_000,
        cost_usd: 8.92,
        by_purpose: [
          { purpose: "article", cost_usd: 6.4, calls: 12 },
          { purpose: "visibility", cost_usd: 1.2, calls: 24 },
          { purpose: "specialist", cost_usd: 1.32, calls: 12 },
        ],
      },
      {
        site_id: "s_ywc",
        site_name: "yeswecontent",
        workspace_id: "w_ywc",
        workspace_name: "yeswecontent (dogfood)",
        owner_email: "hola@yeswecontent.com",
        calls: 22,
        input_tokens: 380_000,
        output_tokens: 160_000,
        cost_usd: 3.41,
        by_purpose: [
          { purpose: "article", cost_usd: 2.5, calls: 6 },
          { purpose: "plan", cost_usd: 0.91, calls: 2 },
        ],
      },
    ];
    const total_usd = sites.reduce((a, s) => a + s.cost_usd, 0);
    return {
      month_label,
      total_usd,
      total_eur: usdToEur(total_usd),
      total_calls: sites.reduce((a, s) => a + s.calls, 0),
      sites,
      by_provider: [
        { provider: "anthropic", cost_usd: total_usd * 0.85, calls: 55 },
        { provider: "openai", cost_usd: total_usd * 0.15, calls: 15 },
      ],
    };
  }

  const { db } = await adminDb();
  const { data: events, error } = await db
    .from("ai_usage_events")
    .select("site_id, workspace_id, provider, purpose, input_tokens, output_tokens, cost_usd")
    .gte("created_at", monthStart)
    .limit(20_000);
  if (error) {
    console.warn("[ai_usage overview]", error.message);
    return { month_label, total_usd: 0, total_eur: 0, total_calls: 0, sites: [], by_provider: [] };
  }

  const rows = events ?? [];
  const siteIds = [...new Set(rows.map((e) => e.site_id).filter(Boolean))] as string[];
  const wsIds = [...new Set(rows.map((e) => e.workspace_id).filter(Boolean))] as string[];
  const [{ data: sites }, { data: workspaces }, { data: profiles }] = await Promise.all([
    siteIds.length ? db.from("sites").select("id, name, workspace_id").in("id", siteIds) : Promise.resolve({ data: [] }),
    wsIds.length ? db.from("workspaces").select("id, name, owner_id").in("id", wsIds) : Promise.resolve({ data: [] }),
    db.from("profiles").select("id, email").limit(5000),
  ]);
  const siteMap = new Map((sites ?? []).map((s) => [s.id, s]));
  const wsMap = new Map((workspaces ?? []).map((w) => [w.id, w]));
  const emailByOwner = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  type Acc = AiCostSiteRow & { purposeMap: Map<string, { cost_usd: number; calls: number }> };
  const bySite = new Map<string, Acc>();
  const providerMap = new Map<string, { cost_usd: number; calls: number }>();

  for (const e of rows) {
    const key = e.site_id ?? e.workspace_id ?? "_none";
    const site = e.site_id ? siteMap.get(e.site_id) : undefined;
    const wsId = e.workspace_id ?? site?.workspace_id ?? null;
    const ws = wsId ? wsMap.get(wsId) : undefined;
    let acc = bySite.get(key);
    if (!acc) {
      acc = {
        site_id: e.site_id,
        site_name: site?.name ?? (e.site_id ? "Sitio eliminado" : "Sin sitio"),
        workspace_id: wsId,
        workspace_name: ws?.name ?? "—",
        owner_email: ws ? (emailByOwner.get(ws.owner_id) ?? null) : null,
        calls: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        by_purpose: [],
        purposeMap: new Map(),
      };
      bySite.set(key, acc);
    }
    const cost = Number(e.cost_usd) || 0;
    acc.calls += 1;
    acc.input_tokens += e.input_tokens ?? 0;
    acc.output_tokens += e.output_tokens ?? 0;
    acc.cost_usd += cost;
    const p = acc.purposeMap.get(e.purpose) ?? { cost_usd: 0, calls: 0 };
    p.cost_usd += cost;
    p.calls += 1;
    acc.purposeMap.set(e.purpose, p);

    const pr = providerMap.get(e.provider) ?? { cost_usd: 0, calls: 0 };
    pr.cost_usd += cost;
    pr.calls += 1;
    providerMap.set(e.provider, pr);
  }

  const siteRows = [...bySite.values()]
    .map(({ purposeMap, ...rest }) => ({
      ...rest,
      by_purpose: [...purposeMap.entries()]
        .map(([purpose, v]) => ({ purpose, ...v }))
        .sort((a, b) => b.cost_usd - a.cost_usd),
    }))
    .sort((a, b) => b.cost_usd - a.cost_usd);

  const total_usd = siteRows.reduce((a, s) => a + s.cost_usd, 0);
  return {
    month_label,
    total_usd,
    total_eur: usdToEur(total_usd),
    total_calls: siteRows.reduce((a, s) => a + s.calls, 0),
    sites: siteRows,
    by_provider: [...providerMap.entries()]
      .map(([provider, v]) => ({ provider, ...v }))
      .sort((a, b) => b.cost_usd - a.cost_usd),
  };
}
