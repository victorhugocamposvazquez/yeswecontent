import type { Plan, Subscription } from "@/lib/types";

/** MRR en céntimos de una suscripción (precio anual expresado por mes). */
export function mrrFor(plan: Pick<Plan, "monthly_price_eur" | "yearly_price_eur">, interval: Subscription["interval"], quantity = 1) {
  return (interval === "year" ? plan.yearly_price_eur : plan.monthly_price_eur) * quantity;
}

/** Descuento por volumen (porcentaje) según número de sitios. */
export function volumePct(tiers: { from: number; to: number | null; pct: number }[], sites: number) {
  const t = tiers.find((x) => sites >= x.from && (x.to === null || sites <= x.to));
  return t?.pct ?? 0;
}
