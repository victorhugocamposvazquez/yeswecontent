import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, CircleCheck, Circle, FileText, Sparkles, TrendingUp } from "lucide-react";
import { AreaChart, Progress, ScoreRing, Sparkline } from "@/components/charts";
import { ModelLogo } from "@/components/panel/model-logo";
import { ArticleStatusBadge, ContentStatusBadge } from "@/components/panel/status";
import { Badge, ButtonLink, Card, CardHeader, EmptyState, Stat } from "@/components/ui";
import { getCurrentSite, getLatestAudit, getProfile, getVisibility, listArticles, listContentItems } from "@/lib/data";
import { getAnalytics, listIntegrations } from "@/lib/panel/data";
import { overallShare, shareByModel } from "@/lib/panel/visibility";
import { cn, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Resumen" };

export default async function OverviewPage() {
  const site = (await getCurrentSite())!;
  const [profile, items, articles, vis, audit, analytics, integrations] = await Promise.all([
    getProfile(),
    listContentItems(site.id),
    listArticles(site.id),
    getVisibility(site.id),
    getLatestAudit(site.id),
    getAnalytics(site.id),
    listIntegrations(site.id),
  ]);

  const last30 = analytics.traffic.slice(-30);
  const prev30 = analytics.traffic.slice(-60, -30);
  const sum = (arr: typeof last30, k: "clicks" | "impressions" | "ai_visits") => arr.reduce((a, p) => a + p[k], 0);
  const pctNum = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
  const pct = (a: number, b: number) => {
    const p = pctNum(a, b);
    return p == null ? undefined : `${p >= 0 ? "+" : ""}${p}%`;
  };
  const trend = (a: number, b: number): "up" | "down" | "flat" => {
    const p = pctNum(a, b);
    return p == null || p === 0 ? "flat" : p > 0 ? "up" : "down";
  };
  // Serie semanal (últimas 8 semanas) para las sparklines.
  const weekly = (k: "clicks" | "ai_visits") => {
    const out: number[] = [];
    for (let i = 8; i >= 1; i--) out.push(sum(analytics.traffic.slice(-7 * i, i === 1 ? undefined : -7 * (i - 1)), k));
    return out;
  };
  const published = articles.filter((a) => a.status === "published");
  const scheduled = articles.filter((a) => a.status === "scheduled");
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
  const today = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const todos = [
    { done: hasCms, label: "Conecta tu CMS para publicar solo", href: "/panel/ajustes/publicacion" },
    { done: has("google") || has("gsc"), label: "Conecta Google Search Console", href: "/panel/ajustes/analitica" },
    { done: !!site.brand_voice?.tone, label: "Define tu voz de marca", href: "/panel/ajustes/escritura" },
    { done: vis.prompts.length >= 5, label: "Sigue al menos 5 preguntas en IA", href: "/panel/visibilidad-ia" },
    { done: toReview.length === 0, label: toReview.length ? `Revisa ${toReview.length} artículo(s) pendientes` : "Sin artículos pendientes de revisar", href: "/panel/articulos?estado=review" },
    { done: !audit?.results.some((r) => r.status === "fail"), label: "Corrige los fallos críticos de la auditoría", href: "/panel/auditoria" },
  ];
  const doneCount = todos.filter((t) => t.done).length;
  const audits = audit ? { fail: audit.results.filter((r) => r.status === "fail").length, warn: audit.results.filter((r) => r.status === "warn").length } : null;
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const chartLabels = analytics.traffic.length
    ? [0, 0.25, 0.5, 0.75, 1].map((f) => {
        const d = new Date(analytics.traffic[Math.round(f * (analytics.traffic.length - 1))].date);
        return `${d.getDate()} ${months[d.getMonth()]}`;
      })
    : undefined;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-3 first-letter:uppercase">{today}</p>
          <h1 className="mt-0.5 text-[1.65rem] font-semibold tracking-tight md:text-[1.9rem]">{firstName ? `Hola, ${firstName}` : "Resumen"}</h1>
          <p className="mt-1 text-sm text-ink-2">
            Así va <Badge tone="neutral" className="align-middle">{site.name}</Badge> este mes. Lo importante, de un vistazo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/panel/plan" variant="outline" size="sm">
            <CalendarDays className="h-4 w-4" aria-hidden /> Ver plan
          </ButtonLink>
          <ButtonLink href="/panel/articulos" size="sm">
            Revisar artículos <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat
          label="Clics en Google · 30 d"
          value={analytics.connected ? num(sum(last30, "clicks")) : "—"}
          delta={analytics.connected ? pct(sum(last30, "clicks"), sum(prev30, "clicks")) : undefined}
          trend={trend(sum(last30, "clicks"), sum(prev30, "clicks"))}
          hint="vs. 30 días anteriores"
          icon={analytics.connected ? <Sparkline data={weekly("clicks")} className="hidden h-7 w-20 md:block" /> : <TrendingUp className="h-4 w-4" />}
        />
        <Stat
          label="Visitas desde IA · 30 d"
          value={analytics.connected ? num(sum(last30, "ai_visits")) : "—"}
          delta={analytics.connected ? pct(sum(last30, "ai_visits"), sum(prev30, "ai_visits")) : undefined}
          trend={trend(sum(last30, "ai_visits"), sum(prev30, "ai_visits"))}
          hint="vs. 30 días anteriores"
          icon={analytics.connected ? <Sparkline data={weekly("ai_visits")} color="var(--ok)" className="hidden h-7 w-20 md:block" /> : <Sparkles className="h-4 w-4" />}
        />
        <Stat label="Artículos publicados" value={published.length} delta={`${scheduled.length} programados`} trend="flat" icon={<FileText className="h-4 w-4" />} />
        <Stat label="Cuota de voz en IA" value={`${share}%`} delta={`${vis.prompts.length} preguntas`} trend="flat" hint="seguidas" icon={<Sparkles className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Tráfico orgánico"
            intro="Clics diarios desde Google, últimos 90 días"
            action={
              <Link href="/panel/analitica" className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-signal transition-colors hover:bg-signal-soft">
                Analítica <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          <div className="p-5">
            {analytics.connected ? (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink-2">
                    <span className="h-2 w-2 rounded-full bg-signal" aria-hidden /> Clics
                    <span className="tabular text-ink-3">{num(sum(last30, "clicks"))}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink-2">
                    <span className="h-2 w-2 rounded-full bg-ink-3" aria-hidden /> Impresiones
                    <span className="tabular text-ink-3">{num(sum(last30, "impressions"))}</span>
                  </span>
                  <span className="ml-auto text-xs text-ink-3">
                    {fmtDate(analytics.traffic[0].date)} – {fmtDate(analytics.traffic[analytics.traffic.length - 1].date)}
                  </span>
                </div>
                <AreaChart data={analytics.traffic.map((p) => p.clicks)} labels={chartLabels} height={200} className="h-48 md:h-52" />
              </>
            ) : (
              <EmptyState title="Aún sin datos" icon={<TrendingUp className="h-5 w-5" />}>
                Conecta Search Console en{" "}
                <Link className="font-medium text-signal underline" href="/panel/ajustes/analitica">
                  Ajustes › Analítica
                </Link>{" "}
                para ver tu tráfico.
              </EmptyState>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Pendiente" intro={`${doneCount} de ${todos.length} completados`} />
          <div className="p-5">
            <Progress value={(doneCount / todos.length) * 100} tone={doneCount === todos.length ? "ok" : "signal"} />
            <ul className="mt-4 space-y-1">
              {todos.map((t) => (
                <li key={t.label}>
                  <Link href={t.href} className="group -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-paper-2">
                    {t.done ? <CircleCheck className="mt-px h-4 w-4 shrink-0 text-ok" aria-label="Hecho" /> : <Circle className="mt-px h-4 w-4 shrink-0 text-line-2 group-hover:text-signal" aria-label="Pendiente" />}
                    <span className={cn("leading-snug", t.done ? "text-ink-3 line-through decoration-line-2" : "text-ink")}>{t.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Próximos artículos"
            intro="Lo que saldrá en las próximas semanas"
            action={
              <Link href="/panel/plan" className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-signal transition-colors hover:bg-signal-soft">
                Calendario <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            }
          />
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map((i) => {
                const art = articles.find((a) => a.content_item_id === i.id);
                const d = new Date(i.scheduled_for!);
                return (
                  <li key={i.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-2">
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-line bg-card py-1 leading-none shadow-[var(--shadow-xs)]" aria-label={fmtDate(i.scheduled_for!)}>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-signal">{months[d.getMonth()]}</span>
                      <span className="tabular mt-0.5 text-[15px] font-semibold">{d.getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      {art ? (
                        <Link href={`/panel/articulos/${art.id}`} className="block truncate text-[13px] font-medium hover:underline">
                          {i.title}
                        </Link>
                      ) : (
                        <span className="block truncate text-[13px] font-medium">{i.title}</span>
                      )}
                      <span className="block truncate text-xs text-ink-3">{i.keyword}</span>
                    </span>
                    {art ? <ArticleStatusBadge status={art.status} /> : <ContentStatusBadge status={i.status} />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState title="Nada programado" icon={<CalendarDays className="h-5 w-5" />} action={<ButtonLink href="/panel/plan" size="sm" variant="outline">Ir al calendario</ButtonLink>}>
                Genera el plan del mes que viene desde el calendario.
              </EmptyState>
            </div>
          )}
        </Card>

        <div className="grid gap-4 lg:gap-5">
          <Card>
            <CardHeader
              title="Visibilidad en IA"
              intro="% de preguntas en las que te mencionan"
              action={
                <Link href="/panel/visibilidad-ia" className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-medium text-signal transition-colors hover:bg-signal-soft">
                  Detalle
                </Link>
              }
            />
            <ul className="space-y-3 p-5">
              {byModel.map((m) => (
                <li key={m.model} className="grid grid-cols-[auto_minmax(4.5rem,6rem)_minmax(0,1fr)_2.5rem] items-center gap-2.5 text-[13px]">
                  <ModelLogo model={m.model} size={18} />
                  <span className="truncate text-ink-2">{m.label}</span>
                  <span className="h-1.5 min-w-0 overflow-hidden rounded-full bg-paper-3">
                    <span className="block h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${m.share}%` }} />
                  </span>
                  <span className="tabular text-right font-medium">{m.share}%</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex items-center gap-4 p-5">
            {audit?.score != null ? <ScoreRing score={audit.score} size={84} label="/ 100" /> : <span className="grid h-[84px] w-[84px] place-items-center rounded-full bg-paper-2 text-ink-3">—</span>}
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-tight">Salud técnica</h2>
              <p className="mt-0.5 text-[13px] text-ink-3">{audits ? `${audits.fail} fallos · ${audits.warn} mejoras` : "Sin auditoría todavía"}</p>
              <Link href="/panel/auditoria" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-signal hover:underline">
                Ver auditoría <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
