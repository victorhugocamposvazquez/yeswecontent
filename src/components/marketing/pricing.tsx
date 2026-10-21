"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { Stagger } from "./scroll-fx";
import { cn, eur } from "@/lib/utils";
import type { Plan } from "@/lib/types";
import { maxPlanAnnualSavingsPercent, planAnnualSavingsPercent, planMonthlyCents, planYearlyTotalAtAnnualRate, type PlanInterval } from "@/lib/plans";
import { Badge, Button, ButtonLink, Input, Label, Select } from "@/components/ui";
import { Eyebrow, Title } from "./primitives";

type Interval = PlanInterval;
interface Discount {
  from: number;
  to: number | null;
  pct: number;
}

const price = (p: Plan, i: Interval) => planMonthlyCents(p, i);
const savings = (p: Plan) => planAnnualSavingsPercent(p);

export function Pricing({ plans, discounts }: { plans: Plan[]; discounts: Discount[] }) {
  const [interval, setPeriod] = useState<Interval>("year");
  const maxSave = maxPlanAnnualSavingsPercent(plans);

  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Periodo de facturación" className="inline-flex items-center rounded-xl border border-line bg-card p-1 shadow-[var(--shadow-xs)]">
          {(["month", "year"] as const).map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={interval === i}
              onClick={() => setPeriod(i)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-150",
                interval === i ? "bg-ink text-paper shadow-[var(--shadow-xs)]" : "text-ink-2 hover:text-ink",
              )}
            >
              {i === "month" ? "Mensual" : "Anual"}
              {i === "year" && maxSave > 0 && (
                <span className={cn("tabular rounded-full px-1.5 py-0.5 text-[11px] font-semibold", interval === i ? "bg-lime text-ink" : "bg-lime-soft text-ink")}>−{maxSave}%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Stagger className={cn("mx-auto mt-10 grid gap-5 md:mt-12", plans.length === 1 ? "max-w-md" : plans.length === 2 ? "max-w-4xl md:grid-cols-2" : "md:grid-cols-3")}>
        {plans.map((p, idx) => {
          const featured = plans.length > 1 && idx === plans.length - 1;
          return (
            <div
              key={p.id}
              style={{ "--i": idx * 4 } as React.CSSProperties}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border p-6 sm:p-8",
                featured
                  ? "border-lime/60 bg-lime-soft/35 shadow-[var(--shadow-md)] ring-1 ring-lime/25"
                  : "border-line bg-card shadow-[var(--shadow-sm)]",
              )}
            >
              {featured && (
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-lime px-3 py-1 text-xs font-semibold text-ink shadow-[var(--shadow-xs)]">Para crecer en serio</span>
              )}
              <p className={cn("text-[13px] font-semibold", featured ? "text-ink-2" : "text-signal")}>Plan</p>
              <h3 className="mt-1 text-[1.75rem] font-semibold tracking-tight">{p.name}</h3>
              <div className="mt-5 flex items-end gap-2">
                <span className="tabular text-[2.75rem] font-semibold leading-none tracking-tight sm:text-[3.25rem]">{eur(price(p, interval))}</span>
                <span className="pb-1 text-sm text-ink-3">/mes por web</span>
              </div>
              <p className="mt-2 min-h-5 text-[13px] text-ink-3">
                {interval === "year" ? (
                  <>
                    {eur(planYearlyTotalAtAnnualRate(p))} al año · <s>{eur(p.monthly_price_eur)}/mes</s>
                  </>
                ) : (
                  <>Ahorra un {savings(p)}% pagando al año</>
                )}
              </p>
              <ButtonLink
                href={`/registro?plan=${p.id}&periodo=${interval === "year" ? "anual" : "mensual"}`}
                size="lg"
                variant="primary"
                className="mt-6 w-full"
              >
                Probar 3 días gratis
              </ButtonLink>
              <ul className="mt-7 space-y-2.5 border-t border-line pt-6 text-sm">
                <Li featured={featured}>
                  <strong>{p.articles_per_month} artículos</strong> al mes
                </Li>
                <Li featured={featured}>
                  <strong>{p.tracked_prompts} preguntas</strong> seguidas en IA
                </Li>
                <Li featured={featured}>
                  <strong>{p.backlink_credits} créditos</strong> de enlaces al mes
                </Li>
                <Li featured={featured}>
                  {p.languages === 1 ? "1 idioma" : `${p.languages} idiomas`} · {p.seats ? `${p.seats} usuario${p.seats > 1 ? "s" : ""}` : "usuarios ilimitados"}
                </Li>
                <Li featured={featured}>Publicaciones sociales {p.social_cadence === "daily" ? "diarias" : "semanales"}</Li>
                {p.features.map((f) => (
                  <Li key={f} featured={featured}>
                    {f}
                  </Li>
                ))}
              </ul>
            </div>
          );
        })}
      </Stagger>

      <VolumeCalculator plans={plans} discounts={discounts} interval={interval} />
    </div>
  );
}

function Li({ children, featured }: { children: React.ReactNode; featured: boolean }) {
  return (
    <li className="flex gap-2.5 text-ink-2">
      <span className={cn("mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full", featured ? "bg-lime/50 text-ink" : "bg-signal-soft text-signal")}>
        <Check className="h-3 w-3" aria-hidden />
      </span>
      <span>{children}</span>
    </li>
  );
}

function VolumeCalculator({ plans, discounts, interval }: { plans: Plan[]; discounts: Discount[]; interval: Interval }) {
  const [sites, setSites] = useState(3);
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const tier = useMemo(() => discounts.find((d) => sites >= d.from && (d.to === null || sites <= d.to)), [discounts, sites]);
  if (!plan) return null;
  const pct = tier?.pct ?? 0;
  const unit = price(plan, interval);
  const perSite = Math.round(unit * (1 - pct / 100));
  const total = perSite * sites;
  const saved = (unit - perSite) * sites;
  const clamp = (n: number) => Math.max(1, Math.min(50, n));

  return (
    <div id="volumen" className="surface mt-16 scroll-mt-24 p-6 sm:p-10 md:mt-20">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <Eyebrow>Descuentos por volumen</Eyebrow>
          <Title size="sm" className="mt-3">
            ¿Más de una web? Cuantas más, menos pagas por cada una.
          </Title>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">El descuento se aplica a todas las webs de tu cuenta, no solo a las nuevas.</p>
          <table className="mt-6 w-full text-sm">
            <caption className="sr-only">Tramos de descuento por número de webs</caption>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.from} className={cn("border-b border-line transition-colors duration-150", tier?.from === d.from && "bg-lime-soft font-semibold")}>
                  <td className="rounded-l-lg py-2.5 pl-3">{d.to ? `De ${d.from} a ${d.to} webs` : `${d.from} webs o más`}</td>
                  <td className="tabular rounded-r-lg py-2.5 pr-3 text-right">−{d.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-line bg-paper-2 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="calc-sites">Número de webs</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="md" aria-label="Una web menos" onClick={() => setSites((s) => clamp(s - 1))} className="w-10 px-0">
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="calc-sites"
                  type="number"
                  min={1}
                  max={50}
                  value={sites}
                  onChange={(e) => setSites(clamp(Number(e.target.value) || 1))}
                  className="tabular w-20 text-center font-semibold"
                />
                <Button type="button" variant="outline" size="md" aria-label="Una web más" onClick={() => setSites((s) => clamp(s + 1))} className="w-10 px-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="calc-plan">Plan</Label>
              <Select id="calc-plan" value={plan.id} onChange={(e) => setPlanId(e.target.value)} className="font-semibold">
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={sites}
            onChange={(e) => setSites(Number(e.target.value))}
            aria-label="Número de webs"
            className="mt-6 h-11 w-full accent-[var(--signal)]"
          />
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-5">
            <div>
              <dt className="text-[13px] text-ink-3">Precio por web</dt>
              <dd className="tabular mt-0.5 text-2xl font-semibold tracking-tight">
                {eur(perSite)}
                <span className="text-sm font-normal text-ink-3">/mes</span>
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">Descuento</dt>
              <dd className="tabular mt-0.5 text-2xl font-semibold tracking-tight">{pct ? `−${pct}%` : "—"}</dd>
            </div>
            <div className="col-span-2 rounded-xl border border-line bg-paper-2 p-4">
              <dt className="text-[13px] text-ink-3">Total {interval === "year" ? "(pago anual, por mes)" : "al mes"}</dt>
              <dd className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="tabular text-[2.5rem] font-semibold leading-none tracking-tight">{eur(total)}</span>
                {saved > 0 && (
                  <Badge tone="lime" className="tabular">
                    ahorras {eur(saved)}/mes
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
          {sites >= 20 && (
            <p className="mt-4 text-sm text-ink-2">
              Con tantas webs, quizá te encaje mejor el{" "}
              <Link href="/agencias" className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4">
                programa para agencias
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
