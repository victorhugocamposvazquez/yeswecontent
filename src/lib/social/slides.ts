/**
 * URLs firmadas de las diapositivas que renderiza /api/social/slide (PNG 1080×1080).
 * La firma evita que cualquiera genere imágenes con texto arbitrario bajo nuestro dominio.
 */
import "server-only";
import { hmac, safeEqual } from "@/lib/crypto";
import { isDemo, siteUrl } from "@/lib/env";

export interface SlideParams {
  text: string;
  brand: string;
  index: number;
  total: number;
}

const secret = () => process.env.OAUTH_STATE_SECRET ?? process.env.CRON_SECRET ?? "";
const payload = (p: SlideParams) => [p.text, p.brand, p.index, p.total].join("\u0000");

export function slideSignature(p: SlideParams): string {
  const s = secret();
  return s ? hmac(s, payload(p)).slice(0, 32) : "";
}

export function verifySlide(p: SlideParams, sig: string | null): boolean {
  const s = secret();
  if (!s) return isDemo; // sin secreto solo dejamos renderizar en demo
  return !!sig && safeEqual(sig, slideSignature(p));
}

export function slideUrl(p: SlideParams, base = siteUrl): string {
  const q = new URLSearchParams({ t: p.text.slice(0, 280), b: p.brand.slice(0, 60), i: String(p.index), n: String(p.total) });
  q.set("s", slideSignature({ ...p, text: p.text.slice(0, 280), brand: p.brand.slice(0, 60) }));
  return `${base.replace(/\/$/, "")}/api/social/slide?${q}`;
}
