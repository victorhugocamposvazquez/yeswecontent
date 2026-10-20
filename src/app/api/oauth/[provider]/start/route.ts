import { NextResponse, type NextRequest } from "next/server";
import { hasEncryptionKey } from "@/lib/crypto";
import { isDemo } from "@/lib/env";
import { authorizeUrl, getProvider } from "@/lib/oauth/providers";
import { backTo } from "@/lib/oauth/redirect";
import { STATE_TTL_MS, cookieName, packCookie, pkcePair, safeReturnPath, signState } from "@/lib/oauth/state";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Inicia la conexión OAuth: /api/oauth/{google|meta|reddit}/start?site=<site_id>&return=/panel/ajustes/analitica
 * En modo demo simula el éxito y vuelve directamente.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  const p = getProvider(id);
  const ret = safeReturnPath(req.nextUrl.searchParams.get("return"), id === "google" ? "/panel/ajustes/analitica" : "/panel/ajustes/social");
  if (!p) return NextResponse.json({ error: "Proveedor desconocido" }, { status: 404 });
  if (isDemo) return backTo(ret, p.id, "ok");

  if (!p.configured()) return backTo(ret, p.id, "error", `Falta configurar la app de ${p.label} (variables de entorno).`);
  if (!process.env.OAUTH_STATE_SECRET || !hasEncryptionKey()) return backTo(ret, p.id, "error", "Faltan OAUTH_STATE_SECRET o INTEGRATIONS_ENCRYPTION_KEY en el servidor.");

  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.redirect(new URL(`/entrar?next=${encodeURIComponent(ret)}`, req.url));

  const siteId = req.nextUrl.searchParams.get("site") ?? "";
  // RLS: solo devuelve el sitio si el usuario tiene acceso.
  const { data: site } = /^[0-9a-f-]{36}$/i.test(siteId) ? await sb.from("sites").select("id").eq("id", siteId).maybeSingle() : { data: null };
  if (!site) return backTo(ret, p.id, "error", "No tienes acceso a ese sitio.");

  const { verifier, challenge } = p.pkce ? pkcePair() : { verifier: "", challenge: null };
  const { value: state, nonce } = signState({ p: p.id, s: site.id, r: ret, u: auth.user.id });

  const res = NextResponse.redirect(authorizeUrl(p, state, challenge), { status: 303 });
  res.cookies.set(cookieName(p.id), packCookie(nonce, verifier), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/api/oauth/${p.id}`,
    maxAge: Math.floor(STATE_TTL_MS / 1000),
  });
  return res;
}
