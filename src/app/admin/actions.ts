"use server";

/**
 * Server actions del panel de administración.
 * - Modo demo: no escriben nada y devuelven un mensaje de confirmación.
 * - Con Supabase: verifican que quien llama es admin y escriben con service role.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemo, hasStripe } from "@/lib/env";
import { adminDb } from "@/lib/admin/guard";
import { IMPERSONATE_COOKIE } from "@/lib/admin/constants";
import type { ActionResult, AppSettings, VolumeTier } from "@/lib/admin/types";
import { getStripe } from "@/lib/stripe";
import { slugify } from "@/lib/utils";

const ok = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });
const demoOk = (what: string) => ok(`Modo demo: ${what}. No se ha guardado nada.`);
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => {
  const n = Number.parseInt(str(fd, k), 10);
  return Number.isFinite(n) ? n : 0;
};
/** Euros con decimales ("79", "79,90") → céntimos. */
const cents = (fd: FormData, k: string) => Math.round(Number.parseFloat(str(fd, k).replace(",", ".") || "0") * 100);

/** "YYYY-MM-DDTHH:mm" (datetime-local, tratado como UTC) → ISO; vacío o inválido → ahora. */
const parseUtc = (v: string) => {
  const d = new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00Z` : v);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Error inesperado");
  }
}

async function writeSetting(key: string, value: unknown) {
  const { db } = await adminDb();
  const { error } = await db.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar (${error.message}). ¿Has creado la tabla app_settings? Ver README.`);
}

/* ───────── Usuarios ───────── */

export async function setUserRole(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const userId = str(fd, "userId");
  const role = str(fd, "role");
  if (role !== "admin" && role !== "user") return fail("Rol no válido");
  if (isDemo) return demoOk(`rol cambiado a «${role}»`);
  return run(async () => {
    const { db, admin } = await adminDb();
    if (admin.id === userId && role !== "admin") return fail("No puedes quitarte el rol de admin a ti mismo.");
    const { error } = await db.from("profiles").update({ role }).eq("id", userId);
    if (error) return fail(error.message);
    revalidatePath(`/admin/usuarios/${userId}`);
    return ok(`Rol actualizado a «${role}».`);
  });
}

export async function extendTrial(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const subId = str(fd, "subscriptionId");
  const days = Math.min(Math.max(int(fd, "days"), 1), 60);
  if (isDemo) return demoOk(`prueba ampliada ${days} días`);
  return run(async () => {
    const { db } = await adminDb();
    const { data: sub } = await db.from("subscriptions").select("*").eq("id", subId).single();
    if (!sub) return fail("Suscripción no encontrada");
    const base = sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date() ? new Date(sub.trial_ends_at) : new Date();
    const until = new Date(base.getTime() + days * 86_400_000);
    if (hasStripe && sub.stripe_subscription_id) {
      await getStripe().subscriptions.update(sub.stripe_subscription_id, { trial_end: Math.floor(until.getTime() / 1000), proration_behavior: "none" });
    }
    const { error } = await db.from("subscriptions").update({ trial_ends_at: until.toISOString(), status: "trialing" }).eq("id", subId);
    if (error) return fail(error.message);
    revalidatePath("/admin", "layout");
    return ok(`Prueba ampliada hasta el ${until.toLocaleDateString("es-ES")}.`);
  });
}

export async function cancelSubscription(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const subId = str(fd, "subscriptionId");
  const immediate = str(fd, "mode") === "now";
  if (isDemo) return demoOk(immediate ? "suscripción cancelada al momento" : "cancelación programada a fin de periodo");
  return run(async () => {
    const { db } = await adminDb();
    const { data: sub } = await db.from("subscriptions").select("*").eq("id", subId).single();
    if (!sub) return fail("Suscripción no encontrada");
    if (hasStripe && sub.stripe_subscription_id) {
      const stripe = getStripe();
      if (immediate) await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      else await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
    }
    if (immediate || !sub.stripe_subscription_id) {
      const { error } = await db.from("subscriptions").update({ status: "canceled" }).eq("id", subId);
      if (error) return fail(error.message);
    }
    revalidatePath("/admin", "layout");
    return ok(immediate ? "Suscripción cancelada." : "Se cancelará al final del periodo actual (Stripe enviará el webhook).");
  });
}

/**
 * Suplantación para soporte. STUB: solo guarda una cookie con el id del usuario.
 * TODO(producción): registrar cada inicio/fin en una tabla de auditoría
 * (admin_id, target_user_id, motivo, ip, inicio, fin), limitar la duración,
 * exigir motivo y hacer que la capa de datos del panel respete la cookie
 * solo para admins verificados.
 */
export async function impersonateUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const userId = str(fd, "userId");
  if (!isDemo) {
    try {
      await adminDb();
    } catch {
      return fail("No autorizado");
    }
  }
  const store = await cookies();
  store.set(IMPERSONATE_COOKIE, userId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 });
  redirect("/panel");
}

export async function stopImpersonation() {
  const store = await cookies();
  store.delete(IMPERSONATE_COOKIE);
  revalidatePath("/admin", "layout");
}

/* ───────── Planes ───────── */

export async function savePlan(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!id || !name) return fail("El identificador y el nombre son obligatorios.");
  const seats = str(fd, "seats");
  const plan = {
    id,
    name,
    monthly_price_eur: cents(fd, "monthly_price"),
    yearly_price_eur: cents(fd, "yearly_price"),
    articles_per_month: int(fd, "articles_per_month"),
    tracked_prompts: int(fd, "tracked_prompts"),
    languages: int(fd, "languages"),
    seats: seats ? int(fd, "seats") : null,
    social_cadence: str(fd, "social_cadence") === "daily" ? "daily" : "weekly",
    backlink_credits: int(fd, "backlink_credits"),
    features: str(fd, "features")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    stripe_price_monthly: str(fd, "stripe_price_monthly") || null,
    stripe_price_yearly: str(fd, "stripe_price_yearly") || null,
    active: fd.get("active") === "on",
    sort: int(fd, "sort"),
  };
  if (isDemo) return demoOk(`plan «${name}» actualizado`);
  return run(async () => {
    const { db } = await adminDb();
    const { error } = await db.from("plans").upsert(plan);
    if (error) return fail(error.message);
    revalidatePath("/admin/planes");
    revalidatePath("/precios");
    return ok(`Plan «${name}» guardado.`);
  });
}

export async function saveVolumeTiers(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const from = fd.getAll("from").map((v) => Number.parseInt(String(v), 10));
  const to = fd.getAll("to").map((v) => (String(v).trim() ? Number.parseInt(String(v), 10) : null));
  const pct = fd.getAll("pct").map((v) => Number.parseFloat(String(v).replace(",", ".")));
  const tiers: VolumeTier[] = from
    .map((f, i) => ({ from: f, to: to[i] ?? null, pct: pct[i] }))
    .filter((t) => Number.isFinite(t.from) && Number.isFinite(t.pct) && t.pct > 0)
    .sort((a, b) => a.from - b.from);
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    if (t.pct >= 100) return fail("Un descuento no puede ser del 100% o más.");
    if (t.to !== null && t.to < t.from) return fail(`El tramo que empieza en ${t.from} termina antes de empezar.`);
    const next = tiers[i + 1];
    if (next && (t.to === null || t.to >= next.from)) return fail(`Los tramos ${t.from} y ${next.from} se solapan.`);
  }
  if (isDemo) return demoOk(`${tiers.length} tramos de descuento guardados`);
  return run(async () => {
    await writeSetting("volume_discounts", tiers);
    revalidatePath("/admin/planes");
    return ok("Descuentos por volumen guardados.");
  });
}

/* ───────── Cola de contenido ───────── */

/** Ids con prefijo: "ci:<content_item>" o "a:<article>". */
export async function retryJob(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  if (isDemo) return demoOk("trabajo reencolado");
  return run(async () => {
    const { db } = await adminDb();
    const [kind, realId] = id.split(":");
    if (kind === "a") {
      const { data: art } = await db.from("articles").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", realId).select("content_item_id").single();
      if (art?.content_item_id) await db.from("content_items").update({ status: "writing" }).eq("id", art.content_item_id);
    } else {
      await db.from("content_items").update({ status: "planned" }).eq("id", realId);
    }
    revalidatePath("/admin/cola");
    return ok("Reencolado. El próximo ciclo del cron lo procesará.");
  });
}

export async function cancelJob(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  if (isDemo) return demoOk("trabajo cancelado");
  return run(async () => {
    const { db } = await adminDb();
    const [kind, realId] = id.split(":");
    if (kind === "a") {
      const { data: art } = await db.from("articles").update({ status: "draft" }).eq("id", realId).select("content_item_id").single();
      if (art?.content_item_id) await db.from("content_items").update({ status: "skipped" }).eq("id", art.content_item_id);
    } else {
      await db.from("content_items").update({ status: "skipped" }).eq("id", realId);
    }
    revalidatePath("/admin/cola");
    return ok("Trabajo cancelado y tema marcado como descartado.");
  });
}

/* ───────── Red de enlaces ───────── */

export async function moderateLink(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  const decision = str(fd, "decision");
  const status = decision === "approve" ? "live" : decision === "reject" ? "rejected" : decision === "remove" ? "removed" : null;
  if (!status) return fail("Decisión no válida");
  const label = { live: "aprobado", rejected: "rechazado", removed: "retirado" }[status];
  if (isDemo) return demoOk(`enlace ${label}`);
  return run(async () => {
    const { db } = await adminDb();
    const { error } = await db.from("backlink_links").update({ status }).eq("id", id);
    if (error) return fail(error.message);
    revalidatePath("/admin/enlaces");
    return ok(`Enlace ${label}.`);
  });
}

const normDomain = (d: string) =>
  d
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();

export async function banDomain(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const domain = normDomain(str(fd, "domain"));
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return fail("Escribe un dominio válido, p. ej. ejemplo.com");
  if (isDemo) return demoOk(`dominio ${domain} vetado`);
  return run(async () => {
    const { db } = await adminDb();
    const { data } = await db.from("app_settings").select("value").eq("key", "banned_domains").maybeSingle();
    const list = new Set<string>((data?.value as string[] | undefined) ?? []);
    list.add(domain);
    await writeSetting("banned_domains", [...list].sort());
    // Rechaza los enlaces pendientes que salen de ese dominio.
    const { data: sites } = await db.from("sites").select("id, url").ilike("url", `%${domain}%`);
    const ids = (sites ?? []).filter((s) => normDomain(s.url) === domain).map((s) => s.id);
    if (ids.length) await db.from("backlink_links").update({ status: "rejected" }).eq("status", "pending").in("source_site_id", ids);
    revalidatePath("/admin/enlaces");
    return ok(`${domain} vetado${ids.length ? " y sus enlaces pendientes rechazados" : ""}.`);
  });
}

export async function unbanDomain(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const domain = normDomain(str(fd, "domain"));
  if (isDemo) return demoOk(`veto de ${domain} retirado`);
  return run(async () => {
    const { db } = await adminDb();
    const { data } = await db.from("app_settings").select("value").eq("key", "banned_domains").maybeSingle();
    const list = ((data?.value as string[] | undefined) ?? []).filter((d) => d !== domain);
    await writeSetting("banned_domains", list);
    revalidatePath("/admin/enlaces");
    return ok(`Veto de ${domain} retirado.`);
  });
}

/* ───────── Casos de éxito ───────── */

export async function saveCaseStudy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  const company = str(fd, "company");
  const summary = str(fd, "summary");
  if (!company || !summary) return fail("Empresa y resumen son obligatorios.");
  const optInt = (k: string) => (str(fd, k) ? int(fd, k) : null);
  const row = {
    company,
    slug: slugify(str(fd, "slug") || company),
    sector: str(fd, "sector") || null,
    summary,
    body_md: str(fd, "body_md"),
    metric_before: optInt("metric_before"),
    metric_after: optInt("metric_after"),
    metric_label: str(fd, "metric_label") || null,
    published: fd.get("published") === "on",
  };
  if (isDemo) return demoOk(`caso «${company}» guardado`);
  let newId: string | null = null;
  const res = await run(async () => {
    const { db } = await adminDb();
    if (id) {
      const { error } = await db.from("case_studies").update(row).eq("id", id);
      if (error) return fail(error.message);
    } else {
      const { data, error } = await db.from("case_studies").insert(row).select("id").single();
      if (error) return fail(error.message);
      newId = data.id;
    }
    revalidatePath("/admin/casos");
    revalidatePath("/casos");
    return ok(`Caso «${company}» guardado.`);
  });
  if (newId) redirect(`/admin/casos/${newId}`);
  return res;
}

export async function toggleCaseStudy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  const published = str(fd, "published") === "true";
  if (isDemo) return demoOk(published ? "caso publicado" : "caso despublicado");
  return run(async () => {
    const { db } = await adminDb();
    const { error } = await db.from("case_studies").update({ published }).eq("id", id);
    if (error) return fail(error.message);
    revalidatePath("/admin/casos");
    revalidatePath("/casos");
    return ok(published ? "Caso publicado." : "Caso despublicado.");
  });
}

export async function deleteCaseStudy(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  if (isDemo) return demoOk("caso eliminado");
  const res = await run(async () => {
    const { db } = await adminDb();
    const { error } = await db.from("case_studies").delete().eq("id", id);
    if (error) return fail(error.message);
    revalidatePath("/admin/casos");
    revalidatePath("/casos");
    return ok("Caso eliminado.");
  });
  if (res?.ok) redirect("/admin/casos");
  return res;
}

/* ───────── Novedades ───────── */

export async function saveProductUpdate(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  const title = str(fd, "title");
  const body_md = str(fd, "body_md");
  if (!title || !body_md) return fail("Título y texto son obligatorios.");
  const date = str(fd, "published_at");
  const row = { title, body_md, tag: str(fd, "tag") || null, published_at: parseUtc(date) };
  if (isDemo) return demoOk(`novedad «${title}» guardada`);
  let newId: string | null = null;
  const res = await run(async () => {
    const { db } = await adminDb();
    if (id) {
      const { error } = await db.from("product_updates").update(row).eq("id", id);
      if (error) return fail(error.message);
    } else {
      const { data, error } = await db.from("product_updates").insert(row).select("id").single();
      if (error) return fail(error.message);
      newId = data.id;
    }
    revalidatePath("/admin/novedades");
    revalidatePath("/panel", "layout");
    return ok(`Novedad «${title}» guardada.`);
  });
  if (newId) redirect(`/admin/novedades/${newId}`);
  return res;
}

export async function deleteProductUpdate(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const id = str(fd, "id");
  if (isDemo) return demoOk("novedad eliminada");
  const res = await run(async () => {
    const { db } = await adminDb();
    const { error } = await db.from("product_updates").delete().eq("id", id);
    if (error) return fail(error.message);
    revalidatePath("/admin/novedades");
    return ok("Novedad eliminada.");
  });
  if (res?.ok) redirect("/admin/novedades");
  return res;
}

/* ───────── Ajustes globales ───────── */

export async function saveSettings(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const provider = str(fd, "ai_provider");
  const settings: AppSettings = {
    ai_provider: provider === "openai" || provider === "gemini" ? provider : "claude",
    ai_model: str(fd, "ai_model"),
    generation_enabled: fd.get("generation_enabled") === "on",
    maintenance_banner: str(fd, "maintenance_banner").slice(0, 280),
  };
  if (isDemo) return demoOk(settings.generation_enabled ? "ajustes guardados" : "ajustes guardados con la generación pausada");
  return run(async () => {
    await writeSetting("global", settings);
    revalidatePath("/", "layout");
    return ok(settings.generation_enabled ? "Ajustes guardados." : "Ajustes guardados. La generación de artículos está PAUSADA.");
  });
}
