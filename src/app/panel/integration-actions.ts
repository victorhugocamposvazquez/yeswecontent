"use server";

import { revalidatePath } from "next/cache";
import { listGa4Properties } from "@/lib/analytics/google";
import { syncSiteAnalytics } from "@/lib/analytics/sync";
import { isDemo } from "@/lib/env";
import { DEMO_NOTE, type ActionState } from "@/lib/panel/action-types";
import { getConnectionDetails, type ConnectionDetails } from "@/lib/oauth/connections";
import { getProvider, type OAuthProviderId } from "@/lib/oauth/providers";
import { getAccessToken, revokeConnection, updateIntegrationMeta, updateIntegrationSecret, type OAuthSecret } from "@/lib/oauth/tokens";
import { listMetaPages } from "@/lib/social/meta";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ok = (message: string): ActionState => ({ ok: true, message: isDemo ? `${message} ${DEMO_NOTE}` : message, at: Date.now() });
const fail = (message: string): ActionState => ({ ok: false, message, at: Date.now() });
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const msg = (e: unknown) => (e instanceof Error ? e.message : "Algo ha fallado.");

/** Comprueba (vía RLS) que el usuario puede gestionar el sitio y devuelve el cliente. */
async function siteClient(siteId: string) {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("Tu sesión ha caducado.");
  if (!/^[0-9a-f-]{36}$/i.test(siteId)) throw new Error("Sitio no válido.");
  const { data } = await sb.from("sites").select("id").eq("id", siteId).maybeSingle();
  if (!data) throw new Error("No tienes acceso a ese sitio.");
  return sb;
}

const refresh = () => {
  revalidatePath("/panel", "layout");
  revalidatePath("/onboarding");
};

/** Datos para el paso «Conexiones» del onboarding (componente cliente). */
export async function loadConnections(siteId: string | null, simulated: string[] = []): Promise<ConnectionDetails> {
  if (isDemo || !siteId) return getConnectionDetails(null, siteId ?? "", { simulated });
  const sb = await siteClient(siteId);
  return getConnectionDetails(sb, siteId);
}

/** Elige la propiedad de Search Console y la de GA4, y lanza la primera sincronización. */
export async function selectGoogleProperties(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const gsc = str(fd, "gsc_property") || null;
  const ga4 = str(fd, "ga4_property") || null;
  if (!gsc && !ga4) return fail("Elige al menos una propiedad.");
  if (isDemo) return ok("Propiedades guardadas. Tus datos estarán en Analítica en unos minutos.");
  try {
    const siteId = str(fd, "site_id");
    const sb = await siteClient(siteId);
    if (ga4 && !/^properties\/\d+$/.test(ga4)) return fail("Propiedad de GA4 no válida.");
    let label: string | null = null;
    if (ga4) {
      const { token } = await getAccessToken(sb, siteId, "google");
      label = (await listGa4Properties(token).catch(() => [])).find((x) => x.property === ga4)?.displayName ?? null;
    }
    await updateIntegrationMeta(sb, siteId, "google", { gsc_property: gsc, ga4_property: ga4, ga4_property_name: label, last_error: null });
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const r = await syncSiteAnalytics(createServiceClient(), siteId, { days: 90 });
      refresh();
      if (!r.ok) return fail(`Propiedades guardadas, pero la primera sincronización ha fallado: ${r.error ?? "error desconocido"}`);
      return ok(`Propiedades guardadas y ${r.days} días de datos importados.`);
    }
    refresh();
    return ok("Propiedades guardadas. Importaremos los datos esta noche.");
  } catch (e) {
    return fail(msg(e));
  }
}

export async function syncAnalyticsNow(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (isDemo) return ok("Datos actualizados.");
  try {
    const siteId = str(fd, "site_id");
    await siteClient(siteId);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("Falta SUPABASE_SERVICE_ROLE_KEY para sincronizar.");
    const r = await syncSiteAnalytics(createServiceClient(), siteId, { days: 30 });
    refresh();
    return r.ok ? ok(`Datos actualizados (${r.days} días).`) : fail(r.error ?? "No se ha podido sincronizar.");
  } catch (e) {
    return fail(msg(e));
  }
}

/** Elige la página de Facebook (y su Instagram profesional vinculado). Guarda el token de página cifrado. */
export async function selectMetaPage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const pageId = str(fd, "page_id");
  if (!pageId) return fail("Elige una página.");
  if (isDemo) return ok(pageId === "5647382910" ? "Página guardada. Esta página no tiene Instagram vinculado: solo publicaremos en Facebook." : "Página guardada: publicaremos en Facebook e Instagram.");
  try {
    const siteId = str(fd, "site_id");
    const sb = await siteClient(siteId);
    const { token } = await getAccessToken(sb, siteId, "meta");
    const page = (await listMetaPages(token)).find((p) => p.id === pageId);
    if (!page) return fail("No encontramos esa página en tu cuenta de Facebook.");
    await updateIntegrationSecret<OAuthSecret>(sb, siteId, "meta", { page_token: page.access_token }, {
      page_id: page.id,
      page_name: page.name,
      ig_user_id: page.instagram?.id ?? null,
      ig_username: page.instagram?.username ?? null,
      last_error: null,
    });
    refresh();
    return ok(page.instagram ? `Listo: publicaremos en ${page.name} y en @${page.instagram.username ?? "Instagram"}.` : `Página guardada. ${page.name} no tiene una cuenta profesional de Instagram vinculada: solo publicaremos en Facebook.`);
  } catch (e) {
    return fail(msg(e));
  }
}

export async function disconnectOAuth(provider: OAuthProviderId, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const p = getProvider(provider);
  if (!p) return fail("Proveedor desconocido.");
  if (isDemo) return ok(`${p.label} desconectado.`);
  try {
    const siteId = str(fd, "site_id");
    const sb = await siteClient(siteId);
    await revokeConnection(sb, siteId, p.id);
    const { error } = await sb.from("integrations").delete().eq("site_id", siteId).eq("provider", p.id);
    if (error) return fail(error.message);
    refresh();
    return ok(`${p.label} desconectado. Hemos revocado nuestro acceso.`);
  } catch (e) {
    return fail(msg(e));
  }
}
