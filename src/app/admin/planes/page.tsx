import { Plus } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { PlanForm } from "@/components/admin/PlanForm";
import { VolumeTiersEditor } from "@/components/admin/VolumeTiersEditor";
import { DetailLayout, KeyValue } from "@/components/admin/table";
import { listAdminPlans, getVolumeTiers } from "@/lib/admin/data";
import { eur, num } from "@/lib/utils";
import { savePlan, saveVolumeTiers } from "../actions";

export const metadata = { title: "Planes" };

export default async function PlansPage() {
  const [plans, tiers] = await Promise.all([listAdminPlans(), getVolumeTiers()]);
  const active = plans.filter((p) => p.active).length;
  const noStripe = plans.filter((p) => !p.stripe_price_monthly && !p.stripe_price_yearly && p.monthly_price_eur > 0);

  return (
    <>
      <PageHeader title="Planes" intro="Precios, límites y características. Lo que guardes aquí se refleja en la página de precios y en el checkout." />

      <DetailLayout
        rail={
          <>
            <Card>
              <CardHeader title="Resumen" className="px-4 py-3" />
              <div className="px-4 py-3">
                <KeyValue
                  items={[
                    { k: "Planes", v: num(plans.length) },
                    { k: "Activos", v: num(active) },
                    { k: "Ocultos", v: num(plans.length - active) },
                    {
                      k: "Sin precio en Stripe",
                      v: noStripe.length ? (
                        <Badge tone="warn" dot>
                          {num(noStripe.length)}
                        </Badge>
                      ) : (
                        <Badge tone="ok" dot>
                          0
                        </Badge>
                      ),
                    },
                    { k: "Tramos de descuento", v: num(tiers.length) },
                  ]}
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Orden en precios" intro="Según el campo «Orden» de cada plan." className="px-4 py-3" />
              <ol className="divide-y divide-line px-4 text-[13px]">
                {[...plans]
                  .sort((a, b) => a.sort - b.sort)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="flex items-center gap-2">
                        <span className="tabular w-4 text-ink-3">{p.sort}</span>
                        <a href={`#plan-${p.id}`} className="inline-flex min-h-8 items-center font-medium hover:underline">
                          {p.name}
                        </a>
                      </span>
                      <span className="tabular text-ink-3">{p.monthly_price_eur ? `${eur(p.monthly_price_eur)}/mes` : "A medida"}</span>
                    </li>
                  ))}
              </ol>
            </Card>
            <Card className="border-dashed">
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                  <Plus className="size-4 text-ink-3 transition-transform group-open:rotate-45" aria-hidden />
                  <span className="group-open:hidden">Crear un plan nuevo</span>
                  <span className="hidden group-open:inline">Nuevo plan</span>
                </summary>
                <div className="border-t border-line">
                  <PlanForm action={savePlan} />
                </div>
              </details>
            </Card>
          </>
        }
      >
        {plans.map((p) => (
          <Card key={p.id} id={`plan-${p.id}`} className="scroll-mt-20 overflow-hidden">
            <CardHeader
              title={
                <span className="inline-flex flex-wrap items-center gap-2">
                  {p.name}
                  <Badge tone={p.active ? "ok" : "neutral"} dot>
                    {p.active ? "Activo" : "Oculto"}
                  </Badge>
                  {!p.stripe_price_monthly && !p.stripe_price_yearly && p.monthly_price_eur > 0 && (
                    <Badge tone="warn" dot>
                      Sin precio en Stripe
                    </Badge>
                  )}
                </span>
              }
              intro={p.monthly_price_eur ? `${eur(p.monthly_price_eur)}/mes · ${eur(p.yearly_price_eur)}/mes en anual` : "Precio a medida"}
              action={<code className="rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{p.id}</code>}
              className="px-4 py-3 sm:px-5"
            />
            <PlanForm plan={p} action={savePlan} />
          </Card>
        ))}

        <Card className="overflow-hidden">
          <CardHeader title="Descuentos por volumen" intro="Porcentaje de descuento según el número de sitios contratados por un mismo cliente." className="px-4 py-3 sm:px-5" />
          <VolumeTiersEditor tiers={tiers} action={saveVolumeTiers} />
        </Card>
      </DetailLayout>
    </>
  );
}
