import "server-only";
import { isDemo } from "@/lib/env";
import { getHostedBlog, type HostedBlogConfig } from "@/lib/headless/content";
import { DEMO_API_KEY, DEMO_PUBLIC_KEY, type ApiKeyRow } from "@/lib/headless/keys";
import type { FrameworkWebhookConfig } from "@/lib/headless/webhook";
import type { GithubConfig } from "@/lib/publish/github";
import { createClient } from "@/lib/supabase/server";

const iso = (days: number) => new Date(Date.parse("2026-10-20T09:00:00Z") + days * 86_400_000).toISOString();

export async function listApiKeys(siteId: string): Promise<ApiKeyRow[]> {
  if (isDemo)
    return [
      { id: "k_demo_live", site_id: siteId, name: "Web en producción (Next.js)", kind: "secret", prefix: DEMO_API_KEY.slice(0, 13), allowed_origins: [], last_used_at: iso(-0.1), revoked_at: null, created_at: iso(-21) },
      { id: "k_demo_pub", site_id: siteId, name: "Widget del blog", kind: "public", prefix: DEMO_PUBLIC_KEY.slice(0, 12), allowed_origins: ["https://tierrafina.es"], last_used_at: null, revoked_at: null, created_at: iso(-4) },
    ];
  const sb = await createClient();
  const { data } = await sb
    .from("api_keys")
    .select("id, site_id, name, kind, prefix, allowed_origins, last_used_at, revoked_at, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ApiKeyRow[];
}

/** Configuración de una integración sin secretos (los tokens nunca viajan al navegador). */
export async function getIntegrationConfig<T>(siteId: string, provider: string): Promise<{ status: string; config: Partial<T> } | null> {
  if (isDemo) return null;
  const sb = await createClient();
  const { data } = await sb.from("integrations").select("status, config").eq("site_id", siteId).eq("provider", provider).maybeSingle();
  return data ? { status: data.status, config: (data.config ?? {}) as Partial<T> } : null;
}

export type PublicGithub = Omit<Partial<GithubConfig>, "token"> & { has_token: boolean };
export type PublicWebhook = Omit<Partial<FrameworkWebhookConfig>, "secret"> & { has_secret: boolean };

export async function getGithub(siteId: string): Promise<PublicGithub | null> {
  const row = await getIntegrationConfig<GithubConfig>(siteId, "github");
  if (!row) return null;
  const { token, ...rest } = row.config;
  return { ...rest, has_token: !!token };
}

export async function getFrameworkWebhook(siteId: string): Promise<PublicWebhook | null> {
  const row = await getIntegrationConfig<FrameworkWebhookConfig>(siteId, "framework_webhook");
  if (!row) return null;
  const { secret, ...rest } = row.config;
  return { ...rest, has_secret: !!secret };
}

export async function getHostedBlogForPanel(siteId: string): Promise<HostedBlogConfig | null> {
  if (isDemo) return getHostedBlog(siteId);
  const sb = await createClient();
  const { data } = await sb.from("hosted_blogs").select("site_id, enabled, delivery_mode, slug, custom_domain, public_base_url, title, tagline, theme, verified_at").eq("site_id", siteId).maybeSingle();
  return (data as HostedBlogConfig | null) ?? null;
}
