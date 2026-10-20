/**
 * Utilidades de análisis para las herramientas gratuitas.
 * - safeFetch: descarga una URL pública con límites (http/https, sin IPs privadas,
 *   timeout, 2 MB, redirecciones revalidadas una a una).
 * - Parsers ligeros de HTML, robots.txt y sitemaps, sin dependencias.
 */
import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const UA = "Mozilla/5.0 (compatible; yeswecontent-tools/1.0; +https://yeswecontent.com/herramientas)";

export class ToolError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/* ───────────── Validación de URL y red ───────────── */

export function normalizeUrl(input: string): URL {
  const raw = input.trim();
  if (!raw) throw new ToolError("Escribe una URL.");
  if (raw.length > 2048) throw new ToolError("La URL es demasiado larga.");
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new ToolError("Esa URL no parece válida.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new ToolError("Solo aceptamos direcciones http o https.");
  if (url.username || url.password) throw new ToolError("La URL no puede incluir usuario ni contraseña.");
  if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) throw new ToolError("Ese puerto no está permitido.");
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".lan") ||
    (!host.includes(".") && !isIP(host.replace(/^\[|\]$/g, "")))
  ) {
    throw new ToolError("Solo podemos analizar webs públicas.");
  }
  url.hash = "";
  return url;
}

function ipv4ToInt(ip: string) {
  return ip.split(".").reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;
}
function inV4(ip: string, cidr: string) {
  const [base, bits] = cidr.split("/");
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}
const PRIVATE_V4 = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4",
  "240.0.0.0/4",
];

export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return PRIVATE_V4.some((c) => inV4(ip, c));
  if (v === 6) {
    const x = ip.toLowerCase();
    if (x === "::" || x === "::1") return true;
    const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    if (/^::ffff:/.test(x)) return true;
    if (/^f[cd]/.test(x)) return true; // fc00::/7
    if (/^fe[89ab]/.test(x)) return true; // fe80::/10
    if (/^ff/.test(x)) return true; // multicast
    if (/^2001:db8/.test(x)) return true;
    if (/^64:ff9b/.test(x)) return true;
    return false;
  }
  return true;
}

async function assertPublicHost(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new ToolError("Solo podemos analizar webs públicas.");
    return;
  }
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new ToolError(`No encontramos el dominio ${host}. ¿Está bien escrito?`);
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new ToolError("Solo podemos analizar webs públicas.");
}

export interface FetchResult {
  url: string; // URL final tras redirecciones
  status: number;
  ok: boolean;
  contentType: string;
  body: string;
  truncated: boolean;
  redirects: string[];
  ms: number;
}

async function readLimited(res: Response, limit: number): Promise<{ text: string; truncated: boolean }> {
  if (!res.body) return { text: "", truncated: false };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      chunks.push(value.slice(0, value.byteLength - (size - limit)));
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(Math.min(size, limit));
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.byteLength;
  }
  return { text: new TextDecoder("utf-8", { fatal: false }).decode(buf), truncated };
}

/** Descarga segura de una URL pública. Lanza ToolError con mensajes legibles. */
export async function safeFetch(input: string | URL, opts: { method?: "GET" | "HEAD"; maxBytes?: number } = {}): Promise<FetchResult> {
  let url = typeof input === "string" ? normalizeUrl(input) : input;
  const redirects: string[] = [];
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicHost(url);
      let res: Response;
      try {
        res = await fetch(url, {
          method: opts.method ?? "GET",
          redirect: "manual",
          signal: ctrl.signal,
          cache: "no-store",
          headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.5" },
        });
      } catch (e) {
        if ((e as Error).name === "AbortError") throw new ToolError("La web ha tardado demasiado en responder (más de 8 s).", 504);
        throw new ToolError("No hemos podido conectar con esa web.", 502);
      }
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        const next = new URL(res.headers.get("location")!, url);
        redirects.push(next.toString());
        url = normalizeUrl(next.toString());
        await res.body?.cancel().catch(() => {});
        continue;
      }
      const len = Number(res.headers.get("content-length") ?? 0);
      const limit = opts.maxBytes ?? MAX_BYTES;
      if (len > limit * 4) {
        await res.body?.cancel().catch(() => {});
        throw new ToolError("El documento pesa demasiado para analizarlo (más de 2 MB).", 413);
      }
      const { text, truncated } = opts.method === "HEAD" ? { text: "", truncated: false } : await readLimited(res, limit);
      return {
        url: url.toString(),
        status: res.status,
        ok: res.ok,
        contentType: res.headers.get("content-type") ?? "",
        body: text,
        truncated,
        redirects,
        ms: Date.now() - started,
      };
    }
    throw new ToolError("Demasiadas redirecciones.", 508);
  } finally {
    clearTimeout(timer);
  }
}

/** Como safeFetch pero devuelve null en vez de lanzar (para recursos opcionales). */
export async function tryFetch(input: string | URL, opts?: Parameters<typeof safeFetch>[1]) {
  try {
    return await safeFetch(input, opts);
  } catch {
    return null;
  }
}

/* ───────────── HTML ───────────── */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };
export function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
export const stripTags = (s: string) => decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const inner = tag.replace(/^<\s*[a-zA-Z0-9-]+/, "").replace(/\/?>$/, "");
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  return out;
}

export interface PageInfo {
  url: string;
  lang: string | null;
  title: string | null;
  metaDescription: string | null;
  metaDescriptionCount: number;
  robotsMeta: string | null;
  canonical: string | null;
  canonicalCount: number;
  h1: string[];
  h2Count: number;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd: { types: string[]; valid: number; invalid: number };
  links: { href: string; text: string }[];
  viewport: boolean;
  wordCount: number;
  imagesWithoutAlt: number;
  images: number;
}

export function parseHtml(html: string, baseUrl: string): PageInfo {
  const head = html.slice(0, 400_000);
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const linkTags = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const metaBy = (name: string) => metas.filter((a) => (a.name ?? "").toLowerCase() === name);

  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  for (const a of metas) {
    const key = (a.property ?? a.name ?? "").toLowerCase();
    if (key.startsWith("og:") && a.content && !og[key.slice(3)]) og[key.slice(3)] = a.content;
    if (key.startsWith("twitter:") && a.content && !twitter[key.slice(8)]) twitter[key.slice(8)] = a.content;
  }

  const canonicals = linkTags.filter((a) => (a.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"));
  const resolve = (href: string) => {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  };

  const types: string[] = [];
  let valid = 0;
  let invalid = 0;
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      valid++;
      const collect = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (node && typeof node === "object") {
          const t = (node as Record<string, unknown>)["@type"];
          if (typeof t === "string") types.push(t);
          if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.push(x));
          const g = (node as Record<string, unknown>)["@graph"];
          if (g) collect(g);
        }
      };
      collect(data);
    } catch {
      invalid++;
    }
  }

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const h1 = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripTags(m[1])).filter(Boolean);
  const h2Count = (body.match(/<h2\b/gi) ?? []).length;
  const links = [...body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ a: attrs(`<a ${m[1]}>`), text: stripTags(m[2]).slice(0, 120) }))
    .filter((l) => l.a.href && !/^(javascript:|mailto:|tel:|#)/i.test(l.a.href))
    .map((l) => ({ href: resolve(l.a.href), text: l.text || l.a.title || l.a["aria-label"] || "" }));
  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const bodyMatch = body.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const text = stripTags(bodyMatch ? bodyMatch[1] : body);
  const titleM = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const htmlTag = head.match(/<html\b[^>]*>/i);
  const desc = metaBy("description");

  return {
    url: baseUrl,
    lang: htmlTag ? attrs(htmlTag[0]).lang ?? null : null,
    title: titleM ? stripTags(titleM[1]) : null,
    metaDescription: desc[0]?.content?.trim() || null,
    metaDescriptionCount: desc.length,
    robotsMeta: metaBy("robots")[0]?.content ?? null,
    canonical: canonicals[0]?.href ? resolve(canonicals[0].href) : null,
    canonicalCount: canonicals.length,
    h1,
    h2Count,
    og,
    twitter,
    jsonLd: { types: [...new Set(types)], valid, invalid },
    links,
    viewport: metaBy("viewport").length > 0,
    wordCount: text ? text.split(/\s+/).length : 0,
    images: imgs.length,
    imagesWithoutAlt: imgs.filter((a) => !("alt" in a)).length,
  };
}

/* ───────────── robots.txt ───────────── */

export interface RobotsGroup {
  agents: string[];
  allow: string[];
  disallow: string[];
}
export interface ParsedRobots {
  groups: RobotsGroup[];
  sitemaps: string[];
}

export function parseRobots(txt: string): ParsedRobots {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === "sitemap" && value) sitemaps.push(value);
    else if (current && key === "allow") current.allow.push(value);
    else if (current && key === "disallow") current.disallow.push(value);
  }
  return { groups, sitemaps };
}

export type CrawlerAccess = "allowed" | "partial" | "blocked";
/** Acceso de un user-agent a la raíz del sitio según las reglas aplicables. */
export function crawlerAccess(robots: ParsedRobots, agent: string): { access: CrawlerAccess; group: string } {
  const a = agent.toLowerCase();
  const specific = robots.groups.filter((g) => g.agents.some((x) => x !== "*" && a.includes(x)));
  const groups = specific.length ? specific : robots.groups.filter((g) => g.agents.includes("*"));
  if (!groups.length) return { access: "allowed", group: "sin reglas" };
  const disallow = groups.flatMap((g) => g.disallow).filter(Boolean);
  const allow = groups.flatMap((g) => g.allow).filter(Boolean);
  const label = specific.length ? `User-agent: ${agent}` : "User-agent: *";
  if (disallow.some((d) => d === "/" || d === "/*") && !allow.some((x) => x === "/" || x === "/*" || x === "/$")) {
    return { access: allow.length ? "partial" : "blocked", group: label };
  }
  return { access: disallow.length ? "partial" : "allowed", group: label };
}

export { AI_CRAWLERS } from "./crawlers";

/* ───────────── Sitemaps ───────────── */

export function parseSitemap(xml: string): { kind: "index" | "urlset" | "unknown"; locs: string[] } {
  const kind = /<sitemapindex\b/i.test(xml) ? "index" : /<urlset\b/i.test(xml) ? "urlset" : "unknown";
  const locs = [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/gi)].map((m) => decodeEntities(m[1].trim()));
  return { kind, locs };
}
