import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { AreaChart } from "@/components/charts";
import { DataTable, TableCount } from "@/components/panel/data-table";
import { ModelLogo } from "@/components/panel/model-logo";
import { LinkTabs } from "@/components/panel/tabs";
import { ButtonLink, Card, CardHeader, EmptyState, PageHeader, Stat } from "@/components/ui";
import { getCurrentSite } from "@/lib/data";
import { getAnalytics } from "@/lib/panel/data";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Analítica" };

const TABS = [
  { id: "google", label: "Google" },
  { id: "ia", label: "Tráfico IA" },
  { id: "ga4", label: "GA4" },
];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === sp.tab) ? sp.tab! : "google";
  const site = await getCurrentSite();
  const a = await getAnalytics(site?.id);
  const t = a.traffic;
  const last = t.slice(-30);
  const prev = t.slice(-60, -30);
  type Metric = "clicks" | "impressions" | "ai_visits" | "sessions";
  const sum = (arr: typeof t, k: Metric) => arr.reduce((acc, p) => acc + (p[k] ?? 0), 0);
  const delta = (k: Metric) => {
    const b = sum(prev, k);
    return b ? `${sum(last, k) >= b ? "+" : ""}${Math.round(((sum(last, k) - b) / b) * 100)}%` : undefined;
  };
  const range = t.length ? `${fmtDate(t[0].date)} – ${fmtDate(t[t.length - 1].date)}` : "";
  const labels = t.length ? [0, 0.5, 1].map((f) => fmtDate(t[Math.round(f * (t.length - 1))].date)) : undefined;
  const trendOf = (k: Metric): "up" | "down" | "flat" => {
    const b = sum(prev, k);
    const a = sum(last, k);
    return !b || a === b ? "flat" : a > b ? "up" : "down";
  };

  return (
    <>
      <PageHeader title="Analítica" intro="Lo que tu contenido consigue en Google y en los asistentes de IA." />
      <LinkTabs basePath="/panel/analitica" current={tab} tabs={TABS} />

      {!a.google.connected ? (
        <EmptyState title="Conecta Google" icon={<BarChart3 className="h-5 w-5" />}>
          <span className="block">Enlaza tu cuenta de Google para traer Search Console y Analytics 4: verás tus clics, impresiones, consultas y las visitas que llegan desde ChatGPT, Perplexity o Gemini.</span>
          <ButtonLink href="/panel/ajustes/analitica" variant="ink" className="mt-4 max-sm:w-full">
            Conectar Google
          </ButtonLink>
        </EmptyState>
      ) : !a.google.gsc && !a.google.ga4 ? (
        <EmptyState title="Elige qué propiedad quieres ver">
          <span className="block">Google ya está conectado{a.google.account ? ` (${a.google.account})` : ""}. Falta elegir la propiedad de Search Console y la de GA4.</span>
          <ButtonLink href="/panel/ajustes/analitica" variant="ink" className="mt-4 max-sm:w-full">
            Elegir propiedades
          </ButtonLink>
        </EmptyState>
      ) : !a.connected ? (
        <EmptyState title={a.google.error ? "No hemos podido traer tus datos" : "Estamos importando tus datos"}>
          <span className="block">{a.google.error ?? "La primera importación tarda unos minutos. Después se actualiza cada noche."}</span>
          <Link href="/panel/ajustes/analitica" className="mt-3 inline-flex min-h-11 items-center underline sm:min-h-0">
            Revisar la conexión
          </Link>
        </EmptyState>
      ) : tab !== "google" && !a.google.ga4 ? (
        <EmptyState title="Elige tu propiedad de Google Analytics 4">
          <span className="block">El tráfico desde asistentes de IA y las sesiones salen de GA4. Elige la propiedad en Ajustes › Analítica.</span>
          <ButtonLink href="/panel/ajustes/analitica" variant="ink" className="mt-4 max-sm:w-full">
            Elegir propiedad GA4
          </ButtonLink>
        </EmptyState>
      ) : tab === "google" && !a.google.gsc ? (
        <EmptyState title="Elige tu propiedad de Search Console">
          <span className="block">Los clics, impresiones y consultas salen de Search Console. Elige la propiedad en Ajustes › Analítica.</span>
          <ButtonLink href="/panel/ajustes/analitica" variant="ink" className="mt-4 max-sm:w-full">
            Elegir propiedad
          </ButtonLink>
        </EmptyState>
      ) : tab === "google" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <Stat label="Clics (30 d)" value={num(sum(last, "clicks"))} delta={delta("clicks")} trend={trendOf("clicks")} hint="vs. mes anterior" />
            <Stat label="Impresiones (30 d)" value={num(sum(last, "impressions"))} delta={delta("impressions")} trend={trendOf("impressions")} hint="vs. mes anterior" />
            <Stat label="CTR medio" value={`${((sum(last, "clicks") / Math.max(sum(last, "impressions"), 1)) * 100).toFixed(1)}%`} />
            <Stat label="Posición media" value={(a.topQueries.reduce((x, q) => x + q.position, 0) / Math.max(a.topQueries.length, 1)).toFixed(1)} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Clics" intro={range} />
              <div className="p-5">
                <AreaChart data={t.map((p) => p.clicks)} labels={labels} height={180} className="h-44" id="clicks" />
              </div>
            </Card>
            <Card>
              <CardHeader title="Impresiones" intro={range} />
              <div className="p-5">
                <AreaChart data={t.map((p) => p.impressions)} color="var(--ink)" labels={labels} height={180} className="h-44" id="impr" />
              </div>
            </Card>
          </div>
          <Card className="mt-4 overflow-hidden md:mt-5">
            <CardHeader title="Consultas principales" intro="Lo que la gente escribe en Google para llegar a ti" />
            <DataTable
              flat
              mobile="scroll"
              minWidth={560}
              rows={a.topQueries}
              rowKey={(q) => q.query}
              columns={[
                { key: "q", header: "Consulta", cell: (q) => <span className="font-medium">{q.query}</span> },
                { key: "c", header: "Clics", numeric: true, cell: (q) => num(q.clicks) },
                { key: "i", header: "Impresiones", numeric: true, cell: (q) => num(q.impressions) },
                { key: "ctr", header: "CTR", numeric: true, cell: (q) => `${((q.clicks / Math.max(q.impressions, 1)) * 100).toFixed(1)}%` },
                { key: "p", header: "Posición", numeric: true, cell: (q) => q.position.toFixed(1) },
              ]}
              footer={<TableCount shown={a.topQueries.length} total={a.topQueries.length} unit="consultas" />}
            />
          </Card>
          {a.topPages.length > 0 && (
            <Card className="mt-4 overflow-hidden md:mt-5">
              <CardHeader title="Páginas principales" intro="Últimos 28 días" />
              <DataTable
                flat
                mobile="scroll"
                minWidth={560}
                rows={a.topPages}
                rowKey={(pg) => pg.page}
                columns={[
                  {
                    key: "p",
                    header: "Página",
                    className: "max-w-[320px]",
                    cell: (pg) => (
                      <a href={pg.page} target="_blank" rel="noreferrer" className="block truncate font-medium hover:underline">
                        {pg.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                      </a>
                    ),
                  },
                  { key: "c", header: "Clics", numeric: true, cell: (pg) => num(pg.clicks) },
                  { key: "i", header: "Impresiones", numeric: true, cell: (pg) => num(pg.impressions) },
                  { key: "pos", header: "Posición", numeric: true, cell: (pg) => pg.position.toFixed(1) },
                ]}
              />
            </Card>
          )}
        </>
      ) : tab === "ia" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            <Stat label="Visitas desde IA (30 d)" value={num(sum(last, "ai_visits"))} delta={delta("ai_visits")} trend={trendOf("ai_visits")} hint="vs. mes anterior" />
            <Stat label="Fuente principal" value={a.aiReferrers[0]?.source ?? "—"} icon={a.aiReferrers[0] ? <ModelLogo model={a.aiReferrers[0].source} size={20} /> : undefined} />
            <Stat label="% del tráfico orgánico" value={`${((sum(last, "ai_visits") / Math.max(sum(last, "clicks"), 1)) * 100).toFixed(1)}%`} className="col-span-2 lg:col-span-1" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Visitas diarias desde asistentes de IA" intro={range} />
              <div className="p-5">
                <AreaChart data={t.map((p) => p.ai_visits)} color="var(--ok)" labels={labels} height={190} className="h-44 md:h-48" id="ai" />
              </div>
            </Card>
            <Card>
              <CardHeader title="Por asistente" intro="Últimos 90 días" />
              <ul className="space-y-3 p-5">
                {a.aiReferrers.map((r) => {
                  const max = Math.max(...a.aiReferrers.map((x) => x.visits), 1);
                  return (
                    <li key={r.source} className="grid grid-cols-[auto_minmax(4rem,6rem)_minmax(0,1fr)_3rem] items-center gap-2.5 text-[13px]">
                      <ModelLogo model={r.source} size={18} />
                      <span className="truncate text-ink-2">{r.source}</span>
                      <span className="h-1.5 min-w-0 overflow-hidden rounded-full bg-paper-3">
                        <span className="block h-full rounded-full bg-ok transition-[width] duration-500" style={{ width: `${(r.visits / max) * 100}%` }} />
                      </span>
                      <span className="tabular text-right font-medium">{num(r.visits)}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="border-t border-line px-5 py-3 text-xs text-ink-3">Detectamos el origen por el referrer y los parámetros utm que añaden los asistentes.</p>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            <Stat label="Sesiones (30 d)" value={num(sum(last, "sessions"))} delta={delta("sessions")} trend={trendOf("sessions")} hint="vs. mes anterior" />
            <Stat label="Sesiones desde IA (30 d)" value={num(sum(last, "ai_visits"))} delta={delta("ai_visits")} trend={trendOf("ai_visits")} hint="vs. mes anterior" />
            <Stat label="% de sesiones desde IA" value={`${((sum(last, "ai_visits") / Math.max(sum(last, "sessions"), 1)) * 100).toFixed(1)}%`} className="col-span-2 lg:col-span-1" />
          </div>
          <Card className="mt-4 md:mt-5">
            <CardHeader title="Sesiones diarias" intro={`${range} · Fuente: Google Analytics 4`} />
            <div className="p-5">
              <AreaChart data={t.map((p) => p.sessions ?? 0)} color="var(--warn)" labels={labels} height={190} className="h-44 md:h-48" id="ga4" />
            </div>
          </Card>
        </>
      )}
    </>
  );
}
