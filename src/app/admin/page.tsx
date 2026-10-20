import Link from "next/link";
import { AreaChart, Bars } from "@/components/charts";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { DataTable, EmptyRow, SubStatusBadge, Td, Th, THead, Tr } from "@/components/admin/table";
import { getOverview } from "@/lib/admin/data";
import { eur, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Resumen" };

export default async function AdminHome() {
  const o = await getOverview();
  const first = o.mrrHistory[0]?.mrr ?? 0;
  const last = o.mrrHistory.at(-1)?.mrr ?? 0;
  const growth = first ? Math.round(((last - first) / first) * 100) : 0;

  return (
    <>
      <PageHeader title="Resumen" intro="El pulso del negocio: ingresos, altas y la salud de la máquina de contenido." />

      <section aria-label="Métricas clave" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="MRR" value={eur(o.mrr)} />
        <Stat label="Suscripciones activas" value={num(o.activeSubs)} />
        <Stat label="En prueba" value={num(o.trials)} />
        <Stat label="Churn (histórico)" value={`${o.churnPct.toLocaleString("es-ES")} %`} />
        <Stat label="Altas (30 días)" value={num(o.newSignups)} />
        <Stat label="Artículos publicados este mes" value={num(o.publishedThisMonth)} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">MRR últimos 12 meses</h2>
            <span className="text-sm text-ink-3">
              {num(last)} € · {growth >= 0 ? "+" : ""}
              {growth}% en el periodo
            </span>
          </div>
          <AreaChart data={o.mrrHistory.map((m) => m.mrr)} className="mt-4 h-44" />
          <div className="mt-2 flex justify-between font-mono text-[11px] uppercase text-ink-3" aria-hidden>
            {o.mrrHistory.map((m, i) => (
              <span key={i}>{m.month}</span>
            ))}
          </div>
          <p className="sr-only">
            Evolución del MRR: {o.mrrHistory.map((m) => `${m.month} ${m.mrr} €`).join(", ")}.
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Mezcla de planes</h2>
          <p className="mb-4 text-sm text-ink-3">Suscripciones no canceladas por plan</p>
          {o.planMix.length ? <Bars data={o.planMix} /> : <p className="text-sm text-ink-3">Aún no hay suscripciones.</p>}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section aria-labelledby="altas">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="altas" className="font-semibold">
              Últimas altas
            </h2>
            <Link href="/admin/usuarios" className="-my-2 inline-flex min-h-10 items-center text-sm text-ink-2 underline-offset-4 hover:underline sm:my-0 sm:min-h-0">
              Ver todos
            </Link>
          </div>
          <DataTable caption="Últimas altas de usuarios">
            <THead>
              <Th>Usuario</Th>
              <Th>Plan</Th>
              <Th>Estado</Th>
              <Th className="text-right">Alta</Th>
            </THead>
            <tbody>
              {o.recentSignups.map((u) => (
                <Tr key={u.id}>
                  <Td>
                    <Link href={`/admin/usuarios/${u.id}`} className="font-medium hover:underline">
                      {u.full_name ?? u.email}
                    </Link>
                    <div className="text-xs text-ink-3">{u.workspace}</div>
                  </Td>
                  <Td className="capitalize">{u.plan_id ?? "—"}</Td>
                  <Td>
                    <SubStatusBadge status={u.status} />
                  </Td>
                  <Td className="text-right tabular-nums text-ink-2">{fmtDate(u.created_at)}</Td>
                </Tr>
              ))}
              {!o.recentSignups.length && <EmptyRow cols={4}>Sin altas todavía.</EmptyRow>}
            </tbody>
          </DataTable>
        </section>

        <section aria-labelledby="fallos">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="fallos" className="font-semibold">
              Trabajos fallidos
            </h2>
            <Link href="/admin/cola" className="-my-2 inline-flex min-h-10 items-center text-sm text-ink-2 underline-offset-4 hover:underline sm:my-0 sm:min-h-0">
              Ir a la cola
            </Link>
          </div>
          <DataTable caption="Trabajos de generación o publicación fallidos">
            <THead>
              <Th>Artículo</Th>
              <Th>Sitio</Th>
              <Th className="text-right">Cuándo</Th>
            </THead>
            <tbody>
              {o.failedJobs.map((j) => (
                <Tr key={j.id}>
                  <Td>
                    <div className="font-medium">{j.title}</div>
                    {j.error && <div className="text-xs text-bad">{j.error}</div>}
                  </Td>
                  <Td>{j.site}</Td>
                  <Td className="text-right text-ink-2">{fmtDate(j.started_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Td>
                </Tr>
              ))}
              {!o.failedJobs.length && (
                <EmptyRow cols={3}>
                  <Badge tone="ok">Todo en orden</Badge> No hay trabajos fallidos.
                </EmptyRow>
              )}
            </tbody>
          </DataTable>
        </section>
      </div>
    </>
  );
}
