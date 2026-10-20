import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCw, WandSparkles } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { ContentStatusBadge, INTENT_LABEL, contentStatusLabel } from "@/components/panel/status";
import { LinkTabs } from "@/components/panel/tabs";
import { Badge, Button, Card, EmptyState, PageHeader, Select } from "@/components/ui";
import { getCurrentSite, getSubscription, listArticles, listContentItems, listPlans } from "@/lib/data";
import type { ContentItem, ContentStatus } from "@/lib/types";
import { cn, fmtDate, num } from "@/lib/utils";
import { generateNextMonthPlan, markForRefresh, setContentStatus, writeNow } from "../actions";

export const metadata = { title: "Plan de contenidos" };

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const STATUSES: ContentStatus[] = ["planned", "writing", "review", "scheduled", "published", "skipped"];

type SP = Promise<{ vista?: string; mes?: string; cluster?: string; estado?: string }>;

export default async function PlanPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const site = (await getCurrentSite())!;
  const [items, articles, sub, plans] = await Promise.all([listContentItems(site.id), listArticles(site.id), getSubscription(site.id), listPlans()]);
  const plan = plans.find((p) => p.id === sub?.plan_id);
  const view = ["calendario", "lista", "mejoras"].includes(sp.vista ?? "") ? sp.vista! : "calendario";

  const clusters = [...new Set(items.map((i) => i.cluster).filter((c): c is string => !!c))].sort();
  const filtered = items.filter((i) => (!sp.cluster || i.cluster === sp.cluster) && (!sp.estado || i.status === sp.estado) && i.kind === "new");
  const refreshItems = items.filter((i) => i.kind === "refresh");

  const now = new Date();
  const [y, m] = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes!.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const ym = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const prevMonth = ym(new Date(Date.UTC(y, m - 2, 1)));
  const nextMonth = ym(new Date(Date.UTC(y, m, 1)));
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStart);
  const extra = { cluster: sp.cluster, estado: sp.estado, mes: sp.mes };

  return (
    <>
      <PageHeader
        title="Plan de contenidos"
        intro="Los temas de cada mes salen de tu investigación de palabras clave. Muévelos, descártalos o escríbelos antes de tiempo."
        actions={
          <ActionForm action={generateNextMonthPlan} submitLabel={<><WandSparkles className="h-4 w-4" aria-hidden /> Generar plan del mes que viene</>} pendingLabel="Investigando temas…" inline>
            <input type="hidden" name="count" value={plan?.articles_per_month ?? 12} />
          </ActionForm>
        }
      />

      <LinkTabs
        basePath="/panel/plan"
        param="vista"
        current={view}
        extra={extra}
        tabs={[
          { id: "calendario", label: "Calendario" },
          { id: "lista", label: "Lista", count: filtered.length },
          { id: "mejoras", label: "Mejoras", count: refreshItems.length },
        ]}
      />

      {view !== "mejoras" && (
        <form className="mb-5 flex flex-wrap items-end gap-3" action="/panel/plan">
          <input type="hidden" name="vista" value={view} />
          {sp.mes && <input type="hidden" name="mes" value={sp.mes} />}
          <div className="w-44">
            <label htmlFor="f-cluster" className="mb-1 block text-xs font-medium text-ink-3">
              Clúster
            </label>
            <Select id="f-cluster" name="cluster" defaultValue={sp.cluster ?? ""}>
              <option value="">Todos</option>
              {clusters.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <label htmlFor="f-estado" className="mb-1 block text-xs font-medium text-ink-3">
              Estado
            </label>
            <Select id="f-estado" name="estado" defaultValue={sp.estado ?? ""}>
              <option value="">Todos</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {contentStatusLabel(s)}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="outline">
            Filtrar
          </Button>
          {(sp.cluster || sp.estado) && (
            <Link href={`/panel/plan?vista=${view}`} className="pb-2.5 text-sm text-ink-3 underline">
              Quitar filtros
            </Link>
          )}
        </form>
      )}

      {view === "calendario" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <Link href={`/panel/plan?${new URLSearchParams({ ...clean(extra), vista: view, mes: prevMonth })}`} className="rounded-full p-2 hover:bg-paper-2" aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h2 className="font-semibold tracking-tight text-lg capitalize">{monthLabel}</h2>
            <Link href={`/panel/plan?${new URLSearchParams({ ...clean(extra), vista: view, mes: nextMonth })}`} className="rounded-full p-2 hover:bg-paper-2" aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <Calendar monthStart={monthStart} items={filtered} articleByItem={new Map(articles.map((a) => [a.content_item_id ?? "", a.id]))} />
        </Card>
      )}

      {view === "lista" && (
        <Card className="overflow-x-auto">
          {filtered.length ? (
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Tema</th>
                  <th className="px-4 py-3 font-medium">Clúster</th>
                  <th className="px-4 py-3 text-right font-medium">Volumen</th>
                  <th className="px-4 py-3 text-right font-medium">Dific.</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((i) => {
                  const artId = articles.find((a) => a.content_item_id === i.id)?.id;
                  return (
                    <tr key={i.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-ink-2">{i.scheduled_for ? fmtDate(i.scheduled_for) : "—"}</td>
                      <td className="px-4 py-3">
                        {artId ? (
                          <Link href={`/panel/articulos/${artId}`} className="font-medium hover:underline">
                            {i.title}
                          </Link>
                        ) : (
                          <span className="font-medium">{i.title}</span>
                        )}
                        <span className="block text-xs text-ink-3">
                          {i.keyword}
                          {i.intent && ` · ${INTENT_LABEL[i.intent]}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">{i.cluster && <Badge>{i.cluster}</Badge>}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{i.search_volume != null ? num(i.search_volume) : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{i.difficulty ?? "—"}</td>
                      <td className="px-4 py-3">
                        <ContentStatusBadge status={i.status} />
                      </td>
                      <td className="px-4 py-3">
                        {i.status === "planned" && (
                          <div className="flex flex-col items-end gap-1">
                            <ActionForm action={writeNow} submitLabel="Escribir ya" pendingLabel="Escribiendo…" variant="outline" inline footerClassName="justify-end">
                              <input type="hidden" name="id" value={i.id} />
                            </ActionForm>
                            <ActionForm action={setContentStatus} submitLabel="Descartar" variant="ghost" inline footerClassName="justify-end">
                              <input type="hidden" name="id" value={i.id} />
                              <input type="hidden" name="status" value="skipped" />
                            </ActionForm>
                          </div>
                        )}
                        {i.status === "skipped" && (
                          <ActionForm action={setContentStatus} submitLabel="Recuperar" variant="ghost" inline>
                            <input type="hidden" name="id" value={i.id} />
                            <input type="hidden" name="status" value="planned" />
                          </ActionForm>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <EmptyState title="Nada por aquí">Prueba con otros filtros o genera el plan del mes que viene.</EmptyState>
            </div>
          )}
        </Card>
      )}

      {view === "mejoras" && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-6 lg:col-span-3">
            <h2 className="font-semibold">Artículos publicados</h2>
            <p className="mb-4 text-sm text-ink-3">Marca los que quieras renovar: actualizamos datos, ampliamos secciones y reforzamos la respuesta directa.</p>
            <ul className="divide-y divide-line">
              {articles
                .filter((a) => a.status === "published")
                .map((a, idx) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/panel/articulos/${a.id}`} className="text-sm font-medium hover:underline">
                        {a.title}
                      </Link>
                      <p className="text-xs text-ink-3">
                        Publicado el {a.published_at ? fmtDate(a.published_at, { day: "numeric", month: "long" }) : "—"}
                        {idx === 0 && <span className="ml-2 text-warn">· pierde posiciones (−3,2)</span>}
                      </p>
                    </div>
                    <ActionForm action={markForRefresh} submitLabel={<><RefreshCw className="h-3.5 w-3.5" aria-hidden /> Renovar</>} variant="outline" inline>
                      <input type="hidden" name="article_id" value={a.id} />
                    </ActionForm>
                  </li>
                ))}
            </ul>
          </Card>
          <Card className="p-6 lg:col-span-2">
            <h2 className="font-semibold">En cola de mejora</h2>
            <p className="mb-4 text-sm text-ink-3">Se reescriben en el siguiente hueco libre de tu calendario.</p>
            {refreshItems.length ? (
              <ul className="space-y-3">
                {refreshItems.map((i) => (
                  <li key={i.id} className="rounded-xl border border-line bg-paper p-3">
                    <p className="text-sm font-medium">{i.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-3">
                      <ContentStatusBadge status={i.status} /> {i.scheduled_for && `para el ${fmtDate(i.scheduled_for)}`}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-3">Todavía no hay artículos en cola.</p>
            )}
            <Link href="/panel/ajustes/mejoras" className="mt-4 inline-block text-sm font-medium text-signal hover:underline">
              Configurar mejoras automáticas
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}

const clean = (o: Record<string, string | undefined>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v)) as Record<string, string>;

const tone: Record<ContentStatus, string> = {
  planned: "border-line bg-paper",
  writing: "border-signal/40 bg-signal/10",
  review: "border-warn/40 bg-warn/10",
  scheduled: "border-sky bg-sky/30",
  published: "border-ok/30 bg-ok/10",
  skipped: "border-line bg-paper-2 line-through opacity-60",
};

function Calendar({ monthStart, items, articleByItem }: { monthStart: Date; items: ContentItem[]; articleByItem: Map<string, string> }) {
  const offset = (monthStart.getUTCDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => i - offset + 1);
  const todayIso = new Date().toISOString().slice(0, 10);
  const iso = (d: number) => `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const byDay = new Map<string, ContentItem[]>();
  items.forEach((i) => i.scheduled_for && byDay.set(i.scheduled_for.slice(0, 10), [...(byDay.get(i.scheduled_for.slice(0, 10)) ?? []), i]));
  const monthItems = items.filter((i) => i.scheduled_for?.startsWith(iso(1).slice(0, 7)));

  return (
    <>
      {/* Escritorio: cuadrícula */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-xs font-medium uppercase tracking-wide text-ink-3">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, idx) => {
            const inMonth = d >= 1 && d <= daysInMonth;
            const dayItems = inMonth ? byDay.get(iso(d)) ?? [] : [];
            return (
              <div key={idx} className={cn("min-h-28 border-b border-r border-line p-1.5", !inMonth && "bg-paper/60", idx % 7 === 6 && "border-r-0")}>
                {inMonth && (
                  <>
                    <span className={cn("mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs", iso(d) === todayIso ? "bg-signal font-bold text-white" : "text-ink-3")}>{d}</span>
                    <ul className="space-y-1">
                      {dayItems.map((i) => {
                        const art = articleByItem.get(i.id);
                        const inner = (
                          <>
                            <span className="line-clamp-2 font-medium">{i.title}</span>
                            <span className="text-[10px] text-ink-3">{contentStatusLabel(i.status)}</span>
                          </>
                        );
                        return (
                          <li key={i.id} className={cn("rounded-lg border px-1.5 py-1 text-[11px] leading-tight", tone[i.status])}>
                            {art ? (
                              <Link href={`/panel/articulos/${art}`} className="block hover:underline">
                                {inner}
                              </Link>
                            ) : (
                              inner
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Móvil: agenda */}
      <ul className="divide-y divide-line md:hidden">
        {monthItems.length ? (
          monthItems.map((i) => (
            <li key={i.id} className="flex items-start gap-3 px-4 py-3">
              <span className="w-12 shrink-0 rounded-lg bg-paper-2 py-1 text-center text-xs font-semibold uppercase">{fmtDate(i.scheduled_for!)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{i.title}</p>
                <div className="mt-1">
                  <ContentStatusBadge status={i.status} />
                </div>
              </div>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-center text-sm text-ink-3">Sin temas este mes.</li>
        )}
      </ul>
    </>
  );
}
