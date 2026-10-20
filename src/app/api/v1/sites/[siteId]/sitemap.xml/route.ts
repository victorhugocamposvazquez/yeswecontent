import { getHeadlessSite } from "@/lib/headless/content";
import { buildSitemap } from "@/lib/headless/feeds";
import { guardPublic } from "@/lib/headless/guard";
import { apiError, cachedResponse, preflight } from "@/lib/headless/http";

export const dynamic = "force-dynamic";

const PUBLIC_CACHE = "public, max-age=300, s-maxage=900, stale-while-revalidate=86400";

/** Público (sin clave): solo contiene artículos ya publicados. */
export async function GET(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const g = guardPublic(req, siteId);
  if (g.error) return g.error;
  const site = await getHeadlessSite(siteId);
  if (!site) return apiError(404, "site_not_found", "Sitio no encontrado.");
  const body = await buildSitemap(site);
  return cachedResponse(req, body, { contentType: "application/xml; charset=utf-8", cache: PUBLIC_CACHE, headers: { ...g.headers, vary: "Accept-Encoding" } });
}

export const HEAD = GET;
export const OPTIONS = preflight;
