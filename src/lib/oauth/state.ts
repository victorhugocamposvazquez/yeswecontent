/**
 * Parámetro `state` de OAuth firmado con HMAC (OAUTH_STATE_SECRET).
 * Lleva el sitio, la ruta de vuelta, el usuario y un nonce que también guardamos
 * en una cookie httpOnly junto al code_verifier de PKCE: así el callback solo
 * acepta respuestas iniciadas desde este navegador y en los últimos 10 minutos.
 */
import "server-only";
import { createHash } from "node:crypto";
import { hmac, randomToken, safeEqual } from "@/lib/crypto";

export const STATE_TTL_MS = 10 * 60 * 1000;

export interface OAuthState {
  p: string; // proveedor
  s: string; // site_id
  r: string; // ruta de vuelta (relativa)
  u: string; // user_id que inició el flujo
  n: string; // nonce (coincide con la cookie)
  t: number; // emitido (ms)
}

function secret(): string {
  const s = process.env.OAUTH_STATE_SECRET;
  if (!s) throw new Error("Falta OAUTH_STATE_SECRET.");
  return s;
}

export function signState(state: Omit<OAuthState, "t" | "n"> & { n?: string }): { value: string; nonce: string } {
  const full: OAuthState = { ...state, n: state.n ?? randomToken(16), t: Date.now() };
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  return { value: `${body}.${hmac(secret(), body)}`, nonce: full.n };
}

export function verifyState(value: string | null): OAuthState | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig || !safeEqual(sig, hmac(secret(), body))) return null;
  try {
    const st = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthState;
    if (typeof st.t !== "number" || Date.now() - st.t > STATE_TTL_MS) return null;
    return st;
  } catch {
    return null;
  }
}

/** Solo rutas internas: evita redirecciones abiertas. */
export function safeReturnPath(raw: string | null | undefined, fallback = "/panel/ajustes/analitica"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  return raw;
}

/** PKCE (RFC 7636, método S256). */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomToken(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export const cookieName = (provider: string) => `ywc_oauth_${provider}`;

/** Valor de la cookie: nonce y verifier firmados (no se pueden fabricar). */
export function packCookie(nonce: string, verifier: string): string {
  const body = `${nonce}~${verifier}`;
  return `${body}~${hmac(secret(), body)}`;
}

export function unpackCookie(value: string | undefined): { nonce: string; verifier: string } | null {
  if (!value) return null;
  const [nonce, verifier, sig] = value.split("~");
  if (!nonce || verifier === undefined || !sig) return null;
  return safeEqual(sig, hmac(secret(), `${nonce}~${verifier}`)) ? { nonce, verifier } : null;
}
