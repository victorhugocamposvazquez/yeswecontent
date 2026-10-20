import { NextResponse, type NextRequest } from "next/server";
import { syncSiteAnalytics } from "@/lib/analytics/sync";
import { guessGscProperty, listSearchConsoleSites } from "@/lib/analytics/google";
import { isDemo } from "@/lib/env";
import { getProvider } from "@/lib/oauth/providers";
import { backTo } from "@/lib/oauth/redirect";
import { safeEqual } from "@/lib/crypto";
import { cookieName, unpackCookie, verifyState } from "@/lib/oauth/state";
import { saveOAuthConnection, updateIntegrationMeta } from "@/lib/oauth/tokens";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ERRORS: Record<string, string> = {
  access_denied: "Has cancelado la autorización.",
  invalid_scope: "El proveedor no ha aceptado los permisos solicitados.",
};

/** Vuelta del proveedor: valida state + cookie, canjea el código y guarda los tokens cifrados. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  const p = getProvider(id);
  if (!p) return NextResponse.json({ error: "Proveedor desconocido" }, { status: 404 });
  const fallback = p.id === "google" ? "/panel/ajustes/analitica" : "/panel/ajustes/social";
  if (isDemo) return backTo(fallback, p.id, "ok");

  const sp = req.nextUrl.searchParams;
  let state: ReturnType<typeof verifyState> = null;
  try {
    state = verifyState(sp.get("state"));
  } catch {
    state = null;
  }
  const ret = state?.r ?? fallback;
  const clear = (res: NextResponse) => {
    res.cookies.set(cookieName(p.id), "", { path: `/api/oauth/${p.id}`, maxAge: 0 });
    return res;
  };

  if (!state || state.p !== p.id) return clear(backTo(ret, p.id, "error", "La solicitud ha caducado o no es válida. Inténtalo de nuevo."));
  const err = sp.get("error");
  if (err) return clear(backTo(ret, p.id, "error", ERRORS[err] ?? sp.get("error_description") ?? err));
  const code = sp.get("code");
  if (!code) return clear(backTo(ret, p.id, "error", "Falta el código de autorización."));

  const cookie = unpackCookie(req.cookies.get(cookieName(p.id))?.value);
  if (!cookie || !safeEqual(cookie.nonce, state.n)) return clear(backTo(ret, p.id, "error", "No hemos podido verificar la solicitud (cookie). Vuelve a intentarlo desde el mismo navegador."));

  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user || auth.user.id !== state.u) return clear(backTo(ret, p.id, "error", "La sesión no coincide con la que inició la conexión."));
  const { data: site } = await sb.from("sites").select("id, url").eq("id", state.s).maybeSingle();
  if (!site) return clear(backTo(ret, p.id, "error", "No tienes acceso a ese sitio."));

  try {
    const tokens = await p.exchange(code, p.pkce ? cookie.verifier : null);
    const account = await p.account(tokens.access_token);
    await saveOAuthConnection(sb, site.id, p.id, tokens, account);

    // Google: si solo hay una propiedad que encaje con la web, la dejamos elegida y sincronizamos ya.
    if (p.id === "google") {
      try {
        const sites = await listSearchConsoleSites(tokens.access_token);
        const guess = guessGscProperty(sites, site.url);
        if (guess) {
          await updateIntegrationMeta(sb, site.id, "google", { gsc_property: guess });
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) await syncSiteAnalytics(createServiceClient(), site.id, { days: 90 });
        }
      } catch {
        /* el usuario elegirá la propiedad a mano */
      }
    }
    return clear(backTo(ret, p.id, "ok"));
  } catch (e) {
    return clear(backTo(ret, p.id, "error", e instanceof Error ? e.message : "No se ha podido completar la conexión."));
  }
}
