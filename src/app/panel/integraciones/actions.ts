"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentSite, getProfile } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { DEMO_API_KEY, DEMO_PUBLIC_KEY, generateApiKey, type ApiKeyKind } from "@/lib/headless/keys";
import { buildHostedBlogRow, type HostedBlogDeliveryMode } from "@/lib/headless/hosted-blog";
import { slugifyBlogName, themeFromChoice, type BlogColorId, type BlogLook } from "@/lib/headless/looks";
import { verifyHostedBlogDns } from "@/lib/headless/hosted-blog-dns";
import { normalizeHost } from "@/lib/headless/hosts";
import { openSecret, sealSecret } from "@/lib/headless/secrets";
import { notifyFrameworkSite, type Framework, type FrameworkWebhookConfig } from "@/lib/headless/webhook";
import { DEMO_NOTE, type ActionState } from "@/lib/panel/action-types";
import { isPublicHttpUrl } from "@/lib/panel/auth";
import { testGithubConnection, type GithubConfig } from "@/lib/publish/github";
import { createClient } from "@/lib/supabase/server";

/** Estado con un valor secreto que se enseña una sola vez (clave de API, secreto del webhook). */
export type RevealState = (NonNullable<ActionState> & { secret?: string }) | null;

const PATH = "/panel/integraciones";
const ok = (message: string, extra: { secret?: string } = {}): RevealState => ({ ok: true, message: isDemo ? `${message} ${DEMO_NOTE}` : message, at: Date.now(), ...extra });
const fail = (message: string): RevealState => ({ ok: false, message, at: Date.now() });
const str = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max);
const FRAMEWORKS: Framework[] = ["nextjs", "nuxt", "astro", "sveltekit", "gatsby", "hugo", "remix", "laravel", "static", "other"];

/* ───────── claves de API ───────── */

export async function createApiKey(_prev: RevealState, fd: FormData): Promise<RevealState> {
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio seleccionado.");
  const name = str(fd, "name", 80) || "Clave sin nombre";
  const kind: ApiKeyKind = str(fd, "kind") === "public" ? "public" : "secret";
  const origins = str(fd, "origins", 1000)
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((o) => {
      try {
        return new URL(o).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
  if (kind === "public" && str(fd, "origins") && !origins.length) return fail("Revisa los orígenes: deben ser URLs completas, p. ej. https://tudominio.com");

  if (isDemo) return ok(`Clave «${name}» creada.`, { secret: kind === "public" ? DEMO_PUBLIC_KEY : DEMO_API_KEY });

  const { key, hash, prefix } = generateApiKey(kind);
  const profile = await getProfile();
  const sb = await createClient();
  const { error } = await sb.from("api_keys").insert({ site_id: site.id, name, kind, prefix, key_hash: hash, allowed_origins: kind === "public" ? origins : [], created_by: profile?.id ?? null });
  if (error) return fail(`No se pudo crear la clave: ${error.message}`);
  revalidatePath(PATH);
  return ok(`Clave «${name}» creada. Cópiala ahora: no volveremos a mostrarla.`, { secret: key });
}

export async function revokeApiKey(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio seleccionado.");
  const id = str(fd, "id", 64);
  if (isDemo) return ok("Clave revocada.");
  const sb = await createClient();
  const { error } = await sb.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("site_id", site.id);
  if (error) return fail(`No se pudo revocar: ${error.message}`);
  revalidatePath(PATH);
  return ok("Clave revocada. Las peticiones con ella devolverán 401 al instante.");
}

/* ───────── webhook de revalidación ───────── */

export async function saveFrameworkWebhook(_prev: RevealState, fd: FormData): Promise<RevealState> {
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio seleccionado.");
  const url = str(fd, "url", 500);
  if (!/^https:\/\//i.test(url) || !isPublicHttpUrl(url)) return fail("La URL debe ser pública y empezar por https://");
  const framework = (FRAMEWORKS.includes(str(fd, "framework") as Framework) ? str(fd, "framework") : "other") as Framework;
  const base_path = `/${str(fd, "base_path", 100).replace(/^\/+|\/+$/g, "")}`;
  const rotate = str(fd, "rotate") === "on";

  if (isDemo) return ok("Webhook guardado.", { secret: "whsec_demo7d1f0c2b9a4e" });

  const sb = await createClient();
  const { data: existing } = await sb.from("integrations").select("config").eq("site_id", site.id).eq("provider", "framework_webhook").maybeSingle();
  const prevSecret = openSecret((existing?.config as FrameworkWebhookConfig | undefined)?.secret) || undefined;
  const secret = !prevSecret || rotate ? `whsec_${randomBytes(24).toString("base64url")}` : prevSecret;
  const config: FrameworkWebhookConfig = { url, secret: sealSecret(secret), framework, base_path: base_path === "/" ? "" : base_path };
  const { error } = await sb.from("integrations").upsert({ site_id: site.id, provider: "framework_webhook", status: "connected", config }, { onConflict: "site_id,provider" });
  if (error) return fail(`No se pudo guardar: ${error.message}`);
  revalidatePath(PATH);
  return secret !== prevSecret
    ? ok("Webhook guardado. Copia el secreto en tu web (YWC_WEBHOOK_SECRET): no volveremos a mostrarlo.", { secret })
    : ok("Webhook guardado.");
}

export async function testFrameworkWebhook(): Promise<ActionState> {
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio seleccionado.");
  if (isDemo) return ok("Evento de prueba enviado: tu web respondió 200.");
  const sb = await createClient();
  const { data } = await sb.from("integrations").select("config").eq("site_id", site.id).eq("provider", "framework_webhook").maybeSingle();
  const config = data?.config as FrameworkWebhookConfig | undefined;
  if (!config?.url) return fail("Guarda primero la URL del webhook.");
  config.secret = openSecret(config.secret);
  const res = await notifyFrameworkSite({ id: "test", site_id: site.id, slug: "prueba-yeswecontent", title: "Evento de prueba", language: site.language, updated_at: new Date().toISOString() }, config, "ping");
  return res.ok ? ok(`Evento de prueba enviado: tu web respondió ${res.status}.`) : fail(`Tu web no aceptó el evento: ${res.error ?? "sin respuesta"}`);
}

/* ───────── GitHub ───────── */

function readGithub(fd: FormData): Omit<GithubConfig, "token"> & { token: string } {
  const repo = str(fd, "repo", 200).replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
  return {
    token: str(fd, "token", 400),
    owner: repo,
    branch: str(fd, "branch", 100) || undefined,
    path_template: str(fd, "path_template", 200) || undefined,
    format: str(fd, "format") === "md" ? "md" : "mdx",
    mode: str(fd, "mode") === "pull_request" ? "pull_request" : "commit",
    public_url_template: str(fd, "public_url_template", 300) || undefined,
  };
}

async function mergeGithubToken(siteId: string, token: string) {
  if (token) return token;
  const sb = await createClient();
  const { data } = await sb.from("integrations").select("config").eq("site_id", siteId).eq("provider", "github").maybeSingle();
  return openSecret((data?.config as GithubConfig | undefined)?.token);
}

export async function saveGithub(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio seleccionado.");
  const c = readGithub(fd);
  if (!/^[\w.-]+\/[\w.-]+$/.test(c.owner)) return fail("Indica el repositorio como propietario/repositorio, p. ej. tierrafina/web");
  if (c.path_template && (!/\{slug\}/.test(c.path_template) || c.path_template.includes(".."))) return fail("La ruta debe incluir {slug} y no puede contener «..».");
  if (isDemo) return ok("Repositorio guardado.");
  const token = await mergeGithubToken(site.id, c.token);
  if (!token) return fail("Pega un token fine-grained de GitHub.");
  const test = await testGithubConnection({ ...c, token });
  if (!test.ok) return fail(test.message);
  const sb = await createClient();
  const { error } = await sb.from("integrations").upsert({ site_id: site.id, provider: "github", status: "connected", config: { ...c, token: sealSecret(token) } }, { onConflict: "site_id,provider" });
  if (error) return fail(`No se pudo guardar: ${error.message}`);
  revalidatePath(PATH);
  return ok(`${test.message} Publicaremos ahí cada artículo nuevo.`);
}

/* ───────── blog alojado ───────── */

export async function saveHostedBlog(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const site = await getCurrentSite();
  if (!site) return fail("No hay ningún sitio seleccionado.");
  const enabled = str(fd, "enabled") === "on";
  const mode = (str(fd, "delivery_mode") as HostedBlogDeliveryMode) || "platform";
  const domainRaw = normalizeHost(str(fd, "custom_domain", 200).replace(/^https?:\/\//, "")) || null;
  if (domainRaw && !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domainRaw)) return fail("El dominio no parece válido. Ejemplo: blog.tudominio.com");
  let base = str(fd, "public_base_url", 300).replace(/\/$/, "") || null;
  if (base) {
    try {
      const u = new URL(base);
      if (u.protocol !== "https:") return fail("La URL pública debe usar https://");
      base = `${u.origin}${u.pathname.replace(/\/$/, "")}`;
    } catch {
      return fail("La URL pública no es válida. Ejemplo: https://tudominio.com/blog");
    }
  }

  const look = (str(fd, "blog_look") || "claro") as BlogLook;
  const color = (str(fd, "blog_color") || "naranja") as BlogColorId;
  const logo = str(fd, "logo_url", 500) || null;
  let slug = slugifyBlogName(site.name);
  if (!isDemo) {
    const sb = await createClient();
    const { data: prev } = await sb.from("hosted_blogs").select("slug").eq("site_id", site.id).maybeSingle();
    if (prev?.slug) slug = prev.slug;
  }
  const row = buildHostedBlogRow({
    siteId: site.id,
    siteName: site.name,
    siteUrl: site.url,
    mode,
    slug,
    customDomain: mode === "subdomain" ? domainRaw : null,
    publicBaseUrl: mode === "folder" ? base : null,
    theme: themeFromChoice(look, color, logo),
    enabled,
  });
  row.title = str(fd, "title", 120) || row.title;
  row.tagline = str(fd, "tagline", 240) || null;

  if (isDemo) return ok(enabled ? "Blog alojado activado." : "Cambios guardados.");
  const sb = await createClient();
  const { error } = await sb.from("hosted_blogs").upsert(row, { onConflict: "site_id" });
  if (error) return fail(error.code === "23505" ? "Ese dominio ya está en uso en otro sitio." : `No se pudo guardar: ${error.message}`);
  revalidatePath(PATH);
  return ok(enabled ? "Blog alojado listo. Los artículos se publicarán en la URL configurada." : "Cambios guardados.");
}

export async function verifyHostedBlogDnsAction(hostname: string): Promise<{ ok: boolean; message: string }> {
  const site = await getCurrentSite();
  if (!site) return { ok: false, message: "No hay ningún sitio seleccionado." };
  const host = normalizeHost(hostname);
  if (!host) return { ok: false, message: "Indica el subdominio." };
  const check = await verifyHostedBlogDns(host);
  if (!check.ok) return { ok: false, message: check.message };
  if (!isDemo) {
    const sb = await createClient();
    await sb.from("hosted_blogs").update({ verified_at: new Date().toISOString(), custom_domain: host }).eq("site_id", site.id);
    revalidatePath(PATH);
  }
  return { ok: true, message: "DNS correcto. El blog puede servirse en tu subdominio." };
}
