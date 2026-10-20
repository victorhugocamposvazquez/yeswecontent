/**
 * Estado de las conexiones OAuth de un sitio, listo para pintar en Ajustes y en el onboarding:
 * cuenta conectada, propiedad/página elegida y opciones disponibles para elegir.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listGa4Properties, listSearchConsoleSites } from "@/lib/analytics/google";
import { isDemo } from "@/lib/env";
import { listMetaPages } from "@/lib/social/meta";
import { getAccessToken, getIntegrationRow, toPublicIntegration } from "./tokens";
import { PROVIDERS } from "./providers";
import type { ConnectionDetails } from "./connection-types";

export type { ConnectionDetails } from "./connection-types";

const DEMO: ConnectionDetails = {
  demo: true,
  google: {
    configured: true,
    connected: true,
    status: "connected",
    account: "hola@tierrafina.es",
    error: null,
    lastSync: new Date().toISOString(),
    gscProperty: "sc-domain:tierrafina.es",
    ga4Property: "properties/312456789",
    gscOptions: [
      { value: "sc-domain:tierrafina.es", label: "tierrafina.es (dominio)" },
      { value: "https://tienda.tierrafina.es/", label: "https://tienda.tierrafina.es/" },
    ],
    ga4Options: [
      { value: "properties/312456789", label: "Tierrafina · Web (Tierrafina)" },
      { value: "properties/398765432", label: "Tienda online (Tierrafina)" },
    ],
    listError: null,
  },
  meta: {
    configured: true,
    connected: false,
    status: null,
    account: null,
    error: null,
    pageId: null,
    pageName: null,
    igUsername: null,
    pageOptions: [],
    listError: null,
  },
  reddit: { configured: true, connected: false, status: null, account: null, error: null },
};

/** En demo, `simulated` marca como conectados los proveedores que acaban de "autorizarse". */
export async function getConnectionDetails(sb: SupabaseClient | null, siteId: string, { simulated = [] as string[] } = {}): Promise<ConnectionDetails> {
  if (isDemo || !sb) {
    const d = structuredClone(DEMO);
    if (simulated.includes("google")) d.google.connected = true;
    if (simulated.includes("meta"))
      d.meta = {
        ...d.meta,
        connected: true,
        status: "connected",
        account: "Lucía (Tierrafina)",
        pageOptions: [
          { value: "1029384756", label: "Tierrafina Cerámica · @tierrafina.ceramica" },
          { value: "5647382910", label: "Taller Tierrafina · sin Instagram" },
        ],
      };
    if (simulated.includes("reddit")) d.reddit = { ...d.reddit, connected: true, status: "connected", account: "u/tierrafina_taller" };
    return d;
  }

  const [g, m, r] = await Promise.all(["google", "meta", "reddit"].map((p) => getIntegrationRow(sb, siteId, p)));
  const pub = (row: typeof g) => (row && row.id && row.site_id && row.created_at ? toPublicIntegration(row as Parameters<typeof toPublicIntegration>[0]) : null);
  const gi = pub(g);
  const mi = pub(m);
  const ri = pub(r);

  const details: ConnectionDetails = {
    demo: false,
    google: {
      configured: PROVIDERS.google.configured(),
      connected: !!gi,
      status: gi?.status ?? null,
      account: gi?.account_name ?? null,
      error: gi?.meta?.last_error ?? null,
      lastSync: gi?.meta?.last_sync_at ?? null,
      gscProperty: gi?.meta?.gsc_property ?? null,
      ga4Property: gi?.meta?.ga4_property ?? null,
      gscOptions: [],
      ga4Options: [],
      listError: null,
    },
    meta: {
      configured: PROVIDERS.meta.configured(),
      connected: !!mi,
      status: mi?.status ?? null,
      account: mi?.account_name ?? null,
      error: mi?.meta?.last_error ?? null,
      pageId: mi?.meta?.page_id ?? null,
      pageName: mi?.meta?.page_name ?? null,
      igUsername: mi?.meta?.ig_username ?? null,
      pageOptions: [],
      listError: null,
    },
    reddit: { configured: PROVIDERS.reddit.configured(), connected: !!ri, status: ri?.status ?? null, account: ri?.account_name ?? null, error: ri?.meta?.last_error ?? null },
  };

  if (gi && gi.status === "connected") {
    try {
      const { token } = await getAccessToken(sb, siteId, "google");
      const [sites, props] = await Promise.all([listSearchConsoleSites(token).catch(() => []), listGa4Properties(token).catch(() => [])]);
      details.google.gscOptions = sites.map((s) => ({ value: s.siteUrl, label: s.siteUrl.startsWith("sc-domain:") ? `${s.siteUrl.slice(10)} (dominio)` : s.siteUrl }));
      details.google.ga4Options = props.map((p) => ({ value: p.property, label: `${p.displayName} (${p.account})` }));
    } catch (e) {
      details.google.listError = e instanceof Error ? e.message : String(e);
    }
  }
  if (mi && mi.status === "connected") {
    try {
      const { token } = await getAccessToken(sb, siteId, "meta");
      const pages = await listMetaPages(token);
      details.meta.pageOptions = pages.map((p) => ({ value: p.id, label: p.instagram ? `${p.name} · @${p.instagram.username ?? "instagram"}` : `${p.name} · sin Instagram` }));
    } catch (e) {
      details.meta.listError = e instanceof Error ? e.message : String(e);
    }
  }
  return details;
}
