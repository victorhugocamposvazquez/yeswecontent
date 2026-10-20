import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Input, PageHeader, Select, Stat } from "@/components/ui";
import { DataTable, EmptyRow, FilterBar, FilterField, SubStatusBadge, subStatusOptions, Td, Th, THead, Tr } from "@/components/admin/table";
import { listAdminPlans, listAdminSubscriptions, listAdminUsers } from "@/lib/admin/data";
import { stripeDashboardUrl } from "@/lib/admin/links";
import { eur, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Suscripciones" };

type SP = Promise<{ q?: string; status?: string; plan?: string; interval?: string }>;
const long = { day: "numeric", month: "short", year: "numeric" } as const;

export default async function SubscriptionsPage({ searchParams }: { searchParams: SP }) {
  const { q = "", status = "", plan = "", interval = "" } = await searchParams;
  const [subs, plans, users] = await Promise.all([listAdminSubscriptions(), listAdminPlans(), listAdminUsers()]);
  const needle = q.trim().toLowerCase();
  const rows = subs.filter(
    (s) =>
      (!needle || [s.site_name, s.workspace, s.email ?? "", s.stripe_customer_id ?? "", s.stripe_subscription_id ?? ""].some((v) => v.toLowerCase().includes(needle))) &&
      (!status || s.status === status) &&
      (!plan || s.plan_id === plan) &&
      (!interval || s.interval === interval),
  );
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id;
  const userId = (email: string | null) => users.find((u) => u.email === email)?.id;
  const mrr = rows.reduce((t, s) => t + s.mrr_eur, 0);

  return (
    <>
      <PageHeader title="Suscripciones" intro="Una suscripción por sitio. Los cambios de estado llegan por el webhook de Stripe." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="MRR (filtro actual)" value={eur(mrr)} />
        <Stat label="Activas" value={num(rows.filter((s) => s.status === "active").length)} />
        <Stat label="En prueba" value={num(rows.filter((s) => s.status === "trialing").length)} />
        <Stat label="Con impago" value={num(rows.filter((s) => s.status === "past_due").length)} />
      </div>

      <FilterBar action="/admin/suscripciones" resetHref="/admin/suscripciones">
        <FilterField label="Buscar" className="min-w-56 flex-1">
          <Input type="search" name="q" defaultValue={q} placeholder="sitio, email, cus_… o sub_…" />
        </FilterField>
        <FilterField label="Estado">
          <Select name="status" defaultValue={status}>
            <option value="">Todos</option>
            {subStatusOptions.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Plan">
          <Select name="plan" defaultValue={plan}>
            <option value="">Todos</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Facturación">
          <Select name="interval" defaultValue={interval}>
            <option value="">Todas</option>
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable caption="Suscripciones" footer={`${num(rows.length)} de ${num(subs.length)} suscripciones`}>
        <THead>
          <Th>Sitio</Th>
          <Th>Cliente</Th>
          <Th>Plan</Th>
          <Th>Estado</Th>
          <Th className="text-right">MRR</Th>
          <Th>Próxima fecha</Th>
          <Th>Stripe</Th>
        </THead>
        <tbody>
          {rows.map((s) => {
            const uid = userId(s.email);
            return (
              <Tr key={s.id}>
                <Td className="font-medium">{s.site_name}</Td>
                <Td>
                  {uid ? (
                    <Link href={`/admin/usuarios/${uid}`} className="hover:underline">
                      {s.workspace}
                    </Link>
                  ) : (
                    s.workspace
                  )}
                  <div className="text-xs text-ink-3">{s.email}</div>
                </Td>
                <Td>
                  {planName(s.plan_id)}
                  <div className="text-xs text-ink-3">{s.interval === "year" ? "Anual" : "Mensual"}</div>
                </Td>
                <Td>
                  <SubStatusBadge status={s.status} />
                </Td>
                <Td className="text-right tabular-nums">{s.mrr_eur ? eur(s.mrr_eur) : "—"}</Td>
                <Td className="whitespace-nowrap text-ink-2">
                  {s.status === "trialing" && s.trial_ends_at
                    ? `Fin prueba ${fmtDate(s.trial_ends_at, long)}`
                    : s.current_period_end
                      ? `${s.status === "canceled" ? "Terminó" : "Renueva"} ${fmtDate(s.current_period_end, long)}`
                      : "—"}
                </Td>
                <Td>
                  <div className="flex flex-col gap-0.5 font-mono text-xs">
                    {s.stripe_customer_id && (
                      <a href={stripeDashboardUrl("customers", s.stripe_customer_id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                        {s.stripe_customer_id} <ExternalLink className="size-3" aria-label="(abre Stripe)" />
                      </a>
                    )}
                    {s.stripe_subscription_id && (
                      <a href={stripeDashboardUrl("subscriptions", s.stripe_subscription_id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-3 hover:underline">
                        {s.stripe_subscription_id} <ExternalLink className="size-3" aria-label="(abre Stripe)" />
                      </a>
                    )}
                    {!s.stripe_customer_id && !s.stripe_subscription_id && <span className="text-ink-3">Sin Stripe</span>}
                  </div>
                </Td>
              </Tr>
            );
          })}
          {!rows.length && <EmptyRow cols={7} />}
        </tbody>
      </DataTable>
    </>
  );
}
