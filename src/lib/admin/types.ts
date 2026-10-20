import type { AdminUserRow, CaseStudy, Plan, ProductUpdate, Role, Subscription } from "@/lib/types";

/** Resultado estándar de una server action del admin. */
export type ActionResult = { ok: boolean; message: string } | null;

export interface AdminPlan extends Plan {
  stripe_price_monthly: string | null;
  stripe_price_yearly: string | null;
}

export interface VolumeTier {
  from: number;
  to: number | null;
  pct: number;
}

export interface AppSettings {
  ai_provider: "claude" | "openai" | "gemini";
  ai_model: string;
  generation_enabled: boolean;
  maintenance_banner: string;
}

export interface AdminSiteRow {
  id: string;
  name: string;
  url: string;
  workspace: string;
  owner_email: string | null;
  plan_id: string | null;
  status: Subscription["status"] | null;
  articles: number;
  last_published_at: string | null;
  integrations: { provider: string; status: string }[];
  health: "ok" | "warn" | "bad";
  created_at: string;
}

export interface AdminSubscriptionRow {
  id: string;
  site_id: string;
  site_name: string;
  workspace: string;
  email: string | null;
  plan_id: string;
  status: Subscription["status"];
  interval: Subscription["interval"];
  mrr_eur: number; // céntimos
  trial_ends_at: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

export type QueueStage = "planned" | "writing" | "images" | "review" | "publishing" | "failed";

export interface QueueJob {
  id: string;
  site: string;
  title: string;
  stage: QueueStage;
  started_at: string;
  error?: string | null;
}

export interface ModerationLink {
  id: string;
  source_domain: string;
  target_domain: string;
  source_article_url: string | null;
  target_url: string;
  anchor: string;
  domain_rating: number | null;
  status: "pending" | "live" | "rejected" | "removed";
  created_at: string;
}

export interface UserDetail {
  user: AdminUserRow & { role: Role };
  workspace: { id: string; name: string; kind: "business" | "agency"; created_at: string } | null;
  sites: AdminSiteRow[];
  subscriptions: AdminSubscriptionRow[];
  usage: { label: string; used: number; limit: number | null }[];
}

export interface Overview {
  mrr: number; // céntimos
  activeSubs: number;
  trials: number;
  churnPct: number;
  newSignups: number;
  publishedThisMonth: number;
  mrrHistory: { month: string; mrr: number }[]; // euros
  planMix: { label: string; value: number }[];
  recentSignups: AdminUserRow[];
  failedJobs: QueueJob[];
}

export type { CaseStudy, ProductUpdate };
