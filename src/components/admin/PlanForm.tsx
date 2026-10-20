import type { ReactNode } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui";
import type { AdminPlan } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "./ActionForm";
import type { ActionResult } from "@/lib/admin/types";

const euros = (c: number) => (c / 100).toFixed(2).replace(/\.00$/, "").replace(".", ",");

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line px-4 py-4 first:border-t-0 sm:px-5">
      <legend className="float-left mb-3 w-full">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{title}</span>
        {hint && <span className="block text-xs text-ink-3">{hint}</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

/** Formulario completo de un plan (también sirve para crear uno nuevo). Va dentro de una `Card`. */
export function PlanForm({ plan, action }: { plan?: AdminPlan; action: (p: ActionResult, fd: FormData) => Promise<ActionResult> }) {
  const p = plan;
  const uid = p?.id ?? "nuevo";
  return (
    <ActionForm action={action} className="[&>p[role=status]]:px-4 [&>p[role=status]]:pb-3 sm:[&>p[role=status]]:px-5">
      <Section title="Identidad">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_6rem]">
          <Field label="Identificador" hint={p ? "No editable: lo usan las suscripciones." : "Minúsculas, sin espacios (p. ej. «huerta»)."}>
            <Input name="id" defaultValue={p?.id} readOnly={!!p} required pattern="[a-z0-9-]+" className={p ? "bg-paper-2 font-mono text-ink-2" : "font-mono"} />
          </Field>
          <Field label="Nombre visible">
            <Input name="name" defaultValue={p?.name} required />
          </Field>
          <Field label="Orden" hint="En precios.">
            <Input name="sort" type="number" defaultValue={p?.sort ?? 9} className="tabular" />
          </Field>
        </div>
      </Section>

      <Section title="Precio por sitio" hint="El precio anual en Stripe debe ser el importe del año completo.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Mensual (€/mes)">
            <Input name="monthly_price" inputMode="decimal" defaultValue={p ? euros(p.monthly_price_eur) : ""} required className="tabular" />
          </Field>
          <Field label="Anual (€/mes)">
            <Input name="yearly_price" inputMode="decimal" defaultValue={p ? euros(p.yearly_price_eur) : ""} required className="tabular" />
          </Field>
          <Field label="Stripe price mensual">
            <Input name="stripe_price_monthly" defaultValue={p?.stripe_price_monthly ?? ""} placeholder="price_…" className="font-mono text-[13px]" />
          </Field>
          <Field label="Stripe price anual">
            <Input name="stripe_price_yearly" defaultValue={p?.stripe_price_yearly ?? ""} placeholder="price_…" className="font-mono text-[13px]" />
          </Field>
        </div>
      </Section>

      <Section title="Límites por sitio">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Artículos/mes">
            <Input name="articles_per_month" type="number" min={0} defaultValue={p?.articles_per_month ?? 0} className="tabular" />
          </Field>
          <Field label="Prompts IA">
            <Input name="tracked_prompts" type="number" min={0} defaultValue={p?.tracked_prompts ?? 0} className="tabular" />
          </Field>
          <Field label="Idiomas">
            <Input name="languages" type="number" min={0} defaultValue={p?.languages ?? 1} className="tabular" />
          </Field>
          <Field label="Usuarios" hint="Vacío = ilimitados">
            <Input name="seats" type="number" min={1} defaultValue={p?.seats ?? ""} className="tabular" />
          </Field>
          <Field label="Créditos enlaces">
            <Input name="backlink_credits" type="number" min={0} defaultValue={p?.backlink_credits ?? 0} className="tabular" />
          </Field>
          <Field label="Redes sociales">
            <Select name="social_cadence" defaultValue={p?.social_cadence ?? "weekly"}>
              <option value="weekly">Semanal</option>
              <option value="daily">Diaria</option>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Características" hint="Una por línea. Se muestran en la página de precios.">
        <label htmlFor={`features-${uid}`} className="sr-only">
          Características
        </label>
        <Textarea id={`features-${uid}`} name="features" rows={4} defaultValue={p?.features.join("\n")} />
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper-2/40 px-4 py-3 sm:px-5">
        <label htmlFor={`active-${uid}`} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[13px] font-medium sm:min-h-0">
          <input id={`active-${uid}`} type="checkbox" name="active" defaultChecked={p?.active ?? true} className="size-4 accent-[var(--ink)]" />
          Activo (visible y contratable)
        </label>
        <SubmitButton size="sm" className="h-10 sm:h-9">
          {p ? "Guardar plan" : "Crear plan"}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
