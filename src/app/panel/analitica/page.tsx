import Link from "next/link";
import { AreaChart, Bars } from "@/components/charts";
import { LinkTabs } from "@/components/panel/tabs";
import { ButtonLink, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
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
    return b ? `${sum(last, k) >= b ? "+" : ""}${Math.round(((sum(last, k) - b) / b) * 100)}% vs. mes anterior` : undefined;
  };
  const range = t.length ? `${fmtDate(t[0].date)} – ${fmtDate(t[t.length - 1].date)}` : "";

  return (
    <>
      <PageHeader title="Analítica" intro="Lo que tu contenido consigue en Google y en los asistentes de IA." />
      <LinkTabs basePath="/panel/analitica" current={tab} tabs={TABS} />

      {!a.google.connected ? (
        <EmptyState title="Conecta Google">
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
            <Stat label="Clics (30 d)" value={num(sum(last, "clicks"))} delta={delta("clicks")} />
            <Stat label="Impresiones (30 d)" value={num(sum(last, "impressions"))} delta={delta("impressions")} />
            <Stat label="CTR medio" value={`${((sum(last, "clicks") / Math.max(sum(last, "impressions"), 1)) * 100).toFixed(1)}%`} />
            <Stat label="Posición media" value={(a.topQueries.reduce((x, q) => x + q.position, 0) / Math.max(a.topQueries.length, 1)).toFixed(1)} />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          <Card className="scroll-x mt-6">
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
                    <td className="px-5 py-3 text-right tabular-nums">{((q.clicks / Math.max(q.impressions, 1)) * 100).toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right tabular-nums">{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {a.topPages.length > 0 && (
            <Card className="scroll-x mt-6">
              <h2 className="px-5 pt-5 font-semibold">Páginas principales</h2>
              <p className="px-5 text-xs text-ink-3">Últimos 28 días</p>
              <table className="mt-3 w-full min-w-[520px] text-sm">
                <thead className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-3">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Página</th>
                    <th className="px-5 py-2.5 text-right font-medium">Clics</th>
                    <th className="px-5 py-2.5 text-right font-medium">Impresiones</th>
                    <th className="px-5 py-2.5 text-right font-medium">Posición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {a.topPages.map((pg) => (
                    <tr key={pg.page}>
                      <td className="max-w-[320px] truncate px-5 py-3 font-medium">
                        <a href={pg.page} target="_blank" rel="noreferrer" className="hover:underline">
                          {pg.page.replace(/^https?:\/\/[^/]+/, "") || "/"}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{num(pg.clicks)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{num(pg.impressions)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{pg.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      ) : tab === "ia" ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            <Stat label="Visitas desde IA (30 d)" value={num(sum(last, "ai_visits"))} delta={delta("ai_visits")} />
            <Stat label="Fuente principal" value={a.aiReferrers[0]?.source ?? "—"} />
            <Stat label="% del tráfico orgánico" value={`${((sum(last, "ai_visits") / Math.max(sum(last, "clicks"), 1)) * 100).toFixed(1)}%`} className="col-span-2 lg:col-span-1" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            <Stat label="Sesiones (30 d)" value={num(sum(last, "sessions"))} delta={delta("sessions")} />
            <Stat label="Sesiones desde IA (30 d)" value={num(sum(last, "ai_visits"))} delta={delta("ai_visits")} />
            <Stat label="% de sesiones desde IA" value={`${((sum(last, "ai_visits") / Math.max(sum(last, "sessions"), 1)) * 100).toFixed(1)}%`} className="col-span-2 lg:col-span-1" />
          </div>
          <Card className="mt-6 p-6">
            <h2 className="font-semibold">Sesiones diarias</h2>
            <p className="mb-3 text-xs text-ink-3">{range} · Fuente: Google Analytics 4</p>
            <AreaChart data={t.map((p) => p.sessions ?? 0)} color="var(--warn)" />
          </Card>
        </>
      )}
    </>
  );
}
