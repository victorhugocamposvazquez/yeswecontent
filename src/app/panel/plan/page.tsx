import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, WandSparkles } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { CellText, DataTable, TableCount } from "@/components/panel/data-table";
import { ContentStatusBadge, INTENT_LABEL, contentStatusLabel } from "@/components/panel/status";
import { LinkTabs } from "@/components/panel/tabs";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Select } from "@/components/ui";
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
  const articleByItem = new Map(articles.map((a) => [a.content_item_id ?? "", a.id]));

  const now = new Date();
  const [y, m] = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes!.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const ym = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const prevMonth = ym(new Date(Date.UTC(y, m - 2, 1)));
  const nextMonth = ym(new Date(Date.UTC(y, m, 1)));
  const thisMonth = ym(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStart);
  const extra = { cluster: sp.cluster, estado: sp.estado, mes: sp.mes };
  const monthCount = filtered.filter((i) => i.scheduled_for?.startsWith(ym(monthStart))).length;

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
        <form className="mb-4 grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap" action="/panel/plan">
          <input type="hidden" name="vista" value={view} />
          {sp.mes && <input type="hidden" name="mes" value={sp.mes} />}
          <div className="min-w-0 sm:w-44">
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
          <div className="min-w-0 sm:w-44">
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
          <Button type="submit" variant="outline" className="max-sm:col-span-2 max-sm:min-h-11">
            Filtrar
          </Button>
          {(sp.cluster || sp.estado) && (
            <Link href={`/panel/plan?vista=${view}`} className="inline-flex min-h-11 items-center justify-center text-[13px] text-ink-3 underline underline-offset-2 hover:text-ink max-sm:col-span-2 sm:min-h-0 sm:pb-2.5">
              Quitar filtros
            </Link>
          )}
        </form>
      )}

      {view === "calendario" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5 md:px-4">
            <div className="flex items-center gap-1">
              <Link href={`/panel/plan?${new URLSearchParams({ ...clean(extra), vista: view, mes: prevMonth })}`} className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-paper-2 max-md:h-11 max-md:w-11" aria-label="Mes anterior">
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link href={`/panel/plan?${new URLSearchParams({ ...clean(extra), vista: view, mes: nextMonth })}`} className="grid h-9 w-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-paper-2 max-md:h-11 max-md:w-11" aria-label="Mes siguiente">
                <ChevronRight className="h-4 w-4" />
              </Link>
              {ym(monthStart) !== thisMonth && (
                <Link href={`/panel/plan?${new URLSearchParams({ ...clean(extra), vista: view })}`} className="ml-1 hidden h-8 items-center rounded-lg border border-line px-2.5 text-xs font-medium text-ink-2 transition-colors hover:bg-paper-2 sm:inline-flex">
                  Hoy
                </Link>
              )}
            </div>
            <h2 className="text-[15px] font-semibold tracking-tight first-letter:uppercase">{monthLabel}</h2>
            <span className="tabular text-xs text-ink-3">{monthCount} temas</span>
          </div>
          <Calendar monthStart={monthStart} items={filtered} articleByItem={articleByItem} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line bg-paper-2/60 px-4 py-2 text-[11px] text-ink-3">
            {STATUSES.filter((s) => s !== "skipped").map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", DOT[s])} aria-hidden /> {contentStatusLabel(s)}
              </span>
            ))}
          </div>
        </Card>
      )}

      {view === "lista" && filtered.length > 0 && (
        <ul className="space-y-3 md:hidden">
          {filtered.map((i) => {
            const artId = articleByItem.get(i.id);
            return (
              <li key={i.id}>
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
                    <span className="font-medium uppercase tracking-wide">{i.scheduled_for ? fmtDate(i.scheduled_for) : "—"}</span>
                    <ContentStatusBadge status={i.status} />
                  </div>
                  {artId ? (
                    <Link href={`/panel/articulos/${artId}`} className="mt-2 block font-medium leading-snug hover:underline">
                      {i.title}
                    </Link>
                  ) : (
                    <p className="mt-2 font-medium leading-snug">{i.title}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-3">
                    {i.keyword}
                    {i.intent && ` · ${INTENT_LABEL[i.intent]}`}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
                    {i.cluster && <Badge>{i.cluster}</Badge>}
                    <span>
                      Volumen <span className="tabular font-semibold">{i.search_volume != null ? num(i.search_volume) : "—"}</span>
                    </span>
                    <span>
                      Dific. <span className="tabular font-semibold">{i.difficulty ?? "—"}</span>
                    </span>
                  </div>
                  {i.status === "planned" && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                      <ActionForm action={writeNow} submitLabel="Escribir ya" pendingLabel="Escribiendo…" variant="outline" inline>
                        <input type="hidden" name="id" value={i.id} />
                      </ActionForm>
                      <ActionForm action={setContentStatus} submitLabel="Descartar" variant="ghost" inline>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="status" value="skipped" />
                      </ActionForm>
                    </div>
                  )}
                  {i.status === "skipped" && (
                    <div className="mt-3 border-t border-line pt-3">
                      <ActionForm action={setContentStatus} submitLabel="Recuperar" variant="ghost" inline>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="status" value="planned" />
                      </ActionForm>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {view === "lista" && (
        <DataTable<ContentItem>
          rows={filtered}
          rowKey={(i) => i.id}
          minWidth={820}
          caption="Temas del plan"
          empty={
            <EmptyState title="Nada por aquí" icon={<CalendarDays className="h-5 w-5" />}>
              Prueba con otros filtros o genera el plan del mes que viene.
            </EmptyState>
          }
          columns={[
            { key: "date", header: "Fecha", className: "whitespace-nowrap", cell: (i) => <span className="text-ink-2">{i.scheduled_for ? fmtDate(i.scheduled_for) : "—"}</span> },
            {
              key: "topic",
              header: "Tema",
              className: "max-w-[26rem]",
              cell: (i) => {
                const artId = articleByItem.get(i.id);
                return (
                  <CellText
                    primary={
                      artId ? (
                        <Link href={`/panel/articulos/${artId}`} className="hover:underline">
                          {i.title}
                        </Link>
                      ) : (
                        i.title
                      )
                    }
                    secondary={`${i.keyword}${i.intent ? ` · ${INTENT_LABEL[i.intent]}` : ""}`}
                  />
                );
              },
            },
            { key: "cluster", header: "Clúster", cell: (i) => (i.cluster ? <Badge>{i.cluster}</Badge> : null) },
            { key: "vol", header: "Volumen", numeric: true, cell: (i) => (i.search_volume != null ? num(i.search_volume) : "—") },
            { key: "dif", header: "Dific.", numeric: true, cell: (i) => i.difficulty ?? "—" },
            { key: "status", header: "Estado", cell: (i) => <ContentStatusBadge status={i.status} /> },
            {
              key: "actions",
              header: "Acciones",
              srOnly: true,
              className: "text-right",
              cell: (i) => (
                <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                  {i.status === "planned" && (
                    <>
                      <ActionForm action={writeNow} submitLabel="Escribir ya" pendingLabel="Escribiendo…" variant="outline" inline footerClassName="justify-end [&_button]:h-8 [&_button]:px-3 [&_button]:text-xs">
                        <input type="hidden" name="id" value={i.id} />
                      </ActionForm>
                      <ActionForm action={setContentStatus} submitLabel="Descartar" variant="ghost" inline footerClassName="justify-end [&_button]:h-8 [&_button]:px-3 [&_button]:text-xs">
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="status" value="skipped" />
                      </ActionForm>
                    </>
                  )}
                  {i.status === "skipped" && (
                    <ActionForm action={setContentStatus} submitLabel="Recuperar" variant="ghost" inline footerClassName="[&_button]:h-8 [&_button]:px-3 [&_button]:text-xs">
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="status" value="planned" />
                    </ActionForm>
                  )}
                </div>
              ),
            },
          ]}
          footer={<TableCount shown={filtered.length} total={items.filter((i) => i.kind === "new").length} unit="temas" />}
        />
      )}

      {view === "mejoras" && (
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader title="Artículos publicados" intro="Marca los que quieras renovar: actualizamos datos, ampliamos secciones y reforzamos la respuesta directa." />
            <ul className="divide-y divide-line">
              {articles
                .filter((a) => a.status === "published")
                .map((a, idx) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-2">
                    <div className="min-w-0 flex-1">
                      <Link href={`/panel/articulos/${a.id}`} className="text-[13px] font-medium hover:underline">
                        {a.title}
                      </Link>
                      <p className="text-xs text-ink-3">
                        Publicado el {a.published_at ? fmtDate(a.published_at, { day: "numeric", month: "long" }) : "—"}
                        {idx === 0 && (
                          <Badge tone="warn" className="ml-2 px-1.5 py-0 text-[11px]">
                            pierde posiciones (−3,2)
                          </Badge>
                        )}
                      </p>
                    </div>
                    <ActionForm action={markForRefresh} submitLabel={<><RefreshCw className="h-3.5 w-3.5" aria-hidden /> Renovar</>} variant="outline" inline footerClassName="[&_button]:h-8 [&_button]:px-3 [&_button]:text-xs">
                      <input type="hidden" name="article_id" value={a.id} />
                    </ActionForm>
                  </li>
                ))}
            </ul>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="En cola de mejora" intro="Se reescriben en el siguiente hueco libre de tu calendario." />
            <div className="p-5">
              {refreshItems.length ? (
                <ul className="space-y-2">
                  {refreshItems.map((i) => (
                    <li key={i.id} className="rounded-xl border border-line bg-paper-2/50 p-3">
                      <p className="text-[13px] font-medium">{i.title}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-3">
                        <ContentStatusBadge status={i.status} /> {i.scheduled_for && `para el ${fmtDate(i.scheduled_for)}`}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-ink-3">Todavía no hay artículos en cola.</p>
              )}
              <Link href="/panel/ajustes/mejoras" className="mt-4 inline-block text-[13px] font-medium text-signal hover:underline">
                Configurar mejoras automáticas
              </Link>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

const clean = (o: Record<string, string | undefined>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v)) as Record<string, string>;

const DOT: Record<ContentStatus, string> = {
  planned: "bg-ink-3",
  writing: "bg-signal",
  review: "bg-warn",
  scheduled: "bg-sky",
  published: "bg-ok",
  skipped: "bg-line-2",
};

const PILL: Record<ContentStatus, string> = {
  planned: "border-line bg-card text-ink-2 hover:border-line-2",
  writing: "border-signal/30 bg-signal-soft text-ink hover:border-signal/60",
  review: "border-warn/30 bg-warn-soft text-ink hover:border-warn/60",
  scheduled: "border-sky/60 bg-sky-soft text-ink hover:border-sky",
  published: "border-ok/30 bg-ok-soft text-ink hover:border-ok/60",
  skipped: "border-line bg-paper-2 text-ink-3 line-through",
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
        <div className="grid grid-cols-7 border-b border-line bg-paper-2/60 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={cn("py-2", i >= 5 && "text-ink-3/70")}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, idx) => {
            const inMonth = d >= 1 && d <= daysInMonth;
            const dayItems = inMonth ? byDay.get(iso(d)) ?? [] : [];
            const isToday = inMonth && iso(d) === todayIso;
            const last = idx >= cells.length - 7;
            return (
              <div key={idx} className={cn("min-h-28 border-r border-line p-1.5 transition-colors", !last && "border-b", !inMonth && "bg-paper-2/40", inMonth && "hover:bg-paper-2/60", isToday && "bg-signal-soft/40", idx % 7 === 6 && "border-r-0")}>
                {inMonth && (
                  <>
                    <span className={cn("tabular mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs", isToday ? "bg-signal font-semibold text-white" : "text-ink-3")}>{d}</span>
                    <ul className="space-y-1">
                      {dayItems.map((i) => {
                        const art = articleByItem.get(i.id);
                        const inner = (
                          <>
                            <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", DOT[i.status])} aria-hidden />
                            <span className="line-clamp-2 min-w-0 font-medium leading-[1.3]">{i.title}</span>
                          </>
                        );
                        const cls = cn("flex items-start gap-1.5 rounded-md border px-1.5 py-1 text-[11px] transition-colors duration-150", PILL[i.status]);
                        return (
                          <li key={i.id} title={`${i.title} · ${contentStatusLabel(i.status)}`}>
                            {art ? (
                              <Link href={`/panel/articulos/${art}`} className={cls}>
                                {inner}
                              </Link>
                            ) : (
                              <div className={cls}>{inner}</div>
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
              <span className={cn("w-12 shrink-0 rounded-lg py-1 text-center text-xs font-semibold uppercase", i.scheduled_for!.slice(0, 10) === todayIso ? "bg-signal text-white" : "bg-paper-2")}>{fmtDate(i.scheduled_for!)}</span>
              <div className="min-w-0 flex-1">
                {articleByItem.get(i.id) ? (
                  <Link href={`/panel/articulos/${articleByItem.get(i.id)}`} className="text-sm font-medium hover:underline">
                    {i.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium">{i.title}</p>
                )}
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
