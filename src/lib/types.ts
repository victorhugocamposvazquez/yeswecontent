export type Role = "user" | "admin";
export type ArticleStatus = "draft" | "review" | "scheduled" | "published" | "failed";
export type ContentStatus = "planned" | "writing" | "review" | "scheduled" | "published" | "skipped";
export type AiModel = "chatgpt" | "claude" | "gemini" | "perplexity";
export type Channel = "reddit" | "quora" | "instagram" | "facebook";

export interface Profile { id: string; email: string; full_name: string | null; role: Role; created_at: string }

export interface Plan {
  id: string;
  name: string;
  monthly_price_eur: number; // céntimos
  yearly_price_eur: number; // céntimos/mes en pago anual
  articles_per_month: number;
  tracked_prompts: number;
  languages: number;
  seats: number | null;
  social_cadence: "weekly" | "daily";
  backlink_credits: number;
  features: string[];
  active: boolean;
  sort: number;
}

export interface Site {
  id: string;
  workspace_id: string;
  url: string;
  name: string;
  language: string;
  extra_languages: string[];
  niche: string | null;
  audience: string | null;
  description: string | null;
  brand_voice: { tone?: string; person?: string; avoid?: string[]; examples?: string[] };
  seo_settings: { min_words?: number; internal_links?: number; faq?: boolean; schema?: boolean };
  visual_style: { style?: string; palette?: string };
  schedule: { days: string[]; time: string; mode: "drip" | "batch" };
  onboarding_step: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  site_id: string;
  plan_id: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  interval: "month" | "year";
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export interface ContentItem {
  id: string;
  site_id: string;
  title: string;
  keyword: string;
  cluster: string | null;
  intent: "informational" | "commercial" | "transactional" | "navigational" | null;
  search_volume: number | null;
  difficulty: number | null;
  language: string;
  scheduled_for: string | null;
  status: ContentStatus;
  kind: "new" | "refresh";
}

export interface Article {
  id: string;
  site_id: string;
  content_item_id: string | null;
  title: string;
  slug: string;
  meta_description: string | null;
  body_md: string;
  faq: { q: string; a: string }[];
  cover_url: string | null;
  language: string;
  word_count: number;
  quality_score: number | null;
  quality_breakdown: Record<string, number> | null;
  status: ArticleStatus;
  published_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiPrompt { id: string; site_id: string; prompt: string; active: boolean }
export interface AiCheck {
  id: string;
  prompt_id: string;
  model: AiModel;
  mentioned: boolean;
  position: number | null;
  cited_urls: string[];
  competitors_mentioned: string[];
  answer_excerpt: string | null;
  checked_at: string;
}

export interface AuditCheck { id: string; label: string; status: "pass" | "warn" | "fail"; detail: string; group: string }
export interface Audit { id: string; site_id: string | null; url: string; score: number | null; results: AuditCheck[]; share_token: string; created_at: string }

export interface BacklinkLink {
  id: string;
  direction: "received" | "given";
  partner_domain: string;
  source_article_url: string | null;
  target_url: string;
  anchor: string;
  domain_rating: number | null;
  status: "pending" | "live" | "rejected" | "removed";
  created_at: string;
}

export interface SocialPost {
  id: string;
  site_id: string;
  article_id: string | null;
  channel: Channel;
  kind: "post" | "reply" | "carousel";
  thread_url: string | null;
  content: string;
  slides: string[] | null;
  status: "suggested" | "approved" | "scheduled" | "published" | "dismissed";
  scheduled_for: string | null;
  created_at: string;
}

export interface Integration { id: string; site_id: string; provider: string; status: string; created_at: string }
export interface Lead { id: string; email: string | null; url: string | null; tool: string; created_at: string }
export interface CaseStudy {
  id: string;
  slug: string;
  company: string;
  sector: string | null;
  summary: string;
  body_md: string;
  metric_before: number | null;
  metric_after: number | null;
  metric_label: string | null;
  published: boolean;
}
export interface ProductUpdate { id: string; title: string; body_md: string; tag: string | null; published_at: string }
export interface TrafficPoint { date: string; clicks: number; impressions: number; ai_visits: number }

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  workspace: string;
  sites: number;
  plan_id: string | null;
  status: Subscription["status"] | null;
  mrr_eur: number;
  created_at: string;
}
