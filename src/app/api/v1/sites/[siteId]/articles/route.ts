import { getHeadlessSite, getHostedBlog, listPublished, serializeArticle } from "@/lib/headless/content";
import { guardApi } from "@/lib/headless/guard";
import { apiError, jsonResponse, preflight } from "@/lib/headless/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ siteId: string }> };

/**
 * GET /api/v1/sites/:siteId/articles?page=1&per_page=20&lang=es&tag=cuidados&include=content
 * Lista paginada de artículos publicados. Requiere Authorization: Bearer ywc_live_…
 */
export async function GET(req: Request, { params }: Ctx) {
  const { siteId } = await params;
  const g = await guardApi(req, siteId);
  if (g.error) return g.error;

  const site = await getHeadlessSite(siteId);
  if (!site) return apiError(404, "site_not_found", "Sitio no encontrado.", g.headers);

  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, Number.parseInt(sp.get("per_page") ?? "20", 10) || 20));
  const lang = sp.get("lang")?.slice(0, 10) || null;
  const tag = sp.get("tag")?.slice(0, 60) || null;
  const full = sp.get("include") === "content";

  const [{ items, total }, hosted] = await Promise.all([listPublished(siteId, { page, perPage, lang, tag, withBody: full }), getHostedBlog(siteId)]);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const self = new URL(req.url);
  const pageUrl = (p: number) => {
    const u = new URL(self);
    u.searchParams.set("page", String(p));
    u.searchParams.set("per_page", String(perPage));
    u.searchParams.delete("key");
    return u.toString();
  };
  const links: string[] = [];
  if (page < totalPages) links.push(`<${pageUrl(page + 1)}>; rel="next"`);
  if (page > 1) links.push(`<${pageUrl(page - 1)}>; rel="prev"`);

  return jsonResponse(
    req,
    {
      data: items.map((a) => serializeArticle(a, site, hosted, full)),
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: totalPages,
        next: page < totalPages ? pageUrl(page + 1) : null,
        prev: page > 1 ? pageUrl(page - 1) : null,
      },
    },
    { headers: { ...g.headers, "x-total-count": String(total), ...(links.length ? { link: links.join(", ") } : {}) } },
  );
}

export const HEAD = GET;
export const OPTIONS = preflight;
