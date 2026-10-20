import { Field, Input, Select, Textarea } from "@/components/ui";
import type { AdminPlan } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "./ActionForm";
import type { ActionResult } from "@/lib/admin/types";

const euros = (c: number) => (c / 100).toFixed(2).replace(/\.00$/, "").replace(".", ",");

/** Formulario completo de un plan (también sirve para crear uno nuevo). */
export function PlanForm({ plan, action }: { plan?: AdminPlan; action: (p: ActionResult, fd: FormData) => Promise<ActionResult> }) {
  const p = plan;
  const uid = p?.id ?? "nuevo";
  return (
    <ActionForm action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Identificador" hint={p ? "No editable: lo usan las suscripciones." : "Minúsculas, sin espacios (p. ej. «huerta»)."}>
          <Input name="id" defaultValue={p?.id} readOnly={!!p} required pattern="[a-z0-9-]+" className={p ? "bg-paper-2 text-ink-2" : undefined} />
        </Field>
        <Field label="Nombre visible">
          <Input name="name" defaultValue={p?.name} required />
        </Field>
        <Field label="Orden" hint="Posición en la página de precios.">
          <Input name="sort" type="number" defaultValue={p?.sort ?? 9} />
        </Field>
      </div>

      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Precio por sitio</legend>
        <Field label="Mensual (€/mes)">
          <Input name="monthly_price" inputMode="decimal" defaultValue={p ? euros(p.monthly_price_eur) : ""} required />
        </Field>
        <Field label="Anual (€/mes, facturado al año)">
          <Input name="yearly_price" inputMode="decimal" defaultValue={p ? euros(p.yearly_price_eur) : ""} required />
        </Field>
        <Field label="Stripe price ID mensual">
          <Input name="stripe_price_monthly" defaultValue={p?.stripe_price_monthly ?? ""} placeholder="price_…" className="font-mono" />
        </Field>
        <Field label="Stripe price ID anual" hint="El precio anual en Stripe debe ser el importe del año completo.">
          <Input name="stripe_price_yearly" defaultValue={p?.stripe_price_yearly ?? ""} placeholder="price_…" className="font-mono" />
        </Field>
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Límites (por sitio)</legend>
        <Field label="Artículos/mes">
          <Input name="articles_per_month" type="number" min={0} defaultValue={p?.articles_per_month ?? 0} />
        </Field>
        <Field label="Prompts IA">
          <Input name="tracked_prompts" type="number" min={0} defaultValue={p?.tracked_prompts ?? 0} />
        </Field>
        <Field label="Idiomas">
          <Input name="languages" type="number" min={0} defaultValue={p?.languages ?? 1} />
        </Field>
        <Field label="Usuarios" hint="Vacío = ilimitados">
          <Input name="seats" type="number" min={1} defaultValue={p?.seats ?? ""} />
        </Field>
        <Field label="Créditos enlaces">
          <Input name="backlink_credits" type="number" min={0} defaultValue={p?.backlink_credits ?? 0} />
        </Field>
        <Field label="Redes sociales">
          <Select name="social_cadence" defaultValue={p?.social_cadence ?? "weekly"}>
            <option value="weekly">Semanal</option>
            <option value="daily">Diaria</option>
          </Select>
        </Field>
      </fieldset>

      <Field label="Características" hint="Una por línea. Se muestran en la página de precios.">
        <Textarea name="features" rows={5} defaultValue={p?.features.join("\n")} />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <label htmlFor={`active-${uid}`} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input id={`active-${uid}`} type="checkbox" name="active" defaultChecked={p?.active ?? true} className="size-4 accent-[var(--ink)]" />
          Activo (visible y contratable)
        </label>
        <SubmitButton>{p ? "Guardar plan" : "Crear plan"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
