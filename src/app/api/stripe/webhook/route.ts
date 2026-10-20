import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe, mapStatus } from "@/lib/stripe";
import { sendPaymentFailedEmail, sendTrialEndingEmail } from "@/lib/email";
import { eur } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const iso = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);
const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : (x?.id ?? null));

/**
 * Sincroniza una suscripción de Stripe con public.subscriptions.
 * Una fila por sitio: metadata.site_id, o los sitios del workspace hasta la cantidad contratada.
 */
async function syncSubscription(sub: Stripe.Subscription, extra: Stripe.Metadata | null = null) {
  const db = createServiceClient();
  const meta = { ...sub.metadata, ...(extra ?? {}) };
  const item = sub.items.data[0];
  const priceId = item?.price.id;

  let planId = meta.plan_id;
  if (!planId && priceId) {
    const { data } = await db.from("plans").select("id").or(`stripe_price_monthly.eq.${priceId},stripe_price_yearly.eq.${priceId}`).maybeSingle();
    planId = data?.id;
  }

  const fields = {
    status: mapStatus(sub.status),
    interval: item?.price.recurring?.interval === "year" ? "year" : "month",
    trial_ends_at: iso(sub.trial_end),
    current_period_end: iso(item?.current_period_end),
    stripe_customer_id: idOf(sub.customer),
    stripe_subscription_id: sub.id,
    ...(planId ? { plan_id: planId } : {}),
  };

  // Filas ya vinculadas a esta suscripción.
  const { data: existing } = await db.from("subscriptions").select("id, site_id").eq("stripe_subscription_id", sub.id);
  let siteIds: string[] = [];
  if (meta.site_id) siteIds = [meta.site_id];
  else if (meta.workspace_id) {
    const { data: sites } = await db.from("sites").select("id").eq("workspace_id", meta.workspace_id).order("created_at").limit(item?.quantity ?? 1);
    siteIds = (sites ?? []).map((s) => s.id);
  }
  const known = new Set((existing ?? []).map((e) => e.site_id));

  if (existing?.length) {
    const { error } = await db.from("subscriptions").update(fields).eq("stripe_subscription_id", sub.id);
    if (error) throw error;
  }
  const toInsert = siteIds.filter((s) => !known.has(s));
  if (toInsert.length) {
    if (!planId) throw new Error(`Suscripción ${sub.id} sin plan reconocible`);
    // Una prueba previa creada en el alta (sin Stripe) se sustituye por la real.
    await db.from("subscriptions").delete().in("site_id", toInsert).is("stripe_subscription_id", null);
    const { error } = await db.from("subscriptions").insert(toInsert.map((site_id) => ({ site_id, ...fields, plan_id: planId })));
    if (error) throw error;
  }
  if (!existing?.length && !toInsert.length) console.warn(`[stripe/webhook] ${sub.id}: sin sitio al que asociar (falta site_id/workspace_id o el workspace no tiene sitios)`);
}

async function customerEmail(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) return null;
  if (typeof customer !== "string") return "deleted" in customer ? null : customer.email;
  const c = await getStripe().customers.retrieve(customer);
  return "deleted" in c ? null : c.email;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Stripe no configurado" }, { status: 501 });
  if (!signature) return NextResponse.json({ error: "Falta la firma" }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (e) {
    console.warn("[stripe/webhook] firma no válida", e);
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subId = idOf(session.subscription);
        if (subId) await syncSubscription(await stripe.subscriptions.retrieve(subId), session.metadata);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object;
        const email = await customerEmail(sub.customer);
        if (email && sub.trial_end) {
          let siteName = "tu web";
          if (sub.metadata.site_id) {
            const { data } = await createServiceClient().from("sites").select("name").eq("id", sub.metadata.site_id).maybeSingle();
            siteName = data?.name ?? siteName;
          }
          await sendTrialEndingEmail(email, { siteName, endsAt: new Date(sub.trial_end * 1000) });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = idOf(invoice.parent?.subscription_details?.subscription);
        if (subId) await createServiceClient().from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", subId);
        const email = invoice.customer_email ?? (await customerEmail(invoice.customer));
        if (email) {
          let portalUrl: string | undefined;
          const cust = idOf(invoice.customer);
          if (cust) portalUrl = (await stripe.billingPortal.sessions.create({ customer: cust, locale: "es" })).url;
          await sendPaymentFailedEmail(email, { amount: eur(invoice.amount_due), portalUrl });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error(`[stripe/webhook] error procesando ${event.type}`, e);
    return NextResponse.json({ error: "Error procesando el evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
