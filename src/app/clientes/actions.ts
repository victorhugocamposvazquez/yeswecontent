"use server";

import { resolveCname } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CNAME_TARGET, PREVIEW_COOKIE, resolvePortal } from "@/lib/clientes/data";
import type { ClientBrandKit } from "@/lib/clientes/types";
import { isDemo, siteUrl } from "@/lib/env";
import { DEMO_NOTE, type ActionState } from "@/lib/panel/action-types";
import { CMS_PROVIDERS, type Provider } from "@/lib/publish";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ok = (message: string): ActionState => ({ ok: true, message: isDemo ? `${message} ${DEMO_NOTE}` : message, at: Date.now() });
const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });
const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const lines = (fd: FormData, k: string) =>
  str(fd, k, 2000)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOSTNAME = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const httpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return ["http:", "https:"].includes(u.protocol) ? u.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
};

async function portalOrFail() {
  const r = await resolvePortal();
  if (!r.ok) throw new Error(r.reason === "login" ? "Tu sesión ha caducado. Vuelve a entrar." : "No tienes acceso a este portal.");
  return r.ctx;
}

const guard = async <T,>(fn: () => Promise<T>): Promise<T | ActionState> => {
  try {
    return await fn();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Algo ha fallado. Inténtalo de nuevo.");
  }
};

/* ───────── vista previa de la agencia ───────── */

export async function exitPreview() {
  (await cookies()).delete(PREVIEW_COOKIE);
  redirect("/agencia/clientes");
}

/* ───────── sesión ───────── */

export async function logoutClient() {
  if (!isDemo) {
    const sb = await createClient();
    await sb.auth.signOut();
  }
  redirect("/entrar?next=/clientes");
}

/* ───────── perfil ───────── */

export async function saveClientProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await portalOrFail();
    const name = str(fd, "full_name", 120);
    if (name.length < 2) return fail("Escribe tu nombre.");
    if (ctx.preview) return fail("Estás en vista previa: el perfil solo lo puede cambiar tu cliente.");
    if (isDemo) return ok("Perfil actualizado.");
    const sb = await createClient();
    const { error } = await sb.from("profiles").update({ full_name: name }).eq("id", ctx.viewer.id!);
    if (error) return fail("No hemos podido guardar el perfil.");
    revalidatePath("/clientes", "layout");
    return ok("Perfil actualizado.");
  }) as Promise<ActionState>;
}

/* ───────── miembros ───────── */

export async function inviteClientMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await portalOrFail();
    const email = str(fd, "email", 200).toLowerCase();
    const name = str(fd, "full_name", 120) || null;
    const role = str(fd, "role") === "admin" ? "admin" : "member";
    if (!EMAIL.test(email)) return fail("Ese email no parece válido.");
    if (isDemo) return ok(`Invitación enviada a ${email}.`);

    const sb = await createClient();
    if (!ctx.preview) {
      const { data: me } = await sb.from("client_site_members").select("role").eq("site_id", ctx.site.id).eq("user_id", ctx.viewer.id!).maybeSingle();
      if (me?.role !== "admin") return fail("Solo las personas administradoras pueden invitar a otras.");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("Las invitaciones aún no están configuradas. Escribe a tu agencia para que te añada.");

    const admin = createServiceClient();
    const { data: existing } = await admin.from("client_site_members").select("id").eq("site_id", ctx.site.id).eq("email", email).maybeSingle();
    if (existing) return fail("Esa persona ya tiene acceso o una invitación pendiente.");

    let userId: string | null = null;
    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/clientes`,
      data: { full_name: name ?? undefined, company: ctx.client.client_name },
    });
    if (invited?.user) userId = invited.user.id;
    else {
      // Ya tenía cuenta: la buscamos por email.
      const { data: prof } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (!prof) return fail(invErr?.message ?? "No hemos podido enviar la invitación.");
      userId = prof.id;
    }
    await admin.from("workspace_members").upsert({ workspace_id: ctx.site.workspace_id, user_id: userId, role: "client" }, { onConflict: "workspace_id,user_id", ignoreDuplicates: true });
    const { error } = await admin.from("client_site_members").insert({ site_id: ctx.site.id, user_id: userId, email, full_name: name, role, status: "invited" });
    if (error) return fail("No hemos podido registrar la invitación.");
    revalidatePath("/clientes/ajustes/miembros");
    return ok(`Invitación enviada a ${email}.`);
  }) as Promise<ActionState>;
}

/* ───────── branding ───────── */

export async function saveClientBranding(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await portalOrFail();
    const logo = str(fd, "logo_url", 500);
    if (logo && !httpUrl(logo)) return fail("La URL del logotipo debe empezar por https://");
    const colors = ["color_1", "color_2", "color_3"].map((k) => str(fd, k, 7)).filter((c) => /^#[0-9a-f]{6}$/i.test(c));
    const brand: ClientBrandKit = {
      logo_url: logo || undefined,
      colors,
      fonts: str(fd, "fonts", 200) || undefined,
      guidelines: str(fd, "guidelines", 3000) || undefined,
      do: lines(fd, "do"),
      dont: lines(fd, "dont"),
    };
    if (isDemo) return ok("Kit de marca guardado. Lo tendremos en cuenta en los próximos artículos.");
    const sb = await createClient();
    const { error } = await sb.from("client_site_settings").upsert({ site_id: ctx.site.id, brand, updated_at: new Date().toISOString() }, { onConflict: "site_id" });
    if (error) return fail("No hemos podido guardar el kit de marca.");
    revalidatePath("/clientes/ajustes/branding");
    return ok("Kit de marca guardado. Lo tendremos en cuenta en los próximos artículos.");
  }) as Promise<ActionState>;
}

/* ───────── hosting: dominio propio y CMS ───────── */

export async function saveClientDomain(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await portalOrFail();
    const domain = str(fd, "custom_domain", 253).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (domain && !HOSTNAME.test(domain)) return fail("Escribe un subdominio válido, por ejemplo blog.tuempresa.es");
    if (isDemo) return ok(domain ? `Dominio ${domain} guardado. Ahora crea el registro CNAME.` : "Dominio eliminado.");
    const sb = await createClient();
    const { error } = await sb
      .from("client_site_settings")
      .upsert({ site_id: ctx.site.id, custom_domain: domain || null, domain_verified_at: null, updated_at: new Date().toISOString() }, { onConflict: "site_id" });
    if (error) return fail("No hemos podido guardar el dominio.");
    revalidatePath("/clientes/ajustes/hosting");
    return ok(domain ? `Dominio ${domain} guardado. Ahora crea el registro CNAME.` : "Dominio eliminado.");
  }) as Promise<ActionState>;
}

export async function verifyClientDomain(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await portalOrFail();
    const domain = str(fd, "custom_domain", 253).toLowerCase();
    if (!HOSTNAME.test(domain)) return fail("Primero guarda un dominio válido.");
    if (isDemo) return ok(`El CNAME de ${domain} apunta correctamente a ${CNAME_TARGET}.`);
    let records: string[] = [];
    try {
      records = await resolveCname(domain);
    } catch {
      return fail(`Aún no vemos el registro CNAME de ${domain}. Los cambios de DNS pueden tardar hasta 24 horas.`);
    }
    const target = CNAME_TARGET.toLowerCase().replace(/\.$/, "");
    if (!records.some((r) => r.toLowerCase().replace(/\.$/, "") === target))
      return fail(`${domain} apunta a ${records.join(", ")} en lugar de ${CNAME_TARGET}. Revisa el registro.`);
    const sb = await createClient();
    await sb.from("client_site_settings").upsert({ site_id: ctx.site.id, custom_domain: domain, domain_verified_at: new Date().toISOString() }, { onConflict: "site_id" });
    revalidatePath("/clientes/ajustes/hosting");
    return ok(`¡Listo! ${domain} está verificado.`);
  }) as Promise<ActionState>;
}

const CMS_FIELDS: Record<Provider, { key: string; url?: boolean }[]> = {
  wordpress: [{ key: "url", url: true }, { key: "username" }, { key: "app_password" }],
  shopify: [{ key: "shop" }, { key: "access_token" }, { key: "blog_id" }],
  webflow: [{ key: "token" }, { key: "collection_id" }],
  ghost: [{ key: "url", url: true }, { key: "admin_key" }],
  webhook: [{ key: "url", url: true }, { key: "secret" }],
};

export async function saveClientCms(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await portalOrFail();
    const provider = str(fd, "provider") as Provider;
    if (!CMS_PROVIDERS.includes(provider)) return fail("Elige tu CMS.");
    const config: Record<string, string> = {};
    for (const f of CMS_FIELDS[provider]) {
      const v = str(fd, `${provider}_${f.key}`, 1000);
      if (!v) return fail("Completa todos los campos para conectar.");
      if (f.url) {
        const u = httpUrl(v);
        if (!u || !u.startsWith("https://")) return fail("La dirección debe empezar por https://");
        config[f.key] = u;
      } else config[f.key] = v;
    }
    if (isDemo) return ok("CMS conectado. Publicaremos directamente en tu web.");
    const sb = await createClient();
    const { error } = await sb.from("integrations").upsert({ site_id: ctx.site.id, provider, status: "connected", config }, { onConflict: "site_id,provider" });
    if (error) return fail("No hemos podido guardar la conexión.");
    revalidatePath("/clientes/ajustes/hosting");
    return ok("CMS conectado. Publicaremos directamente en tu web.");
  }) as Promise<ActionState>;
}

/* ───────── conversación con la agencia ───────── */

export async function sendClientMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return guard(async () => {
    const ctx = await portalOrFail();
    const body = str(fd, "body", 4000);
    if (!body) return fail("Escribe tu mensaje.");
    if (isDemo) return ok("Mensaje enviado. El equipo te responderá por aquí.");
    const sb = await createClient();
    const { error } = await sb.from("client_messages").insert({
      site_id: ctx.site.id,
      author_id: ctx.viewer.id,
      author_name: ctx.preview ? ctx.agency.name : ctx.viewer.name,
      author_side: ctx.preview ? "agency" : "client",
      body,
    });
    if (error) return fail("No hemos podido enviar el mensaje.");
    revalidatePath("/clientes/ajustes/equipo");
    return ok("Mensaje enviado. El equipo te responderá por aquí.");
  }) as Promise<ActionState>;
}
