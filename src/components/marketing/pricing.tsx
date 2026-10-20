"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn, eur } from "@/lib/utils";
import type { Plan } from "@/lib/types";

type Interval = "month" | "year";
interface Discount {
  from: number;
  to: number | null;
  pct: number;
}

const price = (p: Plan, i: Interval) => (i === "year" ? p.yearly_price_eur || p.monthly_price_eur : p.monthly_price_eur);
const savings = (p: Plan) => (p.monthly_price_eur && p.yearly_price_eur ? Math.round((1 - p.yearly_price_eur / p.monthly_price_eur) * 100) : 0);

export function Pricing({ plans, discounts }: { plans: Plan[]; discounts: Discount[] }) {
  const [interval, setPeriod] = useState<Interval>("year");
  const maxSave = Math.max(0, ...plans.map(savings));

  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Periodo de facturación" className="inline-flex items-center rounded-lg border border-line bg-card p-1">
          {(["month", "year"] as const).map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={interval === i}
              onClick={() => setPeriod(i)}
              className={cn("rounded-md px-5 py-2 text-sm font-semibold transition", interval === i ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
            >
              {i === "month" ? "Mensual" : "Anual"}
              {i === "year" && maxSave > 0 && (
                <span className={cn("ml-2 rounded-full px-2 py-0.5 font-mono text-[10px]", interval === i ? "bg-lime text-ink" : "bg-lime/60 text-ink")}>−{maxSave}%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("mx-auto mt-12 grid gap-8", plans.length === 1 ? "max-w-md" : plans.length === 2 ? "max-w-4xl md:grid-cols-2" : "md:grid-cols-3")}>
        {plans.map((p, idx) => {
          const featured = plans.length > 1 && idx === plans.length - 1;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border border-line p-7 sm:p-9",
                featured ? "bg-ink text-paper shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)]" : "bg-card shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)]",
              )}
            >
              {featured && (
                <span className="absolute -top-4 left-7 rounded-full border border-line bg-lime px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink">
                  Para crecer en serio
                </span>
              )}
              <p className={cn("font-mono text-[11px] uppercase tracking-[0.2em]", featured ? "text-lime" : "text-signal")}>Plan</p>
              <h3 className="mt-1 font-display text-5xl">{p.name}</h3>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-tight tabular-nums">{eur(price(p, interval))}</span>
                <span className={cn("pb-1.5 text-sm", featured ? "text-paper/60" : "text-ink-3")}>/mes por web</span>
              </div>
              <p className={cn("mt-1 h-5 text-sm", featured ? "text-paper/60" : "text-ink-3")}>
                {interval === "year" ? (
                  <>
                    {eur(price(p, "year") * 12)} al año · <s>{eur(p.monthly_price_eur)}/mes</s>
                  </>
                ) : (
                  <>Ahorra un {savings(p)}% pagando al año</>
                )}
              </p>
              <Link
                href={`/registro?plan=${p.id}&periodo=${interval === "year" ? "anual" : "mensual"}`}
                className={cn(
                  "mt-7 rounded-lg px-5 py-3 text-center font-semibold transition hover:brightness-95",
                  featured ? "border-paper bg-signal text-signal-ink shadow-sm" : "border-ink bg-signal text-signal-ink shadow-sm",
                )}
              >
                Probar 3 días gratis
              </Link>
              <ul className={cn("mt-8 space-y-3 border-t border-dashed pt-6 text-sm", featured ? "border-paper/25" : "border-line")}>
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
      </div>

      <VolumeCalculator plans={plans} discounts={discounts} interval={interval} />
    </div>
  );
}

function Li({ children, featured }: { children: React.ReactNode; featured: boolean }) {
  return (
    <li className="flex gap-2.5">
      <Check className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-lime" : "text-signal")} aria-hidden />
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
    <div id="volumen" className="mt-24 scroll-mt-24 rounded-2xl border border-line bg-paper-2 p-6 sm:p-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">Descuentos por volumen</p>
          <h2 className="mt-3 font-display text-3xl leading-[1.1] md:text-4xl">¿Más de una web? Cuantas más, menos pagas por cada una.</h2>
          <p className="mt-4 text-ink-2">El descuento se aplica a todas las webs de tu cuenta, no solo a las nuevas.</p>
          <table className="mt-6 w-full text-sm">
            <caption className="sr-only">Tramos de descuento por número de webs</caption>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.from} className={cn("border-b border-line", tier?.from === d.from && "bg-lime/60 font-semibold")}>
                  <td className="py-2.5 pl-2">{d.to ? `De ${d.from} a ${d.to} webs` : `${d.from} webs o más`}</td>
                  <td className="py-2.5 pr-2 text-right font-mono">−{d.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-line bg-card p-6 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)] sm:p-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="calc-sites" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
                Número de webs
              </label>
              <div className="mt-2 flex items-center gap-2">
                <button type="button" aria-label="Una web menos" onClick={() => setSites((s) => clamp(s - 1))} className="grid h-10 w-10 place-items-center rounded-lg border border-line hover:bg-paper-2">
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id="calc-sites"
                  type="number"
                  min={1}
                  max={50}
                  value={sites}
                  onChange={(e) => setSites(clamp(Number(e.target.value) || 1))}
                  className="h-10 w-16 rounded-xl border border-line bg-paper text-center font-semibold tabular-nums outline-none focus:ring-4 focus:ring-lime"
                />
                <button type="button" aria-label="Una web más" onClick={() => setSites((s) => clamp(s + 1))} className="grid h-10 w-10 place-items-center rounded-lg border border-line hover:bg-paper-2">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="calc-plan" className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
                Plan
              </label>
              <select
                id="calc-plan"
                value={plan.id}
                onChange={(e) => setPlanId(e.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-line bg-paper px-3 font-semibold outline-none focus:ring-4 focus:ring-lime"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={sites}
            onChange={(e) => setSites(Number(e.target.value))}
            aria-label="Número de webs"
            className="mt-6 w-full accent-[var(--signal)]"
          />
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-dashed border-line pt-6">
            <div>
              <dt className="text-sm text-ink-3">Precio por web</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {eur(perSite)}
                <span className="text-sm font-normal text-ink-3">/mes</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-3">Descuento</dt>
              <dd className="text-2xl font-semibold tabular-nums">{pct ? `−${pct}%` : "—"}</dd>
            </div>
            <div className="col-span-2 rounded-xl bg-ink p-4 text-paper">
              <dt className="text-sm text-paper/60">Total {interval === "year" ? "(pago anual, por mes)" : "al mes"}</dt>
              <dd className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="font-display text-5xl tabular-nums">{eur(total)}</span>
                {saved > 0 && <span className="font-mono text-xs text-lime">ahorras {eur(saved)}/mes</span>}
              </dd>
            </div>
          </dl>
          {sites >= 20 && (
            <p className="mt-4 text-sm text-ink-2">
              Con tantas webs, quizá te encaje mejor el{" "}
              <Link href="/agencias" className="font-semibold underline">
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
