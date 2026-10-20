import { AreaChart, Bars, ScoreRing } from "@/components/charts";
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
    getAnalytics(),
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
                <Select id="mes" name="mes" defaultValue={month.value} className="w-48 capitalize">
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

      <article className="space-y-6 rounded-2xl border border-line bg-card p-6 md:p-10 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Informe mensual</p>
            <h1 className="mt-1 font-display text-4xl capitalize">{month.label}</h1>
            <p className="text-ink-2">
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
            <div key={l} className="rounded-xl bg-paper p-4">
              <p className="text-xs text-ink-3">{l}</p>
              <p className="text-2xl font-semibold">{v}</p>
            </div>
          ))}
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-2 font-semibold">Tráfico orgánico diario</h2>
          {series.length ? <AreaChart data={series.map((p) => p.clicks)} /> : <p className="text-sm text-ink-3">Sin datos de Search Console.</p>}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="break-inside-avoid">
            <h2 className="mb-3 font-semibold">Visibilidad en IA · {overallShare(vis.checks)}%</h2>
            <Bars data={shareByModel(vis.checks).map((m) => ({ label: m.label, value: m.share }))} />
          </div>
          <div className="flex items-center gap-4 break-inside-avoid">
            {audit?.score != null && <ScoreRing score={audit.score} size={96} />}
            <div>
              <h2 className="font-semibold">Salud técnica</h2>
              <p className="text-sm text-ink-2">{audit ? `${audit.results.filter((r) => r.status === "fail").length} fallos y ${audit.results.filter((r) => r.status === "warn").length} mejoras pendientes.` : "Sin auditoría."}</p>
              <p className="mt-1 text-sm text-ink-2">{newLinks.length} enlaces nuevos recibidos este mes.</p>
            </div>
          </div>
        </section>

        <section className="break-inside-avoid">
          <h2 className="mb-2 font-semibold">Publicado este mes</h2>
          {published.length ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {published.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2">{a.title}</td>
                    <td className="py-2 text-right text-ink-3">{fmtDate(a.published_at!)}</td>
                    <td className="py-2 text-right tabular-nums">{a.quality_score}/100</td>
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
