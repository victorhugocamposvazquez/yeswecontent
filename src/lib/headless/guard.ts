import "server-only";
import { isValidSiteId } from "./content";
import { apiError, clientIp, rateLimit } from "./http";
import { verifyApiKey } from "./keys";

/** Valida sitio + clave + límite. Devuelve la respuesta de error o las cabeceras de límite. */
export async function guardApi(req: Request, siteId: string): Promise<{ error: Response } | { error: null; headers: Record<string, string> }> {
  if (!isValidSiteId(siteId)) return { error: apiError(404, "site_not_found", "Sitio no encontrado.") };
  const pre = rateLimit(`ip:${clientIp(req)}`);
  if (!pre.ok) return { error: apiError(429, "rate_limited", "Demasiadas peticiones.", { ...pre.headers, "retry-after": String(pre.retryAfter) }) };
  const check = await verifyApiKey(req, siteId);
  if (!check.ok) return { error: apiError(check.status, check.status === 401 ? "unauthorized" : "forbidden", check.error, { "www-authenticate": 'Bearer realm="yeswecontent"' }) };
  const rl = rateLimit(`key:${check.keyId}`);
  if (!rl.ok) return { error: apiError(429, "rate_limited", "Has superado el límite de peticiones por minuto.", { ...rl.headers, "retry-after": String(rl.retryAfter) }) };
  return { error: null, headers: rl.headers };
}

/** Límite para endpoints públicos sin clave (feeds, sitemap). */
export function guardPublic(req: Request, siteId: string): { error: Response } | { error: null; headers: Record<string, string> } {
  if (!isValidSiteId(siteId)) return { error: apiError(404, "site_not_found", "Sitio no encontrado.") };
  const rl = rateLimit(`pub:${clientIp(req)}`);
  if (!rl.ok) return { error: apiError(429, "rate_limited", "Demasiadas peticiones.", { ...rl.headers, "retry-after": String(rl.retryAfter) }) };
  return { error: null, headers: rl.headers };
}
