"use server";

import { cookies } from "next/headers";
import { isDemo } from "@/lib/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { OnboardingState } from "./types";

type Result = { ok: true; siteId: string | null } | { ok: false; error: string };

const domainOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};
const normUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`);

/**
 * Guarda un paso del onboarding. En modo demo no persiste nada.
 * Con Supabase crea el sitio en el primer paso y lo va completando.
 */
export async function saveOnboardingStep(step: string, s: OnboardingState, siteId: string | null): Promise<Result> {
  if (isDemo) return { ok: true, siteId };
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return { ok: false, error: "Tu sesión ha caducado. Vuelve a entrar." };

  const { data: member } = await sb.from("workspace_members").select("workspace_id").eq("user_id", auth.user.id).in("role", ["owner", "editor"]).limit(1).maybeSingle();
  if (!member) return { ok: false, error: "No encontramos tu espacio de trabajo." };
  const workspaceId = member.workspace_id as string;

  const updateSite = async (patch: Record<string, unknown>) => {
    if (!siteId) return { ok: false as const, error: "Primero indica tu web." };
    const { error } = await sb.from("sites").update({ ...patch, onboarding_step: step }).eq("id", siteId);
    return error ? { ok: false as const, error: error.message } : { ok: true as const, siteId };
  };
  const updateWorkspace = async (patch: Record<string, unknown>) => {
    const { data: ws } = await sb.from("workspaces").select("white_label").eq("id", workspaceId).maybeSingle();
    const { white_label, ...rest } = patch as { white_label?: Record<string, unknown> };
    const { error } = await sb
      .from("workspaces")
      .update({ ...rest, ...(white_label ? { white_label: { ...((ws?.white_label as object) ?? {}), ...white_label } } : {}) })
      .eq("id", workspaceId);
    return error ? { ok: false as const, error: error.message } : { ok: true as const, siteId };
  };

  switch (step) {
    case "web": {
      if (!s.url.trim()) return { ok: false, error: "Indica la dirección de tu web." };
      const url = normUrl(s.url);
      if (s.kind === "agency") await updateWorkspace({ kind: "agency" });
      if (siteId) return updateSite({ url });
      const { data, error } = await sb
        .from("sites")
        .insert({ workspace_id: workspaceId, url, name: s.name || domainOf(url), onboarding_step: "web" })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, siteId: data.id as string };
    }
    case "negocio":
      return updateSite({ name: s.name || domainOf(normUrl(s.url)), niche: s.niche, audience: s.audience, description: s.description });
    case "idioma":
      return updateSite({ language: s.language, extra_languages: s.extra_languages });
    case "voz":
      return updateSite({ brand_voice: { tone: s.tone, person: s.person, avoid: s.avoid.split(",").map((x) => x.trim()).filter(Boolean), examples: s.sample.trim() ? [s.sample.trim()] : [] } });
    case "competidores": {
      if (!siteId) return { ok: false, error: "Primero indica tu web." };
      await sb.from("competitors").delete().eq("site_id", siteId);
      if (s.competitors.length) {
        const { error } = await sb.from("competitors").insert(s.competitors.map((c) => ({ site_id: siteId, url: normUrl(c.url), name: c.name || domainOf(normUrl(c.url)) })));
        if (error) return { ok: false, error: error.message };
      }
      return updateSite({});
    }
    case "seo":
      return updateSite({
        seo_settings: { min_words: s.min_words, internal_links: s.internal_links, faq: s.faq, schema: s.schema },
        schedule: { days: s.days, time: s.time, mode: s.mode },
      });
    case "conectar": {
      if (siteId && s.gsc) await sb.from("integrations").upsert({ site_id: siteId, provider: "gsc", status: "pending", config: {} }, { onConflict: "site_id,provider" });
      // TODO: flujo OAuth real de Search Console y alta del CMS elegido (s.cms).
      return updateSite({});
    }
    case "plan": {
      // Solo se llama cuando Stripe no devolvió URL (sin Stripe configurado): abrimos una prueba de 3 días.
      if (!siteId) return { ok: false, error: "Primero indica tu web." };
      const db = createServiceClient();
      const { data: existing } = await db.from("subscriptions").select("id").eq("site_id", siteId).limit(1).maybeSingle();
      if (!existing) {
        const { error } = await db.from("subscriptions").insert({
          site_id: siteId,
          plan_id: s.planId,
          status: "trialing",
          interval: s.interval,
          trial_ends_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
        });
        if (error) return { ok: false, error: error.message };
      }
      return updateSite({});
    }
    case "agencia":
      return updateWorkspace({ name: s.agency.brand || undefined, kind: "agency", white_label: { brand_name: s.agency.brand, logo_url: s.agency.logo_url, primary_color: s.agency.color } });
    case "equipo":
      // TODO: crear invitaciones y enviarlas con Resend (s.agency.invites).
      return { ok: true, siteId };
    case "dominio":
      return updateWorkspace({ white_label: { custom_domain: s.agency.domain } });
    case "llamada":
      // TODO: guardar la franja elegida / integrar con el calendario comercial.
      return { ok: true, siteId };
    case "encuesta":
      // TODO: guardar la respuesta en una tabla de analítica de adquisición.
      return updateSite({});
    default:
      return { ok: true, siteId };
  }
}

/** Cierra el onboarding: marca el sitio como listo y lo deja activo en el panel. */
export async function finishOnboarding(siteId: string | null): Promise<void> {
  if (!siteId) return;
  (await cookies()).set("ywc_site", siteId, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  if (isDemo) return;
  const sb = await createClient();
  await sb.from("sites").update({ onboarding_step: "done" }).eq("id", siteId);
}
