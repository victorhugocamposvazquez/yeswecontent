/**
 * Claves de la API de contenido.
 *   secret → ywc_live_<32 caracteres>  (solo en servidor)
 *   public → ywc_pub_<32 caracteres>   (navegador, restringible por origen)
 * En base de datos solo se guarda sha256(clave).
 */
import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { isDemo } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export type ApiKeyKind = "secret" | "public";

export interface ApiKeyRow {
  id: string;
  site_id: string;
  name: string;
  kind: ApiKeyKind;
  prefix: string;
  allowed_origins: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/** Clave de demostración: funciona contra la API en modo demo para el sitio s_tierrafina. */
export const DEMO_API_KEY = "ywc_live_demoTierrafina2026ProbandoLaApi01";
export const DEMO_PUBLIC_KEY = "ywc_pub_demoTierrafina2026ProbandoLaApi01";
export const DEMO_SITE_ID = "s_tierrafina";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export function generateApiKey(kind: ApiKeyKind = "secret") {
  const bytes = randomBytes(32);
  let body = "";
  for (const b of bytes) body += ALPHABET[b % ALPHABET.length];
  const key = `${kind === "public" ? "ywc_pub_" : "ywc_live_"}${body}`;
  return { key, hash: hashKey(key), prefix: key.slice(0, kind === "public" ? 12 : 13) };
}

export const keyKindOf = (key: string): ApiKeyKind | null => (key.startsWith("ywc_live_") ? "secret" : key.startsWith("ywc_pub_") ? "public" : null);

export function readBearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(\S+)$/i.exec(h.trim());
  if (m) return m[1];
  // Alternativa para entornos que no permiten cabeceras (p. ej. widgets): ?key=ywc_pub_…
  const q = new URL(req.url).searchParams.get("key");
  return q && q.startsWith("ywc_pub_") ? q : null;
}

const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export type KeyCheck = { ok: true; keyId: string; kind: ApiKeyKind } | { ok: false; status: 401 | 403; error: string };

const lastTouch = new Map<string, number>();

/** Valida la clave del Bearer contra el sitio pedido (y el origen, si es pública). */
export async function verifyApiKey(req: Request, siteId: string): Promise<KeyCheck> {
  const key = readBearer(req);
  if (!key) return { ok: false, status: 401, error: "Falta la clave de API. Envía Authorization: Bearer ywc_live_…" };
  const kind = keyKindOf(key);
  if (!kind) return { ok: false, status: 401, error: "Formato de clave no válido." };

  if (isDemo) {
    const expected = kind === "public" ? DEMO_PUBLIC_KEY : DEMO_API_KEY;
    if (siteId !== DEMO_SITE_ID) return { ok: false, status: 403, error: "En modo demo solo existe el sitio s_tierrafina." };
    if (!safeEqual(key, expected)) return { ok: false, status: 401, error: "Clave de API no válida o revocada." };
    return { ok: true, keyId: `demo_${kind}`, kind };
  }

  const sb = createServiceClient();
  const { data } = await sb
    .from("api_keys")
    .select("id, site_id, kind, allowed_origins, revoked_at")
    .eq("key_hash", hashKey(key))
    .maybeSingle();
  if (!data || data.revoked_at) return { ok: false, status: 401, error: "Clave de API no válida o revocada." };
  if (data.site_id !== siteId) return { ok: false, status: 403, error: "Esta clave no pertenece a este sitio." };

  if (data.kind === "public" && Array.isArray(data.allowed_origins) && data.allowed_origins.length) {
    const origin = req.headers.get("origin");
    if (!origin || !data.allowed_origins.includes(origin)) return { ok: false, status: 403, error: "Origen no permitido para esta clave pública." };
  }

  // last_used_at como mucho una vez por minuto y por instancia
  const now = Date.now();
  if ((lastTouch.get(data.id) ?? 0) < now - 60_000) {
    lastTouch.set(data.id, now);
    void sb.from("api_keys").update({ last_used_at: new Date(now).toISOString() }).eq("id", data.id).then(() => undefined);
  }
  return { ok: true, keyId: data.id, kind: data.kind as ApiKeyKind };
}
