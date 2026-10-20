import { AreaChart, Bars } from "@/components/charts";
import { agencyName, getPortal, getPortalResults } from "@/lib/clientes/data";
import { host } from "@/lib/clientes/format";
import { overallShare, shareByModel } from "@/lib/panel/visibility";
import { fmtDate, num } from "@/lib/utils";
import { AgencyMark } from "../_components/agency-mark";
import { pButton } from "../_components/button-class";
import { PSelect } from "../_components/form";
import { PrintButton } from "../_components/print-button";

export const metadata = { title: "Informes" };

export default async function ClientReportsPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const { site, agency } = await getPortal();
  const res = await getPortalResults(site);
  const name = agencyName(agency);

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d),
      current: i === 0,
    };
  });
  const month = months.find((m) => m.value === sp.mes) ?? months[0];
  const inMonth = (d: string | null) => !!d && d.startsWith(month.value);
  const published = res.articles.filter((a) => a.status === "published" && inMonth(a.published_at));
  const days = res.traffic.filter((p) => inMonth(p.date));
  const clicks = days.reduce((a, p) => a + p.clicks, 0);
  const impressions = days.reduce((a, p) => a + p.impressions, 0);
  const ai = days.reduce((a, p) => a + p.ai_visits, 0);
  const share = overallShare(res.checks);

  return (
    <div className="space-y-5">
      <div className="space-y-4 print:hidden">
        <header>
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight md:text-[1.9rem]">Informes</h1>
          <p className="mt-1 text-sm text-ink-2">Tu resumen mensual. Descárgalo en PDF para compartirlo con quien quieras.</p>
        </header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form action="/clientes/informes" className="flex flex-1 gap-2 sm:max-w-sm">
            <label htmlFor="mes" className="sr-only">
              Mes del informe
            </label>
            <PSelect id="mes" name="mes" defaultValue={month.value}>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                  {m.current ? " (en curso)" : ""}
                </option>
              ))}
            </PSelect>
            <button type="submit" className={pButton("outline", "shrink-0")}>
              Ver
            </button>
          </form>
          <PrintButton label="Descargar PDF" />
        </div>
      </div>

      <article className="space-y-6 rounded-2xl border border-line bg-card p-4 shadow-[var(--shadow-xs)] sm:p-8 lg:p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col-reverse gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Informe mensual</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight first-letter:uppercase">{month.label}</h2>
            <p className="text-ink-2">
              {site.name} · {host(site.url)}
            </p>
          </div>
          <AgencyMark name={name} logoUrl={agency.white_label.logo_url} />
        </header>

        {month.current && <p className="rounded-lg bg-paper-2 px-3 py-2 text-sm text-ink-2 print:hidden">El mes aún no ha terminado: las cifras se actualizan cada día.</p>}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Visitas desde Google", num(clicks)],
            ["Veces que apareciste", num(impressions)],
            ["Visitas desde IA", num(ai)],
            ["Artículos publicados", String(published.length)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-line bg-paper-2/60 p-3.5 sm:p-4">
              <p className="text-xs font-medium leading-tight text-ink-3">{l}</p>
              <p className="tabular mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{v}</p>
            </div>
          ))}
        </section>

        <section className="break-inside-avoid">
          <h3 className="mb-2 font-semibold">Visitas diarias desde Google</h3>
          {days.length ? <AreaChart data={days.map((p) => p.clicks)} /> : <p className="text-sm text-ink-3">Sin datos de tráfico para este mes.</p>}
        </section>

        <section className="break-inside-avoid">
          <h3 className="mb-1 font-semibold">Visibilidad en asistentes de IA · {share}%</h3>
          <p className="mb-3 text-sm text-ink-3">Porcentaje de respuestas en las que se menciona tu marca.</p>
          {res.checks.length ? <Bars data={shareByModel(res.checks).map((m) => ({ label: m.label, value: m.share }))} /> : <p className="text-sm text-ink-3">Aún sin mediciones.</p>}
        </section>

        <section className="break-inside-avoid">
          <h3 className="mb-2 font-semibold">Publicado este mes</h3>
          {published.length ? (
            <ul className="divide-y divide-line text-[15px]">
              {published.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">{a.title}</span>
                  <span className="shrink-0 text-sm text-ink-3">{fmtDate(a.published_at!)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-3">Este mes no se publicaron artículos.</p>
          )}
        </section>

        <footer className="border-t border-line pt-4 text-xs text-ink-3">
          Preparado por {name} · {fmtDate(new Date(), { day: "numeric", month: "long", year: "numeric" })}
        </footer>
      </article>
    </div>
  );
}
