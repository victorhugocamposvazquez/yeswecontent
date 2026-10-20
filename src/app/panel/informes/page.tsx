import { AreaChart, ScoreRing } from "@/components/charts";
import { ModelLogo } from "@/components/panel/model-logo";
import { PrintButton } from "@/components/panel/print-button";
import { Button, Logo, PageHeader, Select } from "@/components/ui";
import { getCurrentSite, getLatestAudit, getVisibility, listArticles } from "@/lib/data";
import { getAnalytics, getWorkspace, listBacklinks } from "@/lib/panel/data";
import { overallShare, shareByModel } from "@/lib/panel/visibility";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Informes" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const site = (await getCurrentSite())!;
  const [articles, vis, audit, analytics, links, ws] = await Promise.all([
    listArticles(site.id),
    getVisibility(site.id),
    getLatestAudit(site.id),
    getAnalytics(site.id),
    listBacklinks(site.id),
    getWorkspace(site.workspace_id),
  ]);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d) };
  });
  const month = months.find((m) => m.value === sp.mes) ?? months[0];
  const inMonth = (d: string | null) => !!d && d.startsWith(month.value);
  const published = articles.filter((a) => inMonth(a.published_at));
  const days = analytics.traffic.filter((p) => inMonth(p.date));
  const series = days.length ? days : analytics.traffic.slice(-30);
  const clicks = series.reduce((a, p) => a + p.clicks, 0);
  const impressions = series.reduce((a, p) => a + p.impressions, 0);
  const ai = series.reduce((a, p) => a + p.ai_visits, 0);
  const newLinks = links.filter((l) => l.direction === "received" && inMonth(l.created_at));
  const brand = (ws?.white_label as { brand_name?: string } | undefined)?.brand_name;

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Informes"
          intro="Un resumen mensual para compartir con tu equipo o tus clientes. Descárgalo como PDF desde el botón."
          actions={
            <>
              <form action="/panel/informes" className="flex gap-2">
                <label htmlFor="mes" className="sr-only">
                  Mes del informe
                </label>
                <Select id="mes" name="mes" defaultValue={month.value} className="w-48">
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="outline">
                  Ver
                </Button>
              </form>
              <PrintButton />
            </>
          }
        />
      </div>

      <article className="space-y-7 rounded-2xl border border-line bg-card p-6 shadow-[var(--shadow-xs)] md:p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="eyebrow">Informe mensual</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight first-letter:uppercase md:text-3xl">{month.label}</h1>
            <p className="mt-0.5 text-[13px] text-ink-2">
              {site.name} · {site.url.replace(/^https?:\/\//, "")}
            </p>
          </div>
          {brand ? <p className="text-lg font-semibold">{brand}</p> : <Logo />}
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Clics en Google", num(clicks)],
            ["Impresiones", num(impressions)],
            ["Visitas desde IA", num(ai)],
            ["Artículos publicados", String(published.length)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-line bg-paper-2/60 p-4">
              <p className="text-xs font-medium text-ink-3">{l}</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{v}</p>
            </div>
          ))}
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Tráfico orgánico diario</h2>
          {series.length ? <AreaChart data={series.map((p) => p.clicks)} labels={[fmtDate(series[0].date), fmtDate(series[series.length - 1].date)]} height={180} className="h-44" /> : <p className="text-sm text-ink-3">Sin datos de Search Console.</p>}
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="break-inside-avoid">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">
              Visibilidad en IA · <span className="tabular">{overallShare(vis.checks)}%</span>
            </h2>
            <ul className="space-y-2.5">
              {shareByModel(vis.checks).map((m) => (
                <li key={m.model} className="grid grid-cols-[auto_minmax(4rem,6rem)_minmax(0,1fr)_2.5rem] items-center gap-2.5 text-[13px]">
                  <ModelLogo model={m.model} size={16} />
                  <span className="truncate text-ink-2">{m.label}</span>
                  <span className="h-1.5 min-w-0 overflow-hidden rounded-full bg-paper-3">
                    <span className="block h-full rounded-full bg-ink" style={{ width: `${m.share}%` }} />
                  </span>
                  <span className="tabular text-right font-medium">{m.share}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-4 break-inside-avoid rounded-xl border border-line p-4">
            {audit?.score != null && <ScoreRing score={audit.score} size={88} label="/ 100" />}
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">Salud técnica</h2>
              <p className="text-sm text-ink-2">{audit ? `${audit.results.filter((r) => r.status === "fail").length} fallos y ${audit.results.filter((r) => r.status === "warn").length} mejoras pendientes.` : "Sin auditoría."}</p>
              <p className="mt-1 text-sm text-ink-2">{newLinks.length} enlaces nuevos recibidos este mes.</p>
            </div>
          </div>
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-2 text-[15px] font-semibold tracking-tight">Publicado este mes</h2>
          {published.length ? (
            <table className="w-full text-[13px]">
              <thead className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                <tr>
                  <th className="py-2 font-semibold">Artículo</th>
                  <th className="py-2 pl-3 text-right font-semibold">Fecha</th>
                  <th className="py-2 pl-3 text-right font-semibold">Calidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {published.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 font-medium">{a.title}</td>
                    <td className="whitespace-nowrap py-2.5 pl-3 text-right text-ink-3">{fmtDate(a.published_at!)}</td>
                    <td className="tabular whitespace-nowrap py-2.5 pl-3 text-right">{a.quality_score}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-ink-3">No se publicaron artículos este mes.</p>
          )}
        </section>

        <footer className="border-t border-line pt-4 text-xs text-ink-3">Generado el {fmtDate(new Date(), { day: "numeric", month: "long", year: "numeric" })}.</footer>
      </article>
    </>
  );
}
