import { getHeadlessSite, getHostedBlog, getPublishedBySlug, serializeArticle } from "@/lib/headless/content";
import { guardApi } from "@/lib/headless/guard";
import { apiError, jsonResponse, preflight } from "@/lib/headless/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ siteId: string; slug: string }> };

/** GET /api/v1/sites/:siteId/articles/:slug?lang=es — artículo publicado completo. */
export async function GET(req: Request, { params }: Ctx) {
  const { siteId, slug } = await params;
  const g = await guardApi(req, siteId);
  if (g.error) return g.error;

  const lang = new URL(req.url).searchParams.get("lang")?.slice(0, 10) || null;
  const [site, article, hosted] = await Promise.all([getHeadlessSite(siteId), getPublishedBySlug(siteId, slug, lang), getHostedBlog(siteId)]);
  if (!site) return apiError(404, "site_not_found", "Sitio no encontrado.", g.headers);
  if (!article) return apiError(404, "article_not_found", "No hay ningún artículo publicado con ese slug.", g.headers);

  return jsonResponse(req, { data: serializeArticle(article, site, hosted, true) }, { headers: { ...g.headers, "last-modified": new Date(article.updated_at).toUTCString() } });
}

export const HEAD = GET;
export const OPTIONS = preflight;
