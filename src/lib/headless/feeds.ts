/** RSS 2.0, JSON Feed 1.1 y sitemap XML de los artículos publicados de un sitio. */
import "server-only";
import { siteUrl } from "@/lib/env";
import { articleBodyHtml, canonicalFor, getHostedBlog, hostedBaseUrl, listPublished, type HeadlessArticle, type HeadlessSite } from "./content";

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
const apiBase = (siteId: string) => `${siteUrl.replace(/\/$/, "")}/api/v1/sites/${siteId}`;

async function latest(siteId: string, lang?: string | null) {
  const { items } = await listPublished(siteId, { perPage: 50, withBody: true, lang });
  return items;
}

export async function buildRss(site: HeadlessSite, lang?: string | null) {
  const [items, hosted] = await Promise.all([latest(site.id, lang), getHostedBlog(site.id)]);
  const home = hostedBaseUrl(site.id, hosted);
  const title = hosted?.title || `Blog de ${site.name}`;
  const lastBuild = items[0]?.updated_at ?? new Date().toISOString();
  const entries = items
    .map((a) => {
      const url = canonicalFor(a, site.id, hosted);
      return `    <item>
      <title>${xml(a.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="false">${xml(a.id)}</guid>
      <pubDate>${new Date(a.published_at ?? a.created_at).toUTCString()}</pubDate>
${(a.tags ?? []).map((t) => `      <category>${xml(t)}</category>`).join("\n")}
      <description>${xml(a.meta_description ?? "")}</description>
      <content:encoded>${cdata(articleBodyHtml(a))}</content:encoded>${a.cover_url ? `\n      <media:content url="${xml(a.cover_url)}" medium="image" />` : ""}
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xml(title)}</title>
    <link>${xml(home)}</link>
    <description>${xml(hosted?.tagline || site.description || site.name)}</description>
    <language>${xml(lang || site.language)}</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <generator>yeswecontent</generator>
    <atom:link href="${xml(`${apiBase(site.id)}/feed.xml`)}" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>
`;
}

export async function buildJsonFeed(site: HeadlessSite, lang?: string | null) {
  const [items, hosted] = await Promise.all([latest(site.id, lang), getHostedBlog(site.id)]);
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: hosted?.title || `Blog de ${site.name}`,
    home_page_url: hostedBaseUrl(site.id, hosted),
    feed_url: `${apiBase(site.id)}/feed.json`,
    description: hosted?.tagline || site.description || undefined,
    language: lang || site.language,
    items: items.map((a: HeadlessArticle) => ({
      id: a.id,
      url: canonicalFor(a, site.id, hosted),
      title: a.title,
      summary: a.meta_description ?? undefined,
      content_html: articleBodyHtml(a),
      image: a.cover_url ?? undefined,
      date_published: a.published_at ?? a.created_at,
      date_modified: a.updated_at,
      tags: a.tags ?? [],
      language: a.language,
      _ywc: { slug: a.slug, faq: a.faq ?? [], reading_time_minutes: Math.max(1, Math.round(a.word_count / 220)) },
    })),
  };
}

export async function buildSitemap(site: HeadlessSite) {
  const hosted = await getHostedBlog(site.id);
  const all: HeadlessArticle[] = [];
  for (let page = 1; page <= 50; page++) {
    const { items, total } = await listPublished(site.id, { page, perPage: 100 });
    all.push(...items);
    if (all.length >= total || !items.length) break;
  }
  const urls = all
    .map(
      (a) => `  <url>
    <loc>${xml(canonicalFor(a, site.id, hosted))}</loc>
    <lastmod>${new Date(a.updated_at).toISOString()}</lastmod>${a.cover_url ? `\n    <image:image><image:loc>${xml(a.cover_url)}</image:loc></image:image>` : ""}
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${hosted?.enabled ? `  <url>\n    <loc>${xml(hostedBaseUrl(site.id, hosted))}</loc>\n  </url>\n` : ""}${urls}
</urlset>
`;
}
