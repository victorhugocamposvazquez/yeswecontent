/**
 * Webhooks de revalidación para webs hechas con frameworks (Next.js, Nuxt, Astro,
 * SvelteKit, Gatsby, Hugo…). Al publicar, enviamos un POST firmado para que la
 * web del cliente invalide su caché (revalidateTag/revalidatePath) o lance un build.
 *
 * Firma (misma convención que el webhook genérico de publicación):
 *   X-YWC-Signature: t=<unix>,v1=<hex>
 *   hex = HMAC-SHA256(secret, `${t}.${rawBody}`)
 * Rechaza en destino si |now - t| > 300 s.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isDemo } from "@/lib/env";
import { isPublicHttpUrl } from "@/lib/panel/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { openSecret } from "./secrets";

export type Framework = "nextjs" | "nuxt" | "astro" | "sveltekit" | "gatsby" | "hugo" | "remix" | "laravel" | "static" | "other";

export interface FrameworkWebhookConfig {
  url: string;
  secret: string;
  framework?: Framework;
  /** Ruta del blog en la web del cliente, p. ej. "/blog". */
  base_path?: string;
  /** Rutas extra a revalidar (home, categorías…). */
  extra_paths?: string[];
}

export type FrameworkEvent = "article.published" | "article.updated" | "article.unpublished" | "ping";

export interface NotifiableArticle {
  id: string;
  site_id?: string;
  slug: string;
  title: string;
  language?: string;
  published_url?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  tags?: string[] | null;
}

export interface NotifyResult { ok: boolean; status: number | null; error?: string; attempts: number }

export const INTEGRATION_PROVIDER = "framework_webhook";

export const signFrameworkPayload = (secret: string, timestamp: string, body: string) => createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

/** Verificación (útil en tests y como referencia para los snippets de la documentación). */
export function verifyFrameworkSignature(secret: string, header: string | null, body: string, toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec || !parts.v1) return false;
  const expected = signFrameworkPayload(secret, String(parts.t), body);
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

/** Etiquetas y rutas sugeridas para revalidar en la web del cliente. */
export function revalidationTargets(a: Pick<NotifiableArticle, "slug" | "language" | "tags">, c: Pick<FrameworkWebhookConfig, "base_path" | "extra_paths">) {
  const base = `/${(c.base_path ?? "/blog").replace(/^\/+|\/+$/g, "")}`.replace(/^\/$/, "");
  return {
    tags: ["ywc-articles", `ywc-article-${a.slug}`, ...(a.tags ?? []).map((t) => `ywc-tag-${t}`)],
    paths: Array.from(new Set([base || "/", `${base}/${a.slug}`, ...(c.extra_paths ?? [])])),
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Envía el evento firmado. Reintenta 2 veces ante 5xx/errores de red (0,5 s y 2 s).
 * Nunca lanza: devuelve { ok, status, error }.
 */
export async function notifyFrameworkSite(article: NotifiableArticle, config: FrameworkWebhookConfig, event: FrameworkEvent = "article.published"): Promise<NotifyResult> {
  if (!config?.url || !config.secret) return { ok: false, status: null, error: "Webhook de revalidación sin configurar.", attempts: 0 };
  if (!isPublicHttpUrl(config.url) || !/^https:\/\//i.test(config.url)) return { ok: false, status: null, error: "La URL del webhook debe ser pública y usar https.", attempts: 0 };

  const body = JSON.stringify({
    event,
    framework: config.framework ?? "other",
    site_id: article.site_id ?? null,
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      language: article.language ?? null,
      url: article.published_url ?? null,
      published_at: article.published_at ?? null,
      updated_at: article.updated_at ?? null,
      tags: article.tags ?? [],
    },
    revalidate: revalidationTargets(article, config),
    sent_at: new Date().toISOString(),
  });

  if (isDemo) return { ok: true, status: 200, attempts: 0 };

  let last: NotifyResult = { ok: false, status: null, attempts: 0 };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const t = Math.floor(Date.now() / 1000).toString();
    try {
      const res = await fetch(config.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-ywc-signature": `t=${t},v1=${signFrameworkPayload(config.secret, t, body)}`,
          "x-ywc-event": event,
          "user-agent": "yeswecontent-revalidate/1.0",
        },
        body,
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return { ok: true, status: res.status, attempts: attempt };
      const text = await res.text().catch(() => "");
      last = { ok: false, status: res.status, error: `${res.status} ${text.slice(0, 200)}`.trim(), attempts: attempt };
      if (res.status < 500 && res.status !== 429) return last;
    } catch (e) {
      last = { ok: false, status: null, error: e instanceof Error ? e.message : String(e), attempts: attempt };
    }
    if (attempt < 3) await wait(attempt === 1 ? 500 : 2000);
  }
  return last;
}

/** Configuración guardada en `integrations` (provider = "framework_webhook"). */
export async function loadFrameworkWebhook(siteId: string): Promise<FrameworkWebhookConfig | null> {
  if (isDemo) return null;
  const sb = createServiceClient();
  const { data } = await sb.from("integrations").select("config, status").eq("site_id", siteId).eq("provider", INTEGRATION_PROVIDER).maybeSingle();
  if (!data || data.status !== "connected") return null;
  const c = data.config as FrameworkWebhookConfig | null;
  return c?.url && c.secret ? { ...c, secret: openSecret(c.secret) } : null;
}

/** Atajo para el pipeline de publicación: carga la config del sitio y avisa si existe. */
export async function notifyFrameworkSiteForArticle(siteId: string, article: NotifiableArticle, event: FrameworkEvent = "article.published"): Promise<NotifyResult | null> {
  const config = await loadFrameworkWebhook(siteId);
  if (!config) return null;
  return notifyFrameworkSite({ ...article, site_id: siteId }, config, event);
}
