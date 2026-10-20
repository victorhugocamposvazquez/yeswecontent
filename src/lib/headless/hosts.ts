/**
 * Mapeo dominio propio → sitio para el blog alojado (blog.cliente.com por CNAME).
 * Compatible con el runtime Edge del middleware: sin `node:*` ni `server-only`,
 * solo fetch a la REST de Supabase con la clave anónima (la política
 * "dominios públicos" de hosted_blogs permite leer el mapeo) y caché en memoria.
 *
 * Fuentes, por orden:
 *   1. HOSTED_BLOG_DOMAINS="blog.cliente.com=<site_uuid>,news.otro.es=<site_uuid>"
 *   2. Modo demo: blog.tierrafina.es y tierrafina.localhost → s_tierrafina
 *   3. Tabla hosted_blogs (custom_domain, enabled)
 */

const TTL_MS = 60_000;
const cache = new Map<string, { siteId: string | null; at: number }>();

const DEMO_HOSTS: Record<string, string> = { "blog.tierrafina.es": "s_tierrafina", "tierrafina.localhost": "s_tierrafina" };

/** Hosts de la propia plataforma (nunca se tratan como blog alojado). */
export function isPlatformHost(host: string): boolean {
  const h = normalizeHost(host);
  if (!h) return true;
  const own = [process.env.NEXT_PUBLIC_SITE_URL, ...(process.env.PLATFORM_HOSTS ?? "").split(",")]
    .filter(Boolean)
    .map((u) => normalizeHost(String(u).replace(/^https?:\/\//, "")));
  return own.includes(h) || h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app") || h.startsWith("www.yeswecontent") || h === "yeswecontent.com";
}

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "").split("/")[0];
}

function fromEnv(h: string): string | null {
  for (const pair of (process.env.HOSTED_BLOG_DOMAINS ?? "").split(",")) {
    const [d, id] = pair.split("=").map((s) => s?.trim());
    if (d && id && normalizeHost(d) === h) return id;
  }
  return null;
}

const isDemoEnv = () => !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Devuelve el siteId del blog alojado en ese host, o null. */
export async function resolveSiteIdForHost(host: string | null | undefined): Promise<string | null> {
  const h = normalizeHost(host);
  if (!h || isPlatformHost(h)) return null;
  const env = fromEnv(h);
  if (env) return env;
  if (isDemoEnv()) return DEMO_HOSTS[h] ?? null;

  const hit = cache.get(h);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.siteId;

  let siteId: string | null = null;
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/hosted_blogs?select=site_id&enabled=eq.true&custom_domain=eq.${encodeURIComponent(h)}&limit=1`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(url, { headers: { apikey: key, authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(2500) });
    if (res.ok) siteId = ((await res.json()) as { site_id: string }[])[0]?.site_id ?? null;
  } catch {
    siteId = hit?.siteId ?? null; // ante un fallo, sirve el último valor conocido
  }
  cache.set(h, { siteId, at: Date.now() });
  if (cache.size > 2000) cache.delete(cache.keys().next().value!);
  return siteId;
}

/** Rutas del blog alojado que se reescriben; el resto (/_next, /api, favicon…) pasa tal cual. */
export function hostedBlogPath(siteId: string, pathname: string): string | null {
  if (/^\/(_next|api|favicon\.ico|icon\.svg|embed\.js)/.test(pathname)) return null;
  if (pathname === "/feed.xml" || pathname === "/rss.xml") return `/api/v1/sites/${siteId}/feed.xml`;
  if (pathname === "/feed.json") return `/api/v1/sites/${siteId}/feed.json`;
  if (pathname === "/sitemap.xml") return `/api/v1/sites/${siteId}/sitemap.xml`;
  if (pathname === "/robots.txt") return `/blog-hosted/${siteId}/robots.txt`;
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "") return `/blog-hosted/${siteId}`;
  if (/^\/[a-z0-9][a-z0-9-_]{0,200}$/i.test(clean)) return `/blog-hosted/${siteId}${clean}`;
  return null;
}

/** Cabecera que el middleware añade para que las páginas generen enlaces relativos a la raíz. */
export const HOSTED_HEADER = "x-ywc-hosted-host";
