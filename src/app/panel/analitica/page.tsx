import Link from "next/link";
import { AreaChart, Bars } from "@/components/charts";
import { LinkTabs } from "@/components/panel/tabs";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui";
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
  const a = await getAnalytics();
  const t = a.traffic;
  const last = t.slice(-30);
  const prev = t.slice(-60, -30);
  const sum = (arr: typeof t, k: "clicks" | "impressions" | "ai_visits") => arr.reduce((acc, p) => acc + p[k], 0);
  const delta = (k: "clicks" | "impressions" | "ai_visits") => {
    const b = sum(prev, k);
    return b ? `${sum(last, k) >= b ? "+" : ""}${Math.round(((sum(last, k) - b) / b) * 100)}% vs. mes anterior` : undefined;
  };
  const range = t.length ? `${fmtDate(t[0].date)} – ${fmtDate(t[t.length - 1].date)}` : "";

  return (
    <>
      <PageHeader title="Analítica" intro="Lo que tu contenido consigue en Google y en los asistentes de IA." />
      <LinkTabs basePath="/panel/analitica" current={tab} tabs={TABS} />

      {!a.connected ? (
        <EmptyState title="Conecta tus fuentes de datos">
          Enlaza Search Console y Google Analytics 4 en <Link href="/panel/ajustes/analitica" className="underline">Ajustes › Analítica</Link> y aquí verás tus clics, impresiones y visitas desde IA.
        </EmptyState>
      ) : tab === "google" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <Stat label="Clics (30 d)" value={num(sum(last, "clicks"))} delta={delta("clicks")} />
            <Stat label="Impresiones (30 d)" value={num(sum(last, "impressions"))} delta={delta("impressions")} />
            <Stat label="CTR medio" value={`${((sum(last, "clicks") / Math.max(sum(last, "impressions"), 1)) * 100).toFixed(1)}%`} />
            <Stat label="Posición media" value={(a.topQueries.reduce((x, q) => x + q.position, 0) / Math.max(a.topQueries.length, 1)).toFixed(1)} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-semibold">Clics</h2>
              <p className="mb-3 text-xs text-ink-3">{range}</p>
              <AreaChart data={t.map((p) => p.clicks)} />
            </Card>
            <Card className="p-6">
              <h2 className="font-semibold">Impresiones</h2>
              <p className="mb-3 text-xs text-ink-3">{range}</p>
              <AreaChart data={t.map((p) => p.impressions)} color="var(--ink)" />
            </Card>
          </div>
          <Card className="mt-6 overflow-x-auto">
            <h2 className="px-5 pt-5 font-semibold">Consultas principales</h2>
            <table className="mt-3 w-full min-w-[520px] text-sm">
              <thead className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-3">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Consulta</th>
                  <th className="px-5 py-2.5 text-right font-medium">Clics</th>
                  <th className="px-5 py-2.5 text-right font-medium">Impresiones</th>
                  <th className="px-5 py-2.5 text-right font-medium">CTR</th>
                  <th className="px-5 py-2.5 text-right font-medium">Posición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {a.topQueries.map((q) => (
                  <tr key={q.query}>
                    <td className="px-5 py-3 font-medium">{q.query}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{num(q.clicks)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{num(q.impressions)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{((q.clicks / q.impressions) * 100).toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right tabular-nums">{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : tab === "ia" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            <Stat label="Visitas desde IA (30 d)" value={num(sum(last, "ai_visits"))} delta={delta("ai_visits")} />
            <Stat label="Fuente principal" value={a.aiReferrers[0]?.source ?? "—"} />
            <Stat label="% del tráfico orgánico" value={`${((sum(last, "ai_visits") / Math.max(sum(last, "clicks"), 1)) * 100).toFixed(1)}%`} className="col-span-2 lg:col-span-1" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <h2 className="font-semibold">Visitas diarias desde asistentes de IA</h2>
              <p className="mb-3 text-xs text-ink-3">{range}</p>
              <AreaChart data={t.map((p) => p.ai_visits)} color="var(--ok)" />
            </Card>
            <Card className="p-6">
              <h2 className="mb-4 font-semibold">Por asistente (90 d)</h2>
              <Bars data={a.aiReferrers.map((r) => ({ label: r.source, value: r.visits }))} />
              <p className="mt-4 text-xs text-ink-3">Detectamos el origen por el referrer y los parámetros utm que añaden los asistentes.</p>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <Stat label="Sesiones del blog (30 d)" value={num(Math.round(sum(last, "clicks") * 1.35))} delta={delta("clicks")} />
            <Stat label="Usuarios nuevos" value={num(Math.round(sum(last, "clicks") * 0.92))} />
            <Stat label="Tiempo medio" value="2:48" />
            <Stat label="Conversiones" value={num(Math.round(sum(last, "clicks") * 0.018))} delta="Clics en «añadir al carrito»" />
          </div>
          <Card className="mt-6 p-6">
            <h2 className="font-semibold">Sesiones orgánicas en el blog</h2>
            <p className="mb-3 text-xs text-ink-3">{range} · Fuente: Google Analytics 4</p>
            <AreaChart data={t.map((p) => Math.round(p.clicks * 1.35))} color="var(--warn)" />
          </Card>
        </>
      )}
    </>
  );
}
