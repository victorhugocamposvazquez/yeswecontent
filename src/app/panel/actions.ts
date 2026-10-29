"use server";

import { headlessDelivery } from "@/lib/headless/delivery";
import { notifyFrameworkSiteForArticle } from "@/lib/headless/webhook";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSite, getProfile, listContentItems } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { DEMO_NOTE, type ActionState } from "@/lib/panel/action-types";
import { getGlobalSettings } from "@/lib/panel/app-settings";
import { runAudit } from "@/lib/panel/audit";
import { listCompetitors } from "@/lib/panel/data";
import { commitBacklinks, ensureBacklinksBeforePublish, listInternalCandidates, markBacklinksLive } from "@/lib/links";
import { buildJsonLd, generateArticleWithEngine, generatePlan } from "@/lib/panel/generate";
import { getArticleQuota, quotaExceededMessage } from "@/lib/panel/quotas";
import { scoreArticle } from "@/lib/panel/score";
import { runVisibilityCheck } from "@/lib/panel/visibility";
import { writeContentItem } from "@/lib/panel/write-content";
import { hasEncryptionKey } from "@/lib/crypto";
import { loadIntegrationConfig, sealConfig } from "@/lib/oauth/tokens";
import { CMS_PROVIDERS, publish } from "@/lib/publish";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Site } from "@/lib/types";
import { slugify } from "@/lib/utils";


/* ───────── utilidades ───────── */

const ok = (message: string): ActionState => ({ ok: true, message: isDemo ? `${message} ${DEMO_NOTE}` : message, at: Date.now() });
const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const bool = (fd: FormData, k: string) => ["on", "true", "1"].includes(String(fd.get(k) ?? ""));
const list = (fd: FormData, k: string) =>
  str(fd, k)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
const domainOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

const PAUSED = "La generación está en pausa por mantenimiento. Inténtalo más tarde.";
const generationPaused = async () => (await getGlobalSettings()).generation_enabled === false;

async function siteOrFail(): Promise<Site> {
  const site = await getCurrentSite();
  if (!site) throw new Error("No hay ningún sitio activo.");
  return site;
}

/* ───────── shell ───────── */

export async function setSite(formData: FormData) {
  const id = str(formData, "site");
  (await cookies()).set("ywc_site", id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/panel", "layout");
}

export async function logout() {
  if (!isDemo) {
    const sb = await createClient();
    await sb.auth.signOut();
  }
  redirect("/");
}

/* ───────── ajustes ───────── */

export async function saveSettings(section: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  if (isDemo) return ok("Cambios guardados.");
  try {
    const sb = await createClient();
    const site = await siteOrFail();
    let patch: Partial<Site> | null = null;
    switch (section) {
      case "cuenta": {
        const profile = await getProfile();
        if (!profile) return fail("Tu sesión ha caducado.");
        const { error } = await sb.from("profiles").update({ full_name: str(fd, "full_name") }).eq("id", profile.id);
        if (error) return fail(error.message);
        return ok("Perfil actualizado.");
      }
      case "negocio":
        patch = { name: str(fd, "name"), url: str(fd, "url"), niche: str(fd, "niche"), audience: str(fd, "audience"), description: str(fd, "description"), language: str(fd, "language") || "es", extra_languages: fd.getAll("extra_languages").map(String) };
        break;
      case "escritura":
        patch = { brand_voice: { tone: str(fd, "tone"), person: str(fd, "person"), avoid: list(fd, "avoid"), examples: str(fd, "example") ? [str(fd, "example")] : [] } };
        break;
      case "articulo":
        patch = {
          seo_settings: {
            ...site.seo_settings,
            min_words: Number(str(fd, "min_words")) || 1200,
            internal_links: Number(str(fd, "internal_links")) || 3,
            faq: bool(fd, "faq"),
            schema: bool(fd, "schema"),
            ...{ toc: bool(fd, "toc"), cta: str(fd, "cta"), external_links: bool(fd, "external_links") },
          } as Site["seo_settings"],
        };
        break;
      case "visual":
        patch = { visual_style: { style: str(fd, "style"), palette: str(fd, "palette"), ...{ cover: bool(fd, "cover"), inline_images: Number(str(fd, "inline_images")) || 0 } } as Site["visual_style"] };
        break;
      case "calendario":
        patch = { schedule: { days: fd.getAll("days").map(String), time: str(fd, "time") || "09:00", mode: str(fd, "mode") === "batch" ? "batch" : "drip" } };
        break;
      case "mejoras":
        patch = { seo_settings: { ...site.seo_settings, ...{ refresh: { enabled: bool(fd, "enabled"), min_age_months: Number(str(fd, "min_age_months")) || 6, drop_pct: Number(str(fd, "drop_pct")) || 20, per_month: Number(str(fd, "per_month")) || 4 } } } as Site["seo_settings"] };
        break;
      case "marca-blanca": {
        const { error } = await sb
          .from("workspaces")
          .update({ white_label: { brand_name: str(fd, "brand_name"), logo_url: str(fd, "logo_url"), primary_color: str(fd, "primary_color"), custom_domain: str(fd, "custom_domain"), hide_powered_by: bool(fd, "hide_powered_by") } })
          .eq("id", site.workspace_id);
        if (error) return fail(error.message);
        return ok("Marca blanca actualizada.");
      }
      default:
        return ok("Cambios guardados.");
    }
    const { error } = await sb.from("sites").update(patch).eq("id", site.id);
    if (error) return fail(error.message);
    revalidatePath("/panel", "layout");
    return ok("Cambios guardados.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se ha podido guardar.");
  }
}

export async function addCompetitor(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const url = str(fd, "url");
  if (!url) return fail("Escribe la web del competidor.");
  if (isDemo) return ok(`Añadido ${domainOf(url.startsWith("http") ? url : `https://${url}`)}.`);
  const site = await siteOrFail();
  const sb = await createClient();
  const full = url.startsWith("http") ? url : `https://${url}`;
  const { error } = await sb.from("competitors").insert({ site_id: site.id, url: full, name: str(fd, "name") || domainOf(full) });
  if (error) return fail(error.message);
  revalidatePath("/panel/ajustes/competidores");
  return ok("Competidor añadido.");
}

export async function removeCompetitor(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (isDemo) return ok("Competidor eliminado.");
  const sb = await createClient();
  const { error } = await sb.from("competitors").delete().eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/panel/ajustes/competidores");
  return ok("Competidor eliminado.");
}

/** Guarda las credenciales de un CMS, cifradas (AES-256-GCM). Analítica y redes van por OAuth (/api/oauth/…). */
export async function connectIntegration(provider: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  if (["google", "gsc", "ga4", "meta", "reddit", "quora"].includes(provider)) return fail("Esta conexión se hace con el botón «Conectar» (OAuth).");
  if (!CMS_PROVIDERS.includes(provider as (typeof CMS_PROVIDERS)[number])) return fail("Integración desconocida.");
  const config: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (!k.startsWith("$") && typeof v === "string" && v.trim()) config[k] = v.trim();
  if (!Object.keys(config).length) return fail("Rellena los datos de conexión.");
  if (isDemo) return ok("Integración guardada.");
  if (!hasEncryptionKey()) return fail("Falta INTEGRATIONS_ENCRYPTION_KEY en el servidor: no guardamos credenciales sin cifrar.");
  const site = await siteOrFail();
  const sb = await createClient();
  const { error } = await sb
    .from("integrations")
    .upsert({ site_id: site.id, provider, status: "connected", config: sealConfig(config) }, { onConflict: "site_id,provider" });
  if (error) return fail(error.message);
  revalidatePath("/panel/ajustes", "layout");
  return ok("Integración guardada.");
}

export async function disconnectIntegration(provider: string): Promise<ActionState> {
  if (isDemo) return ok("Integración desconectada.");
  const site = await siteOrFail();
  const sb = await createClient();
  const { error } = await sb.from("integrations").delete().eq("site_id", site.id).eq("provider", provider);
  if (error) return fail(error.message);
  revalidatePath("/panel/ajustes", "layout");
  return ok("Integración desconectada.");
}

export async function inviteMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase();
  const role = ["editor", "viewer", "client"].includes(str(fd, "role")) ? str(fd, "role") : "editor";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Ese email no parece válido.");
  if (isDemo) return ok(`Invitación registrada para ${email} (el email se enviará cuando Resend esté activo).`);
  try {
    const site = await siteOrFail();
    const profile = await getProfile();
    if (!profile) return fail("Tu sesión ha caducado.");
    const sb = await createClient();
    const { error } = await sb.from("invitations").insert({
      workspace_id: site.workspace_id,
      email,
      role,
      status: "pending",
      invited_by: profile.id,
    });
    if (error) {
      if (/duplicate|unique/i.test(error.message)) return fail("Ya hay una invitación pendiente para ese email.");
      return fail(error.message);
    }
    revalidatePath("/panel/ajustes/equipo");
    return ok(`Invitación registrada para ${email} (el email se enviará cuando Resend esté activo).`);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se ha podido registrar la invitación.");
  }
}

/* ───────── plan de contenidos ───────── */

const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/** Fechas de publicación del mes siguiente según el calendario del sitio. */
function nextMonthSlots(site: Site, count: number) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const days = (site.schedule?.days?.length ? site.schedule.days : ["mon", "wed", "fri"]).map((d) => DAY_INDEX[d] ?? 1);
  const slots: string[] = [];
  const d = new Date(start);
  while (d.getUTCMonth() === start.getUTCMonth()) {
    if (days.includes(d.getUTCDay())) slots.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  if (!slots.length) slots.push(start.toISOString().slice(0, 10));
  if (site.schedule?.mode === "batch") return Array.from({ length: count }, () => slots[0]);
  return Array.from({ length: count }, (_, i) => slots[Math.floor((i * slots.length) / count)]);
}

export async function generateNextMonthPlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const count = Math.min(60, Math.max(1, Number(str(fd, "count")) || 12));
  const site = await siteOrFail();
  const month = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
  if (isDemo) return ok(`Plan de ${month} listo: ${count} temas nuevos en 4 clústeres. (plantillas de demostración)`);
  if (await generationPaused()) return fail(PAUSED);
  const q = await getArticleQuota(site.id);
  if (q.remaining <= 0) return fail(quotaExceededMessage(q));
  const capped = Math.min(count, q.remaining);
  const existing = (await listContentItems(site.id)).map((c) => c.title);
  const { items, source } = await generatePlan(site, capped, existing, month);
  const slots = nextMonthSlots(site, items.length);
  const sb = await createClient();
  const { error } = await sb.from("content_items").insert(items.map((it, i) => ({ ...it, site_id: site.id, language: site.language, scheduled_for: slots[i], status: "planned", kind: "new" })));
  if (error) return fail(error.message);
  revalidatePath("/panel/plan");
  const demoNote = source !== "claude" ? " (plantillas de demostración: sin ANTHROPIC_API_KEY no hay plan con IA real)." : "";
  const capNote = capped < count ? ` Cupo del plan: ${capped} de ${count} solicitados.` : "";
  return ok(`Plan de ${month} listo: ${items.length} temas nuevos.${capNote}${demoNote}`);
}

export async function setContentStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const status = str(fd, "status");
  const labels: Record<string, string> = { skipped: "Tema descartado.", planned: "Tema recuperado." };
  if (isDemo) return ok(labels[status] ?? "Tema actualizado.");
  const sb = await createClient();
  const { error } = await sb.from("content_items").update({ status }).eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/panel/plan");
  return ok(labels[status] ?? "Tema actualizado.");
}

/** Marca un artículo publicado para renovarlo (crea un tema de tipo "refresh"). */
export async function markForRefresh(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (isDemo) return ok("Añadido a Mejoras: lo renovaremos en el próximo hueco del calendario.");
  const site = await siteOrFail();
  const sb = await createClient();
  const { data: art } = await sb.from("articles").select("title, content_item_id, language").eq("id", str(fd, "article_id")).maybeSingle();
  if (!art) return fail("No encontramos ese artículo.");
  const { data: item } = art.content_item_id ? await sb.from("content_items").select("keyword, cluster, intent").eq("id", art.content_item_id).maybeSingle() : { data: null };
  const { error } = await sb.from("content_items").insert({
    site_id: site.id,
    title: art.title,
    keyword: item?.keyword ?? art.title,
    cluster: item?.cluster ?? null,
    intent: item?.intent ?? null,
    language: art.language,
    scheduled_for: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    status: "planned",
    kind: "refresh",
  });
  if (error) return fail(error.message);
  revalidatePath("/panel/plan");
  return ok("Añadido a Mejoras.");
}

/** Escribe ya el artículo de un tema del plan y abre el editor. */
export async function writeNow(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (isDemo) return ok("Artículo en cola: estará listo para revisar en unos minutos. (plantilla de demostración)");
  if (await generationPaused()) return fail(PAUSED);
  const site = await siteOrFail();
  const item = (await listContentItems(site.id)).find((c) => c.id === id);
  if (!item) return fail("No encontramos ese tema.");
  if (item.status !== "planned" && item.status !== "writing") return fail("Ese tema no está pendiente de redacción.");
  const r = await writeContentItem(site, item);
  if (!r.ok) return fail(r.error);
  // redirect lanza; no hace falta mensaje. Si source=demo, el banner del panel ya avisa.
  redirect(`/panel/articulos/${r.articleId}`);
}

/* ───────── artículos ───────── */

export async function saveArticle(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const title = str(fd, "title");
  const body_md = String(fd.get("body_md") ?? "");
  if (!title || !body_md.trim()) return fail("El título y el texto no pueden estar vacíos.");
  let faq: { q: string; a: string }[] = [];
  try {
    faq = (JSON.parse(String(fd.get("faq") ?? "[]")) as { q: string; a: string }[]).filter((f) => f.q?.trim() && f.a?.trim());
  } catch {
    return fail("Las preguntas frecuentes no tienen un formato válido.");
  }
  const meta_description = str(fd, "meta_description");
  const s = scoreArticle({ title, body_md, keyword: str(fd, "keyword"), meta_description, faq });
  if (isDemo) return ok(`Guardado. Nueva puntuación: ${s.score}/100.`);
  const site = await siteOrFail();
  const sb = await createClient();
  const { error } = await sb
    .from("articles")
    .update({
      title,
      slug: slugify(str(fd, "slug") || title),
      meta_description,
      body_md,
      faq,
      schema_jsonld: buildJsonLd({ title, meta_description, faq }, site),
      word_count: s.word_count,
      quality_score: s.score,
      quality_breakdown: s.breakdown,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return fail(error.message);
  revalidatePath(`/panel/articulos/${id}`);
  return ok(`Guardado. Puntuación: ${s.score}/100.`);
}

export async function regenerateArticle(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (isDemo) return ok("Regenerando con tu voz de marca. Te avisaremos cuando esté listo.");
  if (await generationPaused()) return fail(PAUSED);
  const site = await siteOrFail();
  const sb = await createClient();
  const { data: art } = await sb.from("articles").select("title, content_item_id").eq("id", id).maybeSingle();
  if (!art) return fail("No encontramos ese artículo.");
  const item = art.content_item_id ? (await listContentItems(site.id)).find((c) => c.id === art.content_item_id) : null;
  const g = await generateArticleWithEngine(item ?? { title: art.title, keyword: art.title, intent: null, cluster: null }, site, { internalCandidates: await listInternalCandidates(site.id, { excludeId: id }) });
  const patch = { title: g.title, meta_description: g.meta_description, body_md: g.body_md, faq: g.faq, schema_jsonld: g.schema_jsonld, cover_url: g.cover_url, images: g.images, word_count: g.score.word_count, quality_score: g.score.score, quality_breakdown: g.score.breakdown, status: "review", updated_at: new Date().toISOString() };
  let { error } = await sb.from("articles").update(patch).eq("id", id);
  if (error && /images/.test(error.message)) {
    const { images: _images, ...rest } = patch;
    void _images;
    ({ error } = await sb.from("articles").update(rest).eq("id", id));
  }
  if (error) return fail(error.message);
  // Retira los enlaces pendientes del texto anterior y registra los nuevos.
  await commitBacklinks(id, site.id, g.backlinks).catch((e) => console.warn("[links]", e));
  revalidatePath(`/panel/articulos/${id}`);
  const demoNote = g.source !== "claude" ? " Plantilla de demostración (sin Claude)." : "";
  return ok(`Artículo regenerado (${g.score.score}/100).${demoNote}`);
}

export async function publishNow(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  if (isDemo) return ok("Publicado en WordPress.");
  const site = await siteOrFail();
  const sb = await createClient();
  const { data: art } = await sb.from("articles").select("*").eq("id", id).maybeSingle();
  if (!art) return fail("No encontramos ese artículo.");
  const { data: rows } = await sb.from("integrations").select("provider, config, status").eq("site_id", site.id).in("provider", CMS_PROVIDERS);
  const integration = (rows ?? []).filter((r) => r.status === "connected").map(loadIntegrationConfig).find(Boolean);
  const headless = integration ? null : await headlessDelivery(sb, site.id, art.slug);
  if (!integration && !headless) return fail("Conecta tu CMS en Ajustes › Publicación, o activa la API o el blog alojado en Integraciones.");
  // Si el artículo nunca pasó por la red, insertamos sus enlaces ahora (sin bloquear si falla).
  let body_md = art.body_md as string;
  try {
    const item = art.content_item_id ? (await listContentItems(site.id)).find((c) => c.id === art.content_item_id) : null;
    body_md = await ensureBacklinksBeforePublish({ id, title: art.title, body_md, keyword: item?.keyword, cluster: item?.cluster }, site);
  } catch (e) {
    console.warn("[links] antes de publicar:", e);
  }
  const res = integration
    ? await publish({ ...art, body_md, schema_jsonld: art.schema_jsonld ?? buildJsonLd(art, site) }, integration)
    : { ok: true, url: headless!.url, error: undefined as string | undefined };
  if (!integration) await sb.from("articles").update({ body_md }).eq("id", id);
  const now = new Date().toISOString();
  await sb.from("articles").update(res.ok ? { status: "published", published_url: res.url, published_at: now, updated_at: now } : { status: "failed", updated_at: now }).eq("id", id);
  if (res.ok && art.content_item_id) await sb.from("content_items").update({ status: "published" }).eq("id", art.content_item_id);
  if (res.ok) await markBacklinksLive(id, res.url).catch((e) => console.warn("[links]", e));
  if (res.ok) await notifyFrameworkSiteForArticle(site.id, { id, slug: art.slug, title: art.title, language: art.language, published_url: res.url, published_at: now, updated_at: now, tags: art.tags ?? [] });
  revalidatePath(`/panel/articulos/${id}`);
  return res.ok ? ok(`Publicado${res.url ? `: ${res.url}` : ""}.`) : fail(`No se ha podido publicar: ${res.error ?? "error desconocido"}`);
}

export async function scheduleArticle(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const date = str(fd, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Elige una fecha.");
  const label = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long" }).format(new Date(date));
  if (isDemo) return ok(`Programado para el ${label}.`);
  const sb = await createClient();
  const { data: art, error } = await sb.from("articles").update({ status: "scheduled", updated_at: new Date().toISOString() }).eq("id", id).select("content_item_id").single();
  if (error) return fail(error.message);
  if (art.content_item_id) await sb.from("content_items").update({ status: "scheduled", scheduled_for: date }).eq("id", art.content_item_id);
  revalidatePath(`/panel/articulos/${id}`);
  return ok(`Programado para el ${label}.`);
}

/* ───────── visibilidad IA ───────── */

export async function addPrompt(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const prompt = str(fd, "prompt");
  if (prompt.length < 5) return fail("Escribe la pregunta tal y como la haría un cliente.");
  if (isDemo) return ok("Pregunta añadida. La revisaremos mañana a primera hora en los cuatro modelos.");
  const site = await siteOrFail();
  const sb = await createClient();
  const { error } = await sb.from("ai_prompts").insert({ site_id: site.id, prompt });
  if (error) return fail(error.message);
  revalidatePath("/panel/visibilidad-ia");
  return ok("Pregunta añadida.");
}

export async function togglePrompt(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const active = str(fd, "active") === "true";
  if (isDemo) return ok(active ? "Seguimiento reactivado." : "Seguimiento en pausa.");
  const sb = await createClient();
  const { error } = await sb.from("ai_prompts").update({ active }).eq("id", str(fd, "id"));
  if (error) return fail(error.message);
  revalidatePath("/panel/visibilidad-ia");
  return ok(active ? "Seguimiento reactivado." : "Seguimiento en pausa.");
}

export async function checkPromptNow(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (isDemo) return ok("Comprobación lanzada en los cuatro modelos.");
  const site = await siteOrFail();
  const sb = await createClient();
  const { data: p } = await sb.from("ai_prompts").select("id, prompt").eq("id", str(fd, "id")).eq("site_id", site.id).maybeSingle();
  if (!p) return fail("No encontramos esa pregunta.");
  const comps = await listCompetitors(site.id);
  const results = await runVisibilityCheck(
    p.prompt,
    { name: site.name, domain: domainOf(site.url), competitors: comps.map((c) => ({ name: c.name ?? domainOf(c.url), domain: domainOf(c.url) })) },
    undefined,
    { siteId: site.id, workspaceId: site.workspace_id, purpose: "visibility" },
  );
  const rows = results.filter((r) => !r.stubbed).map((r) => ({ model: r.model, mentioned: r.mentioned, position: r.position, cited_urls: r.cited_urls, competitors_mentioned: r.competitors_mentioned, answer_excerpt: r.answer_excerpt, prompt_id: p.id }));
  if (!rows.length) return fail("No hay ningún modelo con clave configurada (ANTHROPIC_API_KEY, OPENAI_API_KEY…).");
  // ai_checks solo admite lectura con RLS: escribimos con service role tras verificar el acceso arriba.
  const { error } = await createServiceClient().from("ai_checks").insert(rows);
  if (error) return fail(error.message);
  revalidatePath("/panel/visibilidad-ia");
  return ok(`Comprobado en ${rows.length} modelo(s).`);
}

/* ───────── auditoría ───────── */

export async function rerunAudit(): Promise<ActionState> {
  if (isDemo) return ok("Auditoría relanzada.");
  const site = await siteOrFail();
  const { score, results } = await runAudit(site.url);
  const { error } = await createServiceClient().from("audits").insert({ site_id: site.id, url: site.url, score, results });
  if (error) return fail(error.message);
  revalidatePath("/panel/auditoria");
  return ok(`Auditoría completada: ${score}/100.`);
}

/* ───────── social ───────── */

const SOCIAL_PROVIDER: Record<string, string | null> = { reddit: "reddit", instagram: "meta", facebook: "meta", quora: null };
const SOCIAL_LABEL: Record<string, string> = { reddit: "Reddit", instagram: "Instagram y Facebook", facebook: "Instagram y Facebook" };

/** Momento de publicación: "now" | "d1" | "d2" | "d3" (días a la hora del calendario del sitio, UTC como el cron de artículos). */
function socialWhen(when: string, time: string): Date {
  if (!/^d[1-7]$/.test(when)) return new Date();
  const [h, m] = (/^\d{2}:\d{2}$/.test(time) ? time : "09:00").split(":").map(Number);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + Number(when.slice(1)));
  d.setUTCHours(h, m, 0, 0);
  return d;
}

export async function updateSocialPost(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const op = str(fd, "op");
  const id = str(fd, "id");
  const msg: Record<string, string> = {
    approve: "Aprobada. Se publicará desde tu cuenta en los próximos 15 minutos.",
    dismiss: "Sugerencia descartada.",
    save: "Texto actualizado.",
    schedule: "Programado. Lo publicaremos desde tu cuenta conectada.",
    manual: "Marcada como publicada.",
    retry: "Lo volveremos a intentar en los próximos 15 minutos.",
    unschedule: "Programación cancelada.",
  };
  if (isDemo) return ok(op === "schedule" && str(fd, "when") !== "now" ? "Carrusel programado." : (msg[op] ?? "Hecho."));
  const sb = await createClient();
  const { data: post } = await sb.from("social_posts").select("id, site_id, channel, status").eq("id", id).maybeSingle();
  if (!post) return fail("No encontramos esa publicación.");

  let patch: Record<string, unknown>;
  switch (op) {
    case "approve":
    case "schedule":
    case "retry": {
      const provider = SOCIAL_PROVIDER[post.channel as string];
      if (!provider) {
        // Quora: sin API. Queda aprobada para copiar y publicar a mano.
        patch = { status: "approved" };
        break;
      }
      const { data: integ } = await sb.from("integrations").select("status, config").eq("site_id", post.site_id).eq("provider", provider).maybeSingle();
      if (!integ || integ.status !== "connected") return fail(`Conecta ${SOCIAL_LABEL[post.channel as string]} en Ajustes › Redes sociales para publicar.`);
      if (provider === "meta" && !(integ.config as { meta?: { page_id?: string } } | null)?.meta?.page_id) return fail("Elige tu página de Facebook en Ajustes › Redes sociales.");
      if (post.channel === "instagram" && !(integ.config as { meta?: { ig_user_id?: string } } | null)?.meta?.ig_user_id) return fail("Tu página de Facebook no tiene una cuenta profesional de Instagram vinculada.");
      const site = await siteOrFail();
      const at = op === "schedule" ? socialWhen(str(fd, "when"), site.schedule?.time ?? "09:00") : new Date();
      patch = { status: "scheduled", scheduled_for: at.toISOString(), ...(op === "retry" ? { attempts: 0, last_error: null } : {}) };
      if (op === "schedule") msg.schedule = at.getTime() - Date.now() < 3_600_000 ? "Programado: saldrá en los próximos 15 minutos." : `Programado para el ${new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(at)} (UTC).`;
      break;
    }
    case "unschedule":
      patch = { status: "approved", scheduled_for: null };
      break;
    case "dismiss":
      patch = { status: "dismissed" };
      break;
    case "manual":
      patch = { status: "published", published_at: new Date().toISOString() };
      break;
    default:
      patch = { content: str(fd, "content") };
  }
  const { error } = await sb.from("social_posts").update(patch).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/panel/social");
  return ok(msg[op] ?? "Hecho.");
}

/* ───────── enlaces ───────── */

export async function saveBacklinkPrefs(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const optIn = bool(fd, "opt_in");
  if (isDemo) return ok(optIn ? "Preferencias guardadas: participas en la red." : "Has salido de la red de intercambio.");
  const site = await siteOrFail();
  const sb = await createClient();
  const { error } = await sb
    .from("sites")
    .update({ seo_settings: { ...site.seo_settings, ...{ backlinks: { opt_in: optIn, anchors: str(fd, "anchors"), min_dr: Number(str(fd, "min_dr")) || 0, exclude: list(fd, "exclude") } } } })
    .eq("id", site.id);
  if (error) return fail(error.message);
  revalidatePath("/panel/enlaces");
  return ok("Preferencias guardadas.");
}
