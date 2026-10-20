import "server-only";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { volumePct } from "@/lib/admin/mrr";
import type { VolumeTier } from "@/lib/admin/types";
import { volumeDiscounts } from "@/lib/demo";

let client: Stripe | null = null;

/** Cliente de Stripe perezoso: no falla en build si falta la clave. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY");
  client ??= new Stripe(key, { appInfo: { name: "yeswecontent" } });
  return client;
}

export const TRIAL_DAYS = 3;

/** Tramos de descuento por volumen: app_settings.volume_discounts o los de por defecto. */
export async function loadVolumeTiers(): Promise<VolumeTier[]> {
  try {
    const { data } = await createServiceClient().from("app_settings").select("value").eq("key", "volume_discounts").maybeSingle();
    if (Array.isArray(data?.value)) return data.value as VolumeTier[];
  } catch {
    // tabla aún no creada
  }
  return volumeDiscounts;
}

/**
 * Cupón de Stripe para un porcentaje de descuento por volumen. Se crea una vez
 * con id determinista (`ywc-vol-14`) y se reutiliza.
 */
export async function ensureVolumeCoupon(pct: number): Promise<string | null> {
  if (pct <= 0) return null;
  const stripe = getStripe();
  const id = `ywc-vol-${String(pct).replace(".", "_")}`;
  try {
    await stripe.coupons.retrieve(id);
  } catch {
    await stripe.coupons.create({ id, percent_off: pct, duration: "forever", name: `Volumen -${pct}%` });
  }
  return id;
}

export async function volumeCouponFor(sites: number) {
  return ensureVolumeCoupon(volumePct(await loadVolumeTiers(), sites));
}

/** Traduce el estado de Stripe al de nuestra tabla. */
export function mapStatus(s: Stripe.Subscription.Status): "trialing" | "active" | "past_due" | "canceled" {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "paused":
      return "past_due";
    default:
      return "canceled";
  }
}
