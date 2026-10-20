/**
 * Capa de datos. En modo demo devuelve los datos de ejemplo; con Supabase
 * configurado consulta la base de datos respetando RLS.
 */
import "server-only";
import { cookies } from "next/headers";
import { isDemo } from "./env";
import * as demo from "./demo";
import { createClient } from "./supabase/server";
import type { AiCheck, AiPrompt, Article, Audit, ContentItem, Plan, Profile, Site, SocialPost, Subscription } from "./types";

export async function getProfile(): Promise<Profile | null> {
  if (isDemo) return demo.demoProfile;
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("profiles").select("*").eq("id", auth.user.id).single();
  return data;
}

export async function listSites(): Promise<Site[]> {
  if (isDemo) return demo.demoSites;
  const sb = await createClient();
  const { data } = await sb.from("sites").select("*").order("created_at");
  return data ?? [];
}

/** Sitio activo: cookie `ywc_site` o el primero. */
export async function getCurrentSite(): Promise<Site | null> {
  const sites = await listSites();
  const chosen = (await cookies()).get("ywc_site")?.value;
  return sites.find((s) => s.id === chosen) ?? sites[0] ?? null;
}

export async function getSubscription(siteId: string): Promise<Subscription | null> {
  if (isDemo) return { ...demo.demoSubscription, site_id: siteId };
  const sb = await createClient();
  const { data } = await sb.from("subscriptions").select("*").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function listPlans(): Promise<Plan[]> {
  if (isDemo) return demo.plans;
  const sb = await createClient();
  const { data } = await sb.from("plans").select("*").eq("active", true).order("sort");
  return (data ?? []).filter((p) => p.monthly_price_eur > 0);
}

export async function listContentItems(siteId: string): Promise<ContentItem[]> {
  if (isDemo) return demo.contentItems;
  const sb = await createClient();
  const { data } = await sb.from("content_items").select("*").eq("site_id", siteId).order("scheduled_for");
  return data ?? [];
}

export async function listArticles(siteId: string): Promise<Article[]> {
  if (isDemo) return demo.articles;
  const sb = await createClient();
  const { data } = await sb.from("articles").select("*").eq("site_id", siteId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getArticle(id: string): Promise<Article | null> {
  if (isDemo) return demo.articles.find((a) => a.id === id) ?? null;
  const sb = await createClient();
  const { data } = await sb.from("articles").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getVisibility(siteId: string): Promise<{ prompts: AiPrompt[]; checks: AiCheck[] }> {
  if (isDemo) return { prompts: demo.aiPrompts, checks: demo.aiChecks };
  const sb = await createClient();
  const { data: prompts } = await sb.from("ai_prompts").select("*").eq("site_id", siteId);
  const ids = (prompts ?? []).map((p) => p.id);
  const { data: checks } = ids.length
    ? await sb.from("ai_checks").select("*").in("prompt_id", ids).order("checked_at", { ascending: false }).limit(500)
    : { data: [] };
  return { prompts: prompts ?? [], checks: checks ?? [] };
}

export async function getLatestAudit(siteId: string): Promise<Audit | null> {
  if (isDemo) return demo.demoAudit;
  const sb = await createClient();
  const { data } = await sb.from("audits").select("*").eq("site_id", siteId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function getAuditByToken(token: string): Promise<Audit | null> {
  if (isDemo) return token === demo.demoAudit.share_token ? demo.demoAudit : null;
  const sb = await createClient();
  const { data } = await sb.from("audits").select("*").eq("share_token", token).maybeSingle();
  return data;
}

export async function listSocialPosts(siteId: string): Promise<SocialPost[]> {
  if (isDemo) return demo.socialPosts;
  const sb = await createClient();
  const { data } = await sb.from("social_posts").select("*").eq("site_id", siteId).order("created_at", { ascending: false });
  return data ?? [];
}
