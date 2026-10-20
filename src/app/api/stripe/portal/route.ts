import { NextResponse } from "next/server";
import { hasStripe, isDemo, siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { returnPath? } → { url } del portal de facturación de Stripe. */
export async function POST(req: Request) {
  if (!hasStripe || isDemo) return NextResponse.json({ url: null, demo: true });
  const body = (await req.json().catch(() => ({}))) as { returnPath?: string };
  const returnPath = typeof body.returnPath === "string" && body.returnPath.startsWith("/") && !body.returnPath.startsWith("//") ? body.returnPath : "/panel";

  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicia sesión para continuar" }, { status: 401 });

  // RLS limita las suscripciones a los sitios a los que el usuario tiene acceso.
  const { data } = await sb
    .from("subscriptions")
    .select("stripe_customer_id")
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.stripe_customer_id) return NextResponse.json({ error: "Aún no tienes facturación activa" }, { status: 404 });

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${siteUrl}${returnPath}`,
      locale: "es",
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/portal]", e);
    return NextResponse.json({ error: "No se pudo abrir la facturación" }, { status: 502 });
  }
}
