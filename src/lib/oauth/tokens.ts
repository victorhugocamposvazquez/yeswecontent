/**
 * Credenciales de integraciones guardadas CIFRADAS en `integrations.config`:
 *
 *   { v: 1, secret: "v1.<iv>.<tag>.<datos>", account: { id, name }, meta: { …datos no sensibles… } }
 *
 * `secret` (AES-256-GCM) contiene los tokens OAuth o las credenciales del CMS.
 * `account` y `meta` son visibles en el panel (cuenta conectada, propiedad elegida…).
 * Las filas antiguas en JSON plano se siguen leyendo (compatibilidad).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptJson, encryptJson, isEncrypted } from "@/lib/crypto";
import { toIntegrationConfig, type IntegrationConfig } from "@/lib/publish";
import type { Integration, IntegrationMeta } from "@/lib/types";
import { getProvider, type OAuthAccount, type OAuthProviderId, type TokenSet } from "./providers";

export interface StoredConfig {
  v: 1;
  secret: string;
  account?: OAuthAccount | null;
  meta?: IntegrationMeta;
}

export interface OAuthSecret {
  tokens: TokenSet;
  /** Meta: token de la página elegida (no caduca si se obtuvo con un token de usuario largo). */
  page_token?: string;
}

export interface IntegrationRow {
  id?: string;
  site_id?: string;
  provider: string;
  status?: string;
  config: unknown;
  created_at?: string;
}

const isStored = (c: unknown): c is StoredConfig => !!c && typeof c === "object" && (c as StoredConfig).v === 1 && isEncrypted((c as StoredConfig).secret);

/** Empaqueta credenciales cifradas para guardarlas en `integrations.config`. */
export function sealConfig(secret: unknown, extra: { account?: OAuthAccount | null; meta?: IntegrationMeta } = {}): StoredConfig {
  return { v: 1, secret: encryptJson(secret), ...(extra.account !== undefined ? { account: extra.account } : {}), meta: extra.meta ?? {} };
}

/** Descifra la parte secreta (o devuelve el JSON plano de filas antiguas). */
export function openSecret<T = Record<string, unknown>>(config: unknown): T | null {
  if (isStored(config)) return decryptJson<T>(config.secret);
  if (config && typeof config === "object") return config as T;
  return null;
}

export function metaOf(config: unknown): IntegrationMeta {
  return (isStored(config) ? config.meta : null) ?? {};
}

/**
 * CMS: fila de `integrations` → configuración lista para `publish()`.
 * Úsalo en lugar de `toIntegrationConfig(row)` allí donde se lean filas de la base de datos.
 */
export function loadIntegrationConfig(row: IntegrationRow): IntegrationConfig | null {
  try {
    const plain = openSecret(row.config);
    return plain ? toIntegrationConfig({ provider: row.provider, config: plain }) : null;
  } catch {
    return null; // clave cambiada o dato corrupto: tratamos la integración como no disponible
  }
}

/** Fila → datos públicos para el panel (sin secretos). */
export function toPublicIntegration(row: IntegrationRow & { id: string; site_id: string; status: string; created_at: string }): Integration {
  const c = row.config as Partial<StoredConfig> | null;
  return {
    id: row.id,
    site_id: row.site_id,
    provider: row.provider,
    status: row.status,
    created_at: row.created_at,
    account_name: isStored(c) ? (c.account?.name ?? null) : null,
    meta: metaOf(c),
  };
}

export async function getIntegrationRow(sb: SupabaseClient, siteId: string, provider: string): Promise<(IntegrationRow & { status: string }) | null> {
  const { data } = await sb.from("integrations").select("id, site_id, provider, status, config, created_at").eq("site_id", siteId).eq("provider", provider).maybeSingle();
  return data;
}

/** Configuración descifrada de una integración del sitio (secretos + metadatos). */
export async function getIntegrationConfig<T = OAuthSecret>(
  sb: SupabaseClient,
  siteId: string,
  provider: string,
): Promise<{ status: string; secret: T; account: OAuthAccount | null; meta: IntegrationMeta } | null> {
  const row = await getIntegrationRow(sb, siteId, provider);
  if (!row) return null;
  const secret = openSecret<T>(row.config);
  if (!secret) return null;
  const c = row.config as Partial<StoredConfig>;
  return { status: row.status, secret, account: isStored(c) ? (c.account ?? null) : null, meta: metaOf(c) };
}

/** Guarda (o reemplaza) una conexión OAuth recién autorizada. */
export async function saveOAuthConnection(sb: SupabaseClient, siteId: string, provider: OAuthProviderId, tokens: TokenSet, account: OAuthAccount, meta: IntegrationMeta = {}) {
  const prev = await getIntegrationRow(sb, siteId, provider);
  const prevMeta = prev ? metaOf(prev.config) : {};
  // Si es la misma cuenta, conservamos lo ya elegido (propiedades, página…).
  const sameAccount = prev && isStored(prev.config) && prev.config.account?.id === account.id;
  const prevSecret = sameAccount ? (openSecret<OAuthSecret>(prev.config) ?? null) : null;
  // Google no siempre reenvía el refresh_token: mantenemos el anterior si falta.
  const merged: TokenSet = { ...tokens, refresh_token: tokens.refresh_token ?? prevSecret?.tokens.refresh_token ?? null };
  const config = sealConfig(
    { ...(prevSecret ?? {}), tokens: merged } satisfies OAuthSecret,
    { account, meta: { ...(sameAccount ? prevMeta : {}), ...meta, connected_at: new Date().toISOString(), last_error: null } },
  );
  const { error } = await sb.from("integrations").upsert({ site_id: siteId, provider, status: "connected", config }, { onConflict: "site_id,provider" });
  if (error) throw new Error(error.message);
}

/** Actualiza los metadatos visibles (propiedad elegida, última sincronización…). */
export async function updateIntegrationMeta(sb: SupabaseClient, siteId: string, provider: string, patch: IntegrationMeta, status?: string) {
  const row = await getIntegrationRow(sb, siteId, provider);
  if (!row || !isStored(row.config)) throw new Error("La integración no está conectada.");
  const config: StoredConfig = { ...row.config, meta: { ...metaOf(row.config), ...patch } };
  const { error } = await sb.from("integrations").update({ config, ...(status ? { status } : {}) }).eq("site_id", siteId).eq("provider", provider);
  if (error) throw new Error(error.message);
}

/** Actualiza la parte secreta (p. ej. tras refrescar el token o elegir página). */
export async function updateIntegrationSecret<T extends object>(sb: SupabaseClient, siteId: string, provider: string, patch: Partial<T>, metaPatch?: IntegrationMeta) {
  const row = await getIntegrationRow(sb, siteId, provider);
  if (!row || !isStored(row.config)) throw new Error("La integración no está conectada.");
  const current = openSecret<T>(row.config) ?? ({} as T);
  const config: StoredConfig = { ...row.config, secret: encryptJson({ ...current, ...patch }), meta: { ...metaOf(row.config), ...(metaPatch ?? {}) } };
  const { error } = await sb.from("integrations").update({ config }).eq("site_id", siteId).eq("provider", provider);
  if (error) throw new Error(error.message);
}

const SKEW_MS = 2 * 60 * 1000;

/**
 * Token de acceso válido para llamar a la API del proveedor.
 * Refresca automáticamente si caduca en menos de 2 minutos y guarda el nuevo.
 */
export async function getAccessToken(sb: SupabaseClient, siteId: string, provider: OAuthProviderId): Promise<{ token: string; secret: OAuthSecret; meta: IntegrationMeta }> {
  const cfg = await getIntegrationConfig<OAuthSecret>(sb, siteId, provider);
  if (!cfg?.secret?.tokens?.access_token) throw new Error(`No hay ninguna cuenta de ${getProvider(provider)?.label ?? provider} conectada.`);
  const { tokens } = cfg.secret;
  if (!tokens.expires_at || tokens.expires_at - SKEW_MS > Date.now()) return { token: tokens.access_token, secret: cfg.secret, meta: cfg.meta };

  const p = getProvider(provider);
  if (!p?.refresh || !tokens.refresh_token) {
    await updateIntegrationMeta(sb, siteId, provider, { last_error: "La autorización ha caducado. Vuelve a conectar la cuenta." }, "error").catch(() => undefined);
    throw new Error("La autorización ha caducado. Vuelve a conectar la cuenta.");
  }
  try {
    const fresh = await p.refresh(tokens.refresh_token);
    await updateIntegrationSecret<OAuthSecret>(sb, siteId, provider, { tokens: fresh });
    return { token: fresh.access_token, secret: { ...cfg.secret, tokens: fresh }, meta: cfg.meta };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updateIntegrationMeta(sb, siteId, provider, { last_error: `No pudimos renovar el acceso: ${msg}` }, "error").catch(() => undefined);
    throw e;
  }
}

/** Revoca en el proveedor (si se puede) antes de borrar la fila. */
export async function revokeConnection(sb: SupabaseClient, siteId: string, provider: OAuthProviderId) {
  const p = getProvider(provider);
  try {
    const cfg = await getIntegrationConfig<OAuthSecret>(sb, siteId, provider);
    const t = cfg?.secret?.tokens;
    if (p?.revoke && t) await p.revoke(t.refresh_token ?? t.access_token);
  } catch {
    /* revocar es lo deseable, pero no bloquea la desconexión */
  }
}
