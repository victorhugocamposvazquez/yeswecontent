import Link from "next/link";
import { ArrowRight, CircleCheck, Circle } from "lucide-react";
import { AreaChart, Bars, ScoreRing } from "@/components/charts";
import { ArticleStatusBadge, ContentStatusBadge } from "@/components/panel/status";
import { ButtonLink, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { getCurrentSite, getLatestAudit, getProfile, getVisibility, listArticles, listContentItems } from "@/lib/data";
import { getAnalytics, listIntegrations } from "@/lib/panel/data";
import { overallShare, shareByModel } from "@/lib/panel/visibility";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Resumen" };

export default async function OverviewPage() {
  const site = (await getCurrentSite())!;
  const [profile, items, articles, vis, audit, analytics, integrations] = await Promise.all([
    getProfile(),
    listContentItems(site.id),
    listArticles(site.id),
    getVisibility(site.id),
    getLatestAudit(site.id),
    getAnalytics(),
    listIntegrations(site.id),
  ]);

  const last30 = analytics.traffic.slice(-30);
  const prev30 = analytics.traffic.slice(-60, -30);
  const sum = (arr: typeof last30, k: "clicks" | "impressions" | "ai_visits") => arr.reduce((a, p) => a + p[k], 0);
  const pct = (a: number, b: number) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}% vs. 30 días anteriores` : undefined);
  const published = articles.filter((a) => a.status === "published");
  const upcoming = items
    .filter((i) => ["scheduled", "review", "writing", "planned"].includes(i.status) && i.scheduled_for)
    .sort((a, b) => a.scheduled_for!.localeCompare(b.scheduled_for!))
    .slice(0, 5);
  const share = overallShare(vis.checks);
  const byModel = shareByModel(vis.checks);
  const toReview = articles.filter((a) => a.status === "review");
  const has = (p: string) => integrations.some((i) => i.provider === p);
  const hasCms = ["wordpress", "shopify", "webflow", "ghost", "webhook"].some(has);
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const todos = [
    { done: hasCms, label: "Conecta tu CMS para publicar solo", href: "/panel/ajustes/publicacion" },
    { done: has("gsc"), label: "Conecta Google Search Console", href: "/panel/ajustes/analitica" },
    { done: !!site.brand_voice?.tone, label: "Define tu voz de marca", href: "/panel/ajustes/escritura" },
    { done: vis.prompts.length >= 5, label: "Sigue al menos 5 preguntas en IA", href: "/panel/visibilidad-ia" },
    { done: toReview.length === 0, label: toReview.length ? `Revisa ${toReview.length} artículo(s) pendientes` : "Sin artículos pendientes de revisar", href: "/panel/articulos?estado=review" },
    { done: !audit?.results.some((r) => r.status === "fail"), label: "Corrige los fallos críticos de la auditoría", href: "/panel/auditoria" },
  ];

  return (
    <>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Resumen"}
        intro={
          <>
            Así va <strong className="text-ink">{site.name}</strong> este mes. Lo importante, de un vistazo.
          </>
        }
        actions={
          <>
            <ButtonLink href="/panel/plan" variant="outline">
              Ver plan
            </ButtonLink>
            <ButtonLink href="/panel/articulos">Revisar artículos</ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Clics en Google (30 d)" value={analytics.connected ? num(sum(last30, "clicks")) : "—"} delta={pct(sum(last30, "clicks"), sum(prev30, "clicks"))} />
        <Stat label="Visitas desde IA (30 d)" value={analytics.connected ? num(sum(last30, "ai_visits")) : "—"} delta={pct(sum(last30, "ai_visits"), sum(prev30, "ai_visits"))} />
        <Stat label="Artículos publicados" value={published.length} delta={`${articles.filter((a) => a.status === "scheduled").length} programados`} />
        <Stat label="Cuota de voz en IA" value={`${share}%`} delta={`${vis.prompts.length} preguntas seguidas`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Tráfico orgánico</h2>
              <p className="text-sm text-ink-3">Clics diarios desde Google, últimos 90 días</p>
            </div>
            <Link href="/panel/analitica" className="text-sm font-medium text-signal hover:underline">
              Analítica
            </Link>
          </div>
          {analytics.connected ? (
            <>
              <AreaChart data={analytics.traffic.map((p) => p.clicks)} className="h-48" />
              <div className="mt-2 flex justify-between text-xs text-ink-3">
                <span>{fmtDate(analytics.traffic[0].date)}</span>
                <span>{fmtDate(analytics.traffic[analytics.traffic.length - 1].date)}</span>
              </div>
            </>
          ) : (
            <EmptyState title="Aún sin datos">
              Conecta Search Console en <Link className="underline" href="/panel/ajustes/analitica">Ajustes › Analítica</Link> para ver tu tráfico.
            </EmptyState>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Pendiente</h2>
          <p className="mb-4 text-sm text-ink-3">{todos.filter((t) => t.done).length} de {todos.length} completados</p>
          <ul className="space-y-2.5">
            {todos.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="group flex items-start gap-2.5 text-sm">
                  {t.done ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="Hecho" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-label="Pendiente" />}
                  <span className={t.done ? "text-ink-3 line-through" : "group-hover:underline"}>{t.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Próximos artículos</h2>
            <Link href="/panel/plan" className="inline-flex items-center gap-1 text-sm font-medium text-signal hover:underline">
              Calendario <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map((i) => {
                const art = articles.find((a) => a.content_item_id === i.id);
                return (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="w-14 shrink-0 rounded-lg bg-paper-2 py-1 text-center text-xs font-semibold uppercase">{fmtDate(i.scheduled_for!)}</span>
                    <span className="min-w-0 flex-1 text-sm">
                      {art ? (
                        <Link href={`/panel/articulos/${art.id}`} className="font-medium hover:underline">
                          {i.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{i.title}</span>
                      )}
                      <span className="block text-xs text-ink-3">{i.keyword}</span>
                    </span>
                    {art ? <ArticleStatusBadge status={art.status} /> : <ContentStatusBadge status={i.status} />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink-3">No hay nada programado. Genera el plan del mes que viene desde el calendario.</p>
          )}
        </Card>

        <div className="grid gap-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Visibilidad en IA</h2>
              <Link href="/panel/visibilidad-ia" className="text-sm font-medium text-signal hover:underline">
                Detalle
              </Link>
            </div>
            <Bars data={byModel.map((m) => ({ label: m.label, value: m.share }))} />
            <p className="mt-3 text-xs text-ink-3">% de preguntas en las que te mencionan</p>
          </Card>
          <Card className="flex items-center gap-5 p-6">
            {audit?.score != null ? <ScoreRing score={audit.score} size={84} /> : null}
            <div>
              <h2 className="font-semibold">Salud técnica</h2>
              <p className="text-sm text-ink-3">
                {audit ? `${audit.results.filter((r) => r.status !== "pass").length} aspectos por mejorar` : "Sin auditoría todavía"}
              </p>
              <Link href="/panel/auditoria" className="mt-1 inline-block text-sm font-medium text-signal hover:underline">
                Ver auditoría
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
