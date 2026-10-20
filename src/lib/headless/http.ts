/** Utilidades HTTP de la API pública: CORS, ETag, caché y límite de peticiones. */
import "server-only";
import { createHash } from "node:crypto";

export const API_VERSION = "2026-10-01";

export const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, if-none-match",
  "access-control-expose-headers": "etag, link, x-total-count, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, x-ywc-api-version",
  "access-control-max-age": "86400",
};

export const preflight = () => new Response(null, { status: 204, headers: CORS_HEADERS });

/* ───────── límite de peticiones (ventana fija por clave, en memoria por instancia) ───────── */

const RATE_LIMIT = Number(process.env.YWC_API_RATE_LIMIT ?? 600); // peticiones por minuto
const WINDOW_MS = 60_000;
const buckets = new Map<string, { start: number; count: number }>();

export function rateLimit(id: string) {
  const now = Date.now();
  let b = buckets.get(id);
  if (!b || now - b.start >= WINDOW_MS) {
    b = { start: now, count: 0 };
    buckets.set(id, b);
    if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v.start >= WINDOW_MS) buckets.delete(k);
  }
  b.count++;
  const remaining = Math.max(0, RATE_LIMIT - b.count);
  const reset = Math.ceil((b.start + WINDOW_MS) / 1000);
  return {
    ok: b.count <= RATE_LIMIT,
    headers: { "x-ratelimit-limit": String(RATE_LIMIT), "x-ratelimit-remaining": String(remaining), "x-ratelimit-reset": String(reset) } as Record<string, string>,
    retryAfter: Math.max(1, reset - Math.floor(now / 1000)),
  };
}

/** IP del cliente para limitar peticiones anónimas (feeds). */
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";

/* ───────── respuestas ───────── */

export const etagOf = (body: string) => `W/"${createHash("sha1").update(body).digest("base64url").slice(0, 27)}"`;

function matches(req: Request, etag: string) {
  const inm = req.headers.get("if-none-match");
  return !!inm && inm.split(",").some((t) => t.trim() === etag || t.trim() === "*");
}

type Opts = { status?: number; headers?: Record<string, string>; cache?: string; contentType?: string };

/** Respuesta con ETag + 304 condicional + CORS. */
export function cachedResponse(req: Request, body: string, o: Opts = {}) {
  const etag = etagOf(body);
  const headers: Record<string, string> = {
    ...CORS_HEADERS,
    "content-type": o.contentType ?? "application/json; charset=utf-8",
    "cache-control": o.cache ?? "private, max-age=60, stale-while-revalidate=300",
    vary: "Authorization, Origin",
    etag,
    "x-ywc-api-version": API_VERSION,
    "x-content-type-options": "nosniff",
    ...o.headers,
  };
  if ((o.status ?? 200) === 200 && matches(req, etag)) return new Response(null, { status: 304, headers });
  return new Response(req.method === "HEAD" ? null : body, { status: o.status ?? 200, headers });
}

export function jsonResponse(req: Request, data: unknown, o: Opts = {}) {
  return cachedResponse(req, JSON.stringify(data), o);
}

export function apiError(status: number, code: string, message: string, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-ywc-api-version": API_VERSION, ...headers },
  });
}
