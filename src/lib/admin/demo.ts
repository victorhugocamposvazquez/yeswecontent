/** Datos de ejemplo adicionales para el panel de administración (modo demo). */
import { adminUsers, backlinks, generationQueue, plans, volumeDiscounts } from "@/lib/demo";
import type { AdminPlan, AdminSiteRow, AdminSubscriptionRow, AppSettings, ModerationLink, QueueJob, VolumeTier } from "./types";
import { mrrFor } from "./mrr";

const day = 86_400_000;
const today = new Date("2026-10-20T09:00:00Z").getTime();
const iso = (offsetDays: number) => new Date(today + offsetDays * day).toISOString();

export const demoAdminPlans: AdminPlan[] = [
  ...plans.map((p) => ({ ...p, stripe_price_monthly: `price_${p.id}_mensual`, stripe_price_yearly: null })),
  {
    id: "agencia",
    name: "Agencia",
    monthly_price_eur: 0,
    yearly_price_eur: 0,
    articles_per_month: 0,
    tracked_prompts: 0,
    languages: 0,
    seats: null,
    social_cadence: "daily",
    backlink_credits: 0,
    features: ["Marca blanca", "Portal para tus clientes", "Precio por volumen"],
    active: true,
    sort: 3,
    stripe_price_monthly: null,
    stripe_price_yearly: null,
  },
];

export const demoVolumeTiers: VolumeTier[] = volumeDiscounts.map((t) => ({ ...t }));

export const demoSettings: AppSettings = {
  ai_provider: "claude",
  ai_model: "",
  generation_enabled: true,
  maintenance_banner: "",
};

export const demoBannedDomains = ["granjadeenlaces.xyz", "seo-barato.top"];

const health = (i: AdminSiteRow["integrations"]): AdminSiteRow["health"] =>
  i.some((x) => x.status !== "connected") ? "bad" : i.length < 2 ? "warn" : "ok";

const site = (
  id: string,
  name: string,
  url: string,
  userId: string,
  articles: number,
  lastPub: number | null,
  integrations: AdminSiteRow["integrations"],
  created: number,
  overrides: Partial<AdminSiteRow> = {},
): AdminSiteRow => {
  const u = adminUsers.find((x) => x.id === userId)!;
  return {
    id,
    name,
    url,
    workspace: u.workspace,
    owner_email: u.email,
    plan_id: u.plan_id,
    status: u.status,
    articles,
    last_published_at: lastPub === null ? null : iso(lastPub),
    integrations,
    health: health(integrations),
    created_at: iso(created),
    ...overrides,
  };
};

const wp = { provider: "wordpress", status: "connected" };
const gsc = { provider: "gsc", status: "connected" };
const ga4 = { provider: "ga4", status: "connected" };

export const demoAdminSites: AdminSiteRow[] = [
  site("s_tierrafina", "Tierrafina", "https://tierrafina.es", "u_demo", 48, -2, [wp, gsc, ga4], -64),
  site("s_huerto", "Huerto Vertical", "https://huertovertical.com", "u_demo", 21, -5, [{ provider: "shopify", status: "connected" }, gsc], -40),
  site("s_azahar", "Clínica Azahar", "https://clinicaazahar.es", "u2", 77, -1, [wp, gsc], -120),
  site("s_rutas", "Rutas Norte", "https://rutasnorte.com", "u3", 112, -0.5, [{ provider: "webflow", status: "connected" }, gsc, ga4], -95),
  site("s_legal", "LegalClaro", "https://legalclaro.es", "u4", 34, -9, [{ provider: "wordpress", status: "error" }, gsc], -40),
  site("s_nido_1", "Óptica Brisa", "https://opticabrisa.es", "u5", 61, -1, [wp, gsc], -200),
  site("s_nido_2", "Bodegas Lindero", "https://bodegaslindero.com", "u5", 58, -3, [wp], -180),
  site("s_nido_3", "Academia Sintaxis", "https://academiasintaxis.es", "u5", 40, -2, [{ provider: "ghost", status: "connected" }, gsc], -150),
  site("s_pedalea", "Pedalea", "https://pedalea.shop", "u6", 0, null, [{ provider: "shopify", status: "connected" }], -1),
  site("s_yoga", "YogaFlow", "https://yogaflow.es", "u7", 26, -48, [{ provider: "wordpress", status: "disconnected" }], -150),
];

const subInterval: Record<string, AdminSubscriptionRow["interval"]> = { u_demo: "year", u2: "year", u3: "year", u4: "month", u5: "month", u6: "month", u7: "month" };

export const demoAdminSubscriptions: AdminSubscriptionRow[] = demoAdminSites
  .filter((s) => s.plan_id && s.status)
  .map((s, i) => {
    const owner = adminUsers.find((u) => u.email === s.owner_email)!;
    const interval = subInterval[owner.id] ?? "month";
    const plan = demoAdminPlans.find((p) => p.id === s.plan_id);
    const status = s.status!;
    const agencyMrr = owner.id === "u5" ? Math.round(owner.mrr_eur / 18) : null;
    return {
      id: `sub_${s.id}`,
      site_id: s.id,
      site_name: s.name,
      workspace: s.workspace,
      email: s.owner_email,
      plan_id: s.plan_id!,
      status,
      interval,
      mrr_eur: status === "trialing" || status === "canceled" ? 0 : agencyMrr ?? (plan ? mrrFor(plan, interval) : 0),
      trial_ends_at: status === "trialing" ? iso(2) : null,
      current_period_end: status === "canceled" ? iso(-20) : iso(interval === "year" ? 200 - i * 9 : 12 + i),
      stripe_customer_id: `cus_demo${i + 1}`,
      stripe_subscription_id: `sub_demo${i + 1}`,
      created_at: s.created_at,
    };
  });

export const demoQueue: QueueJob[] = [
  ...generationQueue.map((q) => ({
    ...q,
    stage: q.stage as QueueJob["stage"],
    error: q.stage === "failed" ? "El CMS devolvió 401: la contraseña de aplicación de WordPress ha caducado." : null,
  })),
  { id: "q5", site: "Bodegas Lindero", title: "Maridaje de tintos de Ribera con platos de cuchara", stage: "review", started_at: iso(-0.4) },
  { id: "q6", site: "Óptica Brisa", title: "Lentes progresivas: cuánto tardas en adaptarte", stage: "planned", started_at: iso(-0.01) },
  { id: "q7", site: "YogaFlow", title: "Yoga para principiantes en casa: rutina de 20 minutos", stage: "failed", started_at: iso(-1.2), error: "Generación detenida: la suscripción está cancelada." },
];

const host = (u: string) => u.replace(/^https?:\/\//, "").split("/")[0];

export const demoModerationLinks: ModerationLink[] = [
  ...backlinks.map((b) => ({
    id: b.id,
    source_domain: b.direction === "received" ? b.partner_domain : "tierrafina.es",
    target_domain: b.direction === "received" ? "tierrafina.es" : b.partner_domain,
    source_article_url: b.source_article_url,
    target_url: b.target_url,
    anchor: b.anchor,
    domain_rating: b.domain_rating,
    status: b.status,
    created_at: b.created_at,
  })),
  { id: "b7", source_domain: "seo-barato.top", target_domain: host("https://clinicaazahar.es"), source_article_url: "https://seo-barato.top/enlaces-1", target_url: "https://clinicaazahar.es", anchor: "fisioterapia barata", domain_rating: 4, status: "pending", created_at: iso(-0.5) },
  { id: "b8", source_domain: "bodegaslindero.com", target_domain: "rutasnorte.com", source_article_url: "https://bodegaslindero.com/blog/enoturismo-norte", target_url: "https://rutasnorte.com/rutas-vino", anchor: "rutas del vino por el norte", domain_rating: 35, status: "pending", created_at: iso(-0.8) },
];
