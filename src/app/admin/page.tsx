import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { AreaChart, Bars, Columns, Sparkline } from "@/components/charts";
import { Badge, Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { DataTable, EmptyRow, IconButton, rowLink, SectionTitle, Sub, SubStatusBadge, Td, Th, THead, Tr } from "@/components/admin/table";
import { getOverview, listAdminUsers } from "@/lib/admin/data";
import { eur, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Resumen" };

const MONTHS = 6;

/** Sparkline compacta para la esquina de un `Stat` (no empuja la etiqueta en móvil). */
function Spark({ children }: { children: ReactNode }) {
  return <span className="block w-12 shrink-0 sm:w-20 [&>svg]:h-5 [&>svg]:w-full">{children}</span>;
}

export default async function AdminHome() {
  const [o, users] = await Promise.all([getOverview(), listAdminUsers()]);
  const mrrSeries = o.mrrHistory.map((m) => m.mrr);
  const first = mrrSeries[0] ?? 0;
  const last = mrrSeries.at(-1) ?? 0;
  const growth = first ? Math.round(((last - first) / first) * 100) : 0;
  const prev = mrrSeries.at(-2) ?? last;
  const mom = prev ? Math.round(((last - prev) / prev) * 100) : 0;

  // Altas por mes (últimos 6 meses) a partir de la fecha de alta de cada usuario.
  const now = new Date();
  const signups = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const value = users.filter((u) => {
      const t = new Date(u.created_at).getTime();
      return t >= d.getTime() && t < next.getTime();
    }).length;
    return { label: new Intl.DateTimeFormat("es-ES", { month: "short" }).format(d).replace(".", ""), value };
  });
  const signupSeries = signups.map((s) => s.value);
  const sPrev = signupSeries.at(-2) ?? 0;
  const sLast = signupSeries.at(-1) ?? 0;
  const trialSeries = users.filter((u) => u.status === "trialing").length;
  const planTotal = o.planMix.reduce((t, p) => t + p.value, 0);

  const trend = (n: number): "up" | "down" | "flat" => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const pct = (n: number) => `${n > 0 ? "+" : ""}${n} %`;

  return (
    <>
      <PageHeader title="Resumen" intro="El pulso del negocio: ingresos, altas y la salud de la máquina de contenido." />

      <section aria-label="Métricas clave" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="MRR" value={eur(o.mrr)} delta={pct(mom)} trend={trend(mom)} hint="vs. mes anterior" icon={<Spark><Sparkline data={mrrSeries} /></Spark>} />
        <Stat
          label="Suscripciones activas"
          value={num(o.activeSubs)}
          delta={`${num(planTotal)} con plan`}
          trend="flat"
          hint={`${o.planMix.length} planes en uso`}
        />
        <Stat label="En prueba" value={num(o.trials)} hint={trialSeries ? `${num(trialSeries)} usuarios en periodo de prueba` : "Sin pruebas en curso"} />
        <Stat label="Churn (histórico)" value={`${o.churnPct.toLocaleString("es-ES")} %`} delta={o.churnPct <= 5 ? "Sano" : "Alto"} trend={o.churnPct <= 5 ? "up" : "down"} />
        <Stat
          label="Altas (30 días)"
          value={num(o.newSignups)}
          delta={sPrev ? pct(Math.round(((sLast - sPrev) / sPrev) * 100)) : `${sLast} este mes`}
          trend={sPrev ? trend(sLast - sPrev) : "flat"}
          icon={<Spark><Sparkline data={signupSeries} color="var(--ok)" /></Spark>}
        />
        <Stat label="Artículos publicados" value={num(o.publishedThisMonth)} hint="este mes, todos los sitios" />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="MRR últimos 12 meses"
            intro={`${num(last)} € · ${growth >= 0 ? "+" : ""}${growth} % en el periodo`}
            className="px-4 py-3"
            action={
              <Badge tone={growth >= 0 ? "ok" : "bad"} dot>
                {pct(growth)}
              </Badge>
            }
          />
          <div className="px-4 pb-3 pt-4">
            <AreaChart data={mrrSeries} labels={o.mrrHistory.map((m) => m.month)} className="h-44" id="mrr" />
            <p className="sr-only">Evolución del MRR: {o.mrrHistory.map((m) => `${m.month} ${m.mrr} €`).join(", ")}.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Altas por mes" intro={`Últimos ${MONTHS} meses`} className="px-4 py-3" />
          <div className="px-4 pb-3 pt-4">
            <Columns data={signups} color="var(--ink)" className="h-36 [&>div]:h-full [&>div]:justify-end" />
            <p className="sr-only">Altas: {signups.map((s) => `${s.label} ${s.value}`).join(", ")}.</p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader title="Mezcla de planes" intro="Suscripciones no canceladas" className="px-4 py-3" />
          <div className="px-4 py-4">
            {o.planMix.length ? <Bars data={o.planMix} /> : <p className="text-[13px] text-ink-3">Aún no hay suscripciones.</p>}
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          <section aria-labelledby="altas">
            <SectionTitle
              id="altas"
              action={
                <Link href="/admin/usuarios" className="inline-flex min-h-8 items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
                  Ver todos <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              }
            >
              Últimas altas
            </SectionTitle>
            <DataTable caption="Últimas altas de usuarios" minWidth="min-w-[560px]">
              <THead>
                <Th>Usuario</Th>
                <Th>Plan</Th>
                <Th>Estado</Th>
                <Th numeric>Alta</Th>
              </THead>
              <tbody>
                {o.recentSignups.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <Link href={`/admin/usuarios/${u.id}`} className={rowLink}>
                        {u.full_name ?? u.email}
                      </Link>
                      <Sub>{u.workspace}</Sub>
                    </Td>
                    <Td className="capitalize">{u.plan_id ?? "—"}</Td>
                    <Td>
                      <SubStatusBadge status={u.status} />
                    </Td>
                    <Td numeric muted>
                      {fmtDate(u.created_at)}
                    </Td>
                  </Tr>
                ))}
                {!o.recentSignups.length && <EmptyRow cols={4}>Sin altas todavía.</EmptyRow>}
              </tbody>
            </DataTable>
          </section>

          <section aria-labelledby="fallos">
            <SectionTitle
              id="fallos"
              action={
                <Link href="/admin/cola" className="inline-flex min-h-8 items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
                  Ir a la cola <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              }
            >
              Trabajos fallidos
            </SectionTitle>
            <DataTable caption="Trabajos de generación o publicación fallidos" minWidth="min-w-[560px]">
              <THead>
                <Th>Artículo</Th>
                <Th>Sitio</Th>
                <Th numeric>Cuándo</Th>
                <Th className="w-12">
                  <span className="sr-only">Acciones</span>
                </Th>
              </THead>
              <tbody>
                {o.failedJobs.map((j) => (
                  <Tr key={j.id} tone="bad">
                    <Td>
                      <div className="font-medium">{j.title}</div>
                      {j.error && <Sub className="text-bad">{j.error}</Sub>}
                    </Td>
                    <Td muted>{j.site}</Td>
                    <Td numeric muted>
                      {fmtDate(j.started_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </Td>
                    <Td>
                      <IconButton label="Ver en la cola" href="/admin/cola?stage=failed">
                        <RotateCcw className="size-4" aria-hidden />
                      </IconButton>
                    </Td>
                  </Tr>
                ))}
                {!o.failedJobs.length && (
                  <EmptyRow cols={4}>
                    <Badge tone="ok" dot>
                      Todo en orden
                    </Badge>{" "}
                    No hay trabajos fallidos.
                  </EmptyRow>
                )}
              </tbody>
            </DataTable>
          </section>
        </div>
      </div>
    </>
  );
}
