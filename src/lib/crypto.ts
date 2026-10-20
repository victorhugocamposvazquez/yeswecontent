/**
 * Cifrado simétrico de credenciales (AES-256-GCM).
 * Clave: INTEGRATIONS_ENCRYPTION_KEY (32 bytes en base64 o hex; cualquier otro texto
 * se deriva con SHA-256). Formato del texto cifrado: "v1.<iv>.<tag>.<datos>" en base64url.
 */
import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "v1";

function keyFrom(raw: string): Buffer {
  const s = raw.trim();
  if (/^[0-9a-f]{64}$/i.test(s)) return Buffer.from(s, "hex");
  try {
    const b = Buffer.from(s, "base64");
    if (b.length === 32) return b;
  } catch {
    /* no es base64 */
  }
  return createHash("sha256").update(s).digest();
}

function encryptionKey(): Buffer {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  if (!raw) throw new Error("Falta INTEGRATIONS_ENCRYPTION_KEY: no podemos guardar credenciales sin cifrar.");
  return keyFrom(raw);
}

export const hasEncryptionKey = () => !!process.env.INTEGRATIONS_ENCRYPTION_KEY;

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), data.toString("base64url")].join(".");
}

export function decrypt(payload: string): string {
  const [v, iv, tag, data] = payload.split(".");
  if (v !== PREFIX || !iv || !tag || !data) throw new Error("Credencial cifrada con un formato desconocido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

export const encryptJson = (value: unknown) => encrypt(JSON.stringify(value));
export const decryptJson = <T = unknown>(payload: string): T => JSON.parse(decrypt(payload)) as T;

export const isEncrypted = (v: unknown): v is string => typeof v === "string" && v.startsWith(`${PREFIX}.`) && v.split(".").length === 4;

/** HMAC-SHA256 en base64url. */
export function hmac(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
