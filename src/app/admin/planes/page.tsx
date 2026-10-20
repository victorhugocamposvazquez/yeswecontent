import { Badge, Card, PageHeader } from "@/components/ui";
import { PlanForm } from "@/components/admin/PlanForm";
import { VolumeTiersEditor } from "@/components/admin/VolumeTiersEditor";
import { listAdminPlans, getVolumeTiers } from "@/lib/admin/data";
import { eur } from "@/lib/utils";
import { savePlan, saveVolumeTiers } from "../actions";

export const metadata = { title: "Planes" };

export default async function PlansPage() {
  const [plans, tiers] = await Promise.all([listAdminPlans(), getVolumeTiers()]);
  return (
    <>
      <PageHeader title="Planes" intro="Precios, límites y características. Lo que guardes aquí se refleja en la página de precios y en el checkout." />

      <div className="space-y-6">
        {plans.map((p) => (
          <Card key={p.id} className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <h2 className="font-semibold tracking-tight text-lg">{p.name}</h2>
              <Badge tone={p.active ? "ok" : "neutral"}>{p.active ? "Activo" : "Oculto"}</Badge>
              <span className="text-sm text-ink-3">
                {p.monthly_price_eur ? `${eur(p.monthly_price_eur)}/mes · ${eur(p.yearly_price_eur)}/mes en anual` : "Precio a medida"}
              </span>
              {!p.stripe_price_monthly && !p.stripe_price_yearly && p.monthly_price_eur > 0 && <Badge tone="warn">Sin precio en Stripe</Badge>}
            </div>
            <PlanForm plan={p} action={savePlan} />
          </Card>
        ))}

        <details className="group rounded-2xl border border-dashed border-line bg-card/60 p-5 sm:p-6">
          <summary className="cursor-pointer list-none font-semibold marker:hidden">
            <span className="group-open:hidden">+ Crear un plan nuevo</span>
            <span className="hidden group-open:inline">Nuevo plan</span>
          </summary>
          <div className="mt-5">
            <PlanForm action={savePlan} />
          </div>
        </details>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold tracking-tight text-lg">Descuentos por volumen</h2>
          <p className="mb-4 text-sm text-ink-2">Porcentaje de descuento según el número de sitios contratados por un mismo cliente.</p>
          <VolumeTiersEditor tiers={tiers} action={saveVolumeTiers} />
        </Card>
      </div>
    </>
  );
}
