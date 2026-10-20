import "server-only";
import { NextResponse } from "next/server";
import { isDemo } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Para las rutas /api/ai: en modo demo deja pasar; si no, exige sesión. */
export async function requireUser(): Promise<{ userId: string | null; error: NextResponse | null }> {
  if (isDemo) return { userId: null, error: null };
  const sb = await createClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { userId: null, error: NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 }) };
  return { userId: data.user.id, error: null };
}

/** Autoriza los cron de Vercel (cabecera Authorization: Bearer CRON_SECRET). */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Evita que /api/ai/analyze-site se use para leer direcciones internas. */
export function isPublicHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h.endsWith(".localhost") ||
      h.endsWith(".internal") ||
      h.endsWith(".local") ||
      /^\[?::1\]?$/.test(h) ||
      /^(0|10|127)\./.test(h) ||
      /^169\.254\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      /^\[?(fc|fd|fe80)/i.test(h)
    )
      return null;
    if (!h.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}
