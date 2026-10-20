import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader, Stat } from "@/components/ui";
import {
  buildChips,
  DataTable,
  EmptyRow,
  FilterBar,
  FilterSelect,
  IconButton,
  RowActions,
  rowLink,
  SearchField,
  SelectAllTh,
  SelectTd,
  Sub,
  SubStatusBadge,
  subStatusOptions,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/admin/table";
import { listAdminPlans, listAdminSubscriptions, listAdminUsers } from "@/lib/admin/data";
import { stripeDashboardUrl } from "@/lib/admin/links";
import { cn, eur, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Suscripciones" };

type SP = Promise<{ q?: string; status?: string; plan?: string; interval?: string }>;
const long = { day: "numeric", month: "short", year: "numeric" } as const;

export default async function SubscriptionsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { q = "", status = "", plan = "", interval = "" } = sp;
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
  const chips = buildChips("/admin/suscripciones", sp, {
    q: { label: "Buscar" },
    status: { label: "Estado", value: (v) => subStatusOptions.find(([k]) => k === v)?.[1] ?? v },
    plan: { label: "Plan", value: (v) => planName(v) },
    interval: { label: "Facturación", value: (v) => (v === "year" ? "Anual" : "Mensual") },
  });

  return (
    <>
      <PageHeader title="Suscripciones" intro="Una suscripción por sitio. Los cambios de estado llegan por el webhook de Stripe." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="MRR (filtro actual)" value={eur(mrr)} />
        <Stat label="Activas" value={num(rows.filter((s) => s.status === "active").length)} />
        <Stat label="En prueba" value={num(rows.filter((s) => s.status === "trialing").length)} />
        <Stat label="Con impago" value={num(rows.filter((s) => s.status === "past_due").length)} />
      </div>

      <FilterBar action="/admin/suscripciones" resetHref="/admin/suscripciones" chips={chips}>
        <SearchField defaultValue={q} placeholder="Sitio, email, cus_… o sub_…" />
        <FilterSelect label="Estado" name="status" defaultValue={status}>
          <option value="">Estado: todos</option>
          {subStatusOptions.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Plan" name="plan" defaultValue={plan}>
          <option value="">Plan: todos</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Facturación" name="interval" defaultValue={interval}>
          <option value="">Facturación: todas</option>
          <option value="month">Mensual</option>
          <option value="year">Anual</option>
        </FilterSelect>
      </FilterBar>

      <DataTable caption="Suscripciones" count={rows.length} total={subs.length} unit="suscripciones" minWidth="min-w-[960px]">
        <THead>
          <SelectAllTh />
          <Th>Sitio</Th>
          <Th>Cliente</Th>
          <Th>Plan</Th>
          <Th>Estado</Th>
          <Th numeric>MRR</Th>
          <Th>Próxima fecha</Th>
          <Th>Stripe</Th>
          <Th className="w-12">
            <span className="sr-only">Acciones</span>
          </Th>
        </THead>
        <tbody>
          {rows.map((s) => {
            const uid = userId(s.email);
            return (
              <Tr key={s.id} tone={s.status === "past_due" ? "warn" : undefined}>
                <SelectTd label={s.site_name} />
                <Td className="font-medium">{s.site_name}</Td>
                <Td>
                  {uid ? (
                    <Link href={`/admin/usuarios/${uid}`} className={cn(rowLink, "font-normal")}>
                      {s.workspace}
                    </Link>
                  ) : (
                    s.workspace
                  )}
                  <Sub>{s.email}</Sub>
                </Td>
                <Td>
                  {planName(s.plan_id)}
                  <Sub>{s.interval === "year" ? "Anual" : "Mensual"}</Sub>
                </Td>
                <Td>
                  <SubStatusBadge status={s.status} />
                </Td>
                <Td numeric>{s.mrr_eur ? eur(s.mrr_eur) : "—"}</Td>
                <Td muted className="whitespace-nowrap">
                  {s.status === "trialing" && s.trial_ends_at
                    ? `Fin prueba ${fmtDate(s.trial_ends_at, long)}`
                    : s.current_period_end
                      ? `${s.status === "canceled" ? "Terminó" : "Renueva"} ${fmtDate(s.current_period_end, long)}`
                      : "—"}
                </Td>
                <Td>
                  <div className="flex flex-col font-mono text-xs">
                    {s.stripe_customer_id && (
                      <a href={stripeDashboardUrl("customers", s.stripe_customer_id)} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center hover:underline">
                        {s.stripe_customer_id}
                      </a>
                    )}
                    {s.stripe_subscription_id && (
                      <a href={stripeDashboardUrl("subscriptions", s.stripe_subscription_id)} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center text-ink-3 hover:underline">
                        {s.stripe_subscription_id}
                      </a>
                    )}
                    {!s.stripe_customer_id && !s.stripe_subscription_id && <span className="text-ink-3">Sin Stripe</span>}
                  </div>
                </Td>
                <Td>
                  <RowActions>
                    {s.stripe_subscription_id ? (
                      <IconButton label="Abrir en Stripe" href={stripeDashboardUrl("subscriptions", s.stripe_subscription_id)} external>
                        <ExternalLink className="size-4" aria-hidden />
                      </IconButton>
                    ) : (
                      uid && (
                        <IconButton label="Ver usuario" href={`/admin/usuarios/${uid}`}>
                          <ExternalLink className="size-4" aria-hidden />
                        </IconButton>
                      )
                    )}
                  </RowActions>
                </Td>
              </Tr>
            );
          })}
          {!rows.length && <EmptyRow cols={9} />}
        </tbody>
      </DataTable>
    </>
  );
}
