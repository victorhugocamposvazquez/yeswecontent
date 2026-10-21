import type { Plan } from "./types";

export type PlanInterval = "month" | "year";

/** Precio en céntimos por mes (con anual, la cuota mensual equivalente del pago anual). */
export function planMonthlyCents(p: Pick<Plan, "monthly_price_eur" | "yearly_price_eur">, interval: PlanInterval) {
  return interval === "year" ? p.yearly_price_eur || p.monthly_price_eur : p.monthly_price_eur;
}

/** Importe total del año en céntimos según la periodicidad elegida. */
export function planYearlyTotalCents(p: Pick<Plan, "monthly_price_eur" | "yearly_price_eur">, interval: PlanInterval) {
  return planMonthlyCents(p, interval) * 12;
}

/** Total anual si se paga el tarifario mensual cada mes. */
export function planYearlyTotalAtMonthlyRate(p: Pick<Plan, "monthly_price_eur">) {
  return p.monthly_price_eur * 12;
}

/** Total anual con el precio anual (cuota mensual × 12). */
export function planYearlyTotalAtAnnualRate(p: Pick<Plan, "monthly_price_eur" | "yearly_price_eur">) {
  return (p.yearly_price_eur || p.monthly_price_eur) * 12;
}

export function planAnnualSavingsPercent(p: Pick<Plan, "monthly_price_eur" | "yearly_price_eur">) {
  if (!p.monthly_price_eur || !p.yearly_price_eur) return 0;
  return Math.round((1 - p.yearly_price_eur / p.monthly_price_eur) * 100);
}

export function maxPlanAnnualSavingsPercent(plans: Pick<Plan, "monthly_price_eur" | "yearly_price_eur">[]) {
  return Math.max(0, ...plans.map(planAnnualSavingsPercent));
}

/** Ahorro en céntimos al año: mensual × 12 menos anual × 12. */
export function planAnnualSavingsCents(p: Pick<Plan, "monthly_price_eur" | "yearly_price_eur">) {
  return Math.max(0, planYearlyTotalAtMonthlyRate(p) - planYearlyTotalAtAnnualRate(p));
}
