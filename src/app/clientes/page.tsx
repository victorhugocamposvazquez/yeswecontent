import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, ExternalLink, FileBarChart, Lock } from "lucide-react";
import { AreaChart } from "@/components/charts";
import { ContentStatusBadge } from "@/components/panel/status";
import { ModelLogo } from "@/components/panel/model-logo";
import { Card, CardHeader } from "@/components/ui";
import { agencyName, getPortal, getPortalResults, resolvePortal } from "@/lib/clientes/data";
import { overallShare, shareByModel } from "@/lib/panel/visibility";
import { cn, fmtDate, num } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  // El template del layout no aplica a su propio segmento: título absoluto con la marca de la agencia.
  const r = await resolvePortal();
  return { title: { absolute: r.ok ? `Inicio · ${agencyName(r.ctx.agency)}` : "Portal de clientes" } };
}

const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default async function ClientHomePage() {
  const ctx = await getPortal();
  const { site, client, viewer, agency } = ctx;
  const full = client.visibility_mode === "completo";
  const res = await getPortalResults(site);

  const last30 = res.traffic.slice(-30);
  const prev30 = res.traffic.slice(-60, -30);
  const sum = (arr: typeof last30, k: "clicks" | "impressions" | "ai_visits") => arr.reduce((a, p) => a + p[k], 0);
  const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
  const clicks = sum(last30, "clicks");
  const clicksDelta = delta(clicks, sum(prev30, "clicks"));
  const ai = sum(last30, "ai_visits");
  const aiDelta = delta(ai, sum(prev30, "ai_visits"));

  const month = monthKey();
  const publishedThisMonth = res.articles.filter((a) => a.status === "published" && a.published_at?.startsWith(month));
  const recentPublished = res.articles
    .filter((a) => a.status === "published" && a.published_at)
    .sort((a, b) => b.published_at!.localeCompare(a.published_at!))
    .slice(0, 4);
  const share = overallShare(res.checks);
  const byModel = shareByModel(res.checks);
  const upcoming = res.items
    .filter((i) => ["scheduled", "review", "writing", "planned"].includes(i.status) && i.scheduled_for && i.scheduled_for >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.scheduled_for!.localeCompare(b.scheduled_for!));
  const upcomingThisMonth = upcoming.filter((i) => i.scheduled_for!.startsWith(month)).length;
  const firstName = ctx.preview ? "" : viewer.name.split(" ")[0];
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date());
  const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const prevMonthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(prevMonth);

  return (
    <div className="space-y-6 lg:space-y-8">
      <header>
        <p className="text-[13px] text-ink-3">{site.name}</p>
        <h1 className="mt-0.5 text-[1.65rem] font-semibold leading-tight tracking-tight md:text-[1.9rem]">{firstName ? `Hola, ${firstName}` : "Tus resultados"}</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-2">Así está funcionando tu contenido este mes. Lo preparamos y lo publicamos nosotros; aquí solo tienes que mirar cómo crece.</p>
      </header>

      <section aria-label="Resultados clave" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi label="Visitas desde Google" sub="últimos 30 días" value={num(clicks)} delta={clicksDelta} />
        <Kpi label="Visitas desde IA" sub="ChatGPT, Gemini…" value={num(ai)} delta={aiDelta} />
        <Kpi label="Artículos publicados" sub={`en ${monthLabel}`} value={String(publishedThisMonth.length)} />
        <Kpi label="Te recomiendan en IA" sub="de las preguntas seguidas" value={`${share}%`} />
      </section>

      <Card>
        <CardHeader
          title="Visitas desde Google"
          intro="Clics diarios de los últimos 90 días"
          action={
            clicksDelta != null && (
              <p className="rounded-full bg-signal-soft px-2.5 py-1 text-xs font-semibold text-signal">
                {clicksDelta >= 0 ? "+" : ""}
                {clicksDelta}% en 30 días
              </p>
            )
          }
        />
        <div className="p-4 sm:p-5">
          {res.traffic.length ? (
            <AreaChart data={res.traffic.map((p) => p.clicks)} labels={[fmtDate(res.traffic[0].date), fmtDate(res.traffic[res.traffic.length - 1].date)]} height={190} className="h-44 md:h-48" />
          ) : (
            <p className="py-8 text-center text-sm text-ink-3">Estamos conectando tus datos de Search Console. En unos días verás aquí la evolución.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Visibilidad en asistentes de IA" intro={`En qué porcentaje de respuestas aparece ${site.name} cuando alguien pregunta por lo que ofreces.`} />
          <div className="p-4 sm:p-5">
            {res.checks.length ? (
              <ul className="space-y-3">
                {byModel.map((m) => (
                  <li key={m.model} className="grid grid-cols-[auto_minmax(4.5rem,6rem)_minmax(0,1fr)_2.5rem] items-center gap-2.5 text-[13px]">
                    <ModelLogo model={m.model} size={18} />
                    <span className="truncate text-ink-2">{m.label}</span>
                    <span className="h-1.5 min-w-0 overflow-hidden rounded-full bg-paper-3">
                      <span className="block h-full rounded-full bg-signal transition-[width] duration-500" style={{ width: `${m.share}%` }} />
                    </span>
                    <span className="tabular text-right font-medium">{m.share}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-3">Aún no hay mediciones. La primera llega esta semana.</p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-4 sm:p-6 lg:col-span-2">
          <div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-soft text-signal">
              <FileBarChart className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-3 font-semibold">Último informe</h2>
            <p className="text-sm text-ink-2 first-letter:uppercase">{prevMonthLabel}</p>
            <p className="mt-1 text-sm text-ink-3">Tráfico, visibilidad en IA y todo lo publicado, listo para descargar en PDF.</p>
          </div>
          <Link
            href={`/clientes/informes?mes=${monthKey(prevMonth)}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-signal px-4.5 text-sm font-semibold text-signal-ink shadow-[var(--shadow-xs)] transition hover:brightness-95 active:translate-y-px"
          >
            Ver informe <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Publicado recientemente" intro="Ya está en tu web y trabajando para ti." />
          {recentPublished.length ? (
            <ul className="divide-y divide-line">
              {recentPublished.map((a) => {
                const href = full ? `/clientes/articulos/${a.id}` : a.published_url;
                const inner = (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[15px] font-medium leading-snug">{a.title}</span>
                      <span className="text-xs text-ink-3">{fmtDate(a.published_at!, { day: "numeric", month: "long" })}</span>
                    </span>
                    {!full && a.published_url && <ExternalLink className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />}
                  </>
                );
                return (
                  <li key={a.id}>
                    {href ? (
                      full ? (
                        <Link href={href} className="flex min-h-14 items-center gap-3 px-5 py-2.5 transition-colors hover:bg-paper-2">
                          {inner}
                        </Link>
                      ) : (
                        <a href={href} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 px-5 py-2.5 transition-colors hover:bg-paper-2">
                          {inner}
                        </a>
                      )
                    ) : (
                      <div className="flex min-h-14 items-center gap-3 px-5 py-2.5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-5 text-sm text-ink-3">Tus primeros artículos están en camino.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Próximo contenido" intro={full ? "Lo que estamos preparando para las próximas semanas." : undefined} />
          {full ? (
            <div className="p-4 sm:p-5">
              {upcoming.length ? (
                <ul className="divide-y divide-line">
                  {upcoming.slice(0, 5).map((i) => (
                    <li key={i.id} className="flex items-start gap-3 py-2.5">
                      <span className="w-12 shrink-0 rounded-md bg-paper-2 py-0.5 text-center text-[11px] font-semibold uppercase text-ink-2">{fmtDate(i.scheduled_for!)}</span>
                      <span className="min-w-0 flex-1 text-[15px] leading-snug">{i.title}</span>
                      <span className="hidden shrink-0 sm:block">
                        <ContentStatusBadge status={i.status} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-3">Estamos cerrando el plan del mes que viene.</p>
              )}
              <Link href="/clientes/articulos" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-signal">
                Ver todos los artículos <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="m-4 flex items-start gap-3 rounded-xl bg-paper-2 p-4 sm:m-5">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-signal" aria-hidden />
              <div>
                <p className="text-[15px]">
                  <strong className="font-semibold">{upcomingThisMonth}</strong> {upcomingThisMonth === 1 ? "artículo más llegará" : "artículos más llegarán"} a tu web antes de fin de mes.
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-3">
                  <Lock className="h-3.5 w-3.5" aria-hidden /> {agencyName(agency)} gestiona el plan por ti. ¿Quieres proponer un tema?{" "}
                  <Link href="/clientes/ajustes/equipo" className="font-semibold text-signal underline">
                    Escríbenos
                  </Link>
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, sub, value, delta }: { label: string; sub: string; value: string; delta?: number | null }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-[13px] font-medium leading-tight text-ink-3">{label}</p>
      <p className="text-[11px] text-ink-3">{sub}</p>
      <p className="tabular mt-2 text-[1.75rem] font-semibold leading-none tracking-tight">{value}</p>
      {delta != null && (
        <p className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", delta >= 0 ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad")}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
          <span className="text-xs text-ink-3">vs. mes anterior</span>
        </p>
      )}
    </Card>
  );
}
