import { siteUrl } from "@/lib/env";
import { getHostedBlog, isValidSiteId } from "@/lib/headless/content";

/** robots.txt del blog alojado en dominio propio (el middleware reescribe /robots.txt aquí). */
export async function GET(_req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const hosted = isValidSiteId(siteId) ? await getHostedBlog(siteId) : null;
  const body = hosted?.enabled
    ? `User-agent: *\nAllow: /\n\nSitemap: ${hosted.custom_domain ? `https://${hosted.custom_domain}` : `${siteUrl.replace(/\/$/, "")}/api/v1/sites/${siteId}`}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
