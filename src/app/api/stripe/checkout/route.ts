import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { hasStripe, isDemo, siteUrl } from "@/lib/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe, TRIAL_DAYS, volumeCouponFor } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  planId: z.string().min(1),
  interval: z.enum(["month", "year"]),
  sites: z.coerce.number().int().min(1).max(500).optional(),
  siteId: z.string().uuid().optional(),
});

/**
 * POST { planId, interval, sites?, siteId? } → { url }
 * Crea una sesión de Checkout en modo suscripción con prueba de 3 días
 * (solo la primera vez) y descuento por volumen según el número de sitios.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
  const { planId, interval, siteId } = parsed.data;
  const quantity = parsed.data.sites ?? 1;

  if (!hasStripe) return NextResponse.json({ url: null, demo: true });
  if (isDemo) return NextResponse.json({ error: "Stripe requiere Supabase configurado" }, { status: 400 });

  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Inicia sesión para continuar" }, { status: 401 });

  const db = createServiceClient();
  const { data: membership } = await db
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", auth.user.id)
    .in("role", ["owner", "editor"])
    .limit(1)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "No tienes un espacio de trabajo" }, { status: 400 });
  const workspaceId: string = membership.workspace_id;

  if (siteId) {
    const { data: site } = await db.from("sites").select("id").eq("id", siteId).eq("workspace_id", workspaceId).maybeSingle();
    if (!site) return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 });
  }

  const { data: plan } = await db.from("plans").select("*").eq("id", planId).eq("active", true).maybeSingle();
  if (!plan) return NextResponse.json({ error: "Plan no disponible" }, { status: 404 });
  const price: string | null = interval === "year" ? plan.stripe_price_yearly : plan.stripe_price_monthly;
  if (!price) return NextResponse.json({ error: "Este plan aún no tiene precio en Stripe. Escríbenos y lo activamos." }, { status: 400 });

  // ¿Ya tuvo suscripción? Reutiliza el cliente de Stripe y no repite la prueba.
  const { data: wsSites } = await db.from("sites").select("id").eq("workspace_id", workspaceId);
  const ids = (wsSites ?? []).map((s) => s.id);
  const { data: previous } = ids.length
    ? await db.from("subscriptions").select("stripe_customer_id").in("site_id", ids).order("created_at", { ascending: false })
    : { data: [] as { stripe_customer_id: string | null }[] };
  const customer = previous?.find((p) => p.stripe_customer_id)?.stripe_customer_id ?? undefined;
  const firstTime = !previous?.length;

  const metadata: Record<string, string> = { workspace_id: workspaceId, plan_id: planId, user_id: auth.user.id, sites: String(quantity) };
  if (siteId) metadata.site_id = siteId;

  const coupon = await volumeCouponFor(quantity);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price, quantity }],
    subscription_data: { metadata, ...(firstTime ? { trial_period_days: TRIAL_DAYS } : {}) },
    metadata,
    client_reference_id: workspaceId,
    locale: "es",
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
    success_url: `${siteUrl}/panel?checkout=ok&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/precios?checkout=cancelado`,
    ...(customer ? { customer, customer_update: { name: "auto", address: "auto" } } : { customer_email: auth.user.email }),
    ...(coupon ? { discounts: [{ coupon }] } : { allow_promotion_codes: true }),
  };

  try {
    const session = await getStripe().checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe/checkout]", e);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 502 });
  }
}
