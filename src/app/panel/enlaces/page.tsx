import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { LinkTabs } from "@/components/panel/tabs";
import { Toggle } from "@/components/panel/toggle";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Stat, Textarea } from "@/components/ui";
import { getCurrentSite, getSubscription, listPlans } from "@/lib/data";
import { getCreditSummary } from "@/lib/links";
import { listBacklinks } from "@/lib/panel/data";
import type { BacklinkLink, CreditEntry } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { saveBacklinkPrefs } from "../actions";

export const metadata = { title: "Enlaces" };

const STATUS: Record<BacklinkLink["status"], { label: string; tone: "ok" | "warn" | "bad" | "neutral" }> = {
  live: { label: "Activo", tone: "ok" },
  pending: { label: "Pendiente", tone: "warn" },
  rejected: { label: "Rechazado", tone: "bad" },
  removed: { label: "Retirado", tone: "neutral" },
};

const REASON: Record<CreditEntry["reason"], string> = {
  welcome: "Bienvenida",
  earned: "Enlace dado",
  spent: "Enlace recibido",
  refund: "Devolución",
  adjustment: "Ajuste",
};

const short = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** Artículo donde está (o estará) el enlace. */
function SourceArticle({ l, className }: { l: BacklinkLink; className?: string }) {
  const title = l.source_article_title ?? (l.source_article_url ? short(l.source_article_url) : null);
  if (!title) return <p className={cn("text-xs text-ink-3", className)}>Artículo de origen pendiente de publicar</p>;
  const label = l.direction === "given" ? "En tu artículo" : "En su artículo";
  return (
    <p className={cn("flex min-w-0 items-center gap-1.5 text-xs text-ink-2", className)}>
      <FileText className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />
      <span className="shrink-0 text-ink-3">{label}:</span>
      {l.source_article_url ? (
        <a href={l.source_article_url} target="_blank" rel="noreferrer" className="truncate underline decoration-line underline-offset-2 hover:text-ink">
          {title}
        </a>
      ) : l.source_article_id ? (
        <Link href={`/panel/articulos/${l.source_article_id}`} className="truncate underline decoration-line underline-offset-2 hover:text-ink">
          {title}
        </Link>
      ) : (
        <span className="truncate">{title}</span>
      )}
      {!l.source_article_url && <span className="shrink-0 text-ink-3">(sin publicar)</span>}
    </p>
  );
}

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "recibidos" } = await searchParams;
  const site = (await getCurrentSite())!;
  const [links, sub, plans] = await Promise.all([listBacklinks(site.id), getSubscription(site.id), listPlans()]);
  const cap = plans.find((p) => p.id === sub?.plan_id)?.backlink_credits ?? 0;
  const credits = await getCreditSummary(site.id, cap, links);
  const received = links.filter((l) => l.direction === "received");
  const given = links.filter((l) => l.direction === "given");
  const live = received.filter((l) => l.status === "live");
  const avgDr = live.length ? Math.round(live.reduce((a, l) => a + (l.domain_rating ?? 0), 0) / live.length) : 0;
  const prefs = site.seo_settings?.backlinks;
  const rows = tab === "dados" ? given : received;
  const left = Math.max(0, cap - credits.received_this_month);

  return (
    <>
      <PageHeader title="Red de enlaces" intro="Intercambiamos enlaces contextuales entre webs de la red, dentro de artículos relacionados y nunca de forma recíproca directa." />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Enlaces recibidos activos" value={live.length} />
        <Stat label="DR medio de quien te enlaza" value={avgDr} />
        <Stat label="Enlaces que has dado" value={given.length} />
        <Stat label="Créditos disponibles" value={credits.balance} delta={`${credits.received_this_month}/${cap} recibidos este mes`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <LinkTabs
            basePath="/panel/enlaces"
            current={tab}
            tabs={[
              { id: "recibidos", label: "Recibidos", count: received.length },
              { id: "dados", label: "Dados", count: given.length },
              { id: "creditos", label: "Créditos", count: credits.balance },
            ]}
          />

          {tab === "creditos" ? (
            <>
              <Card className="mb-4 p-4 sm:p-5">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">{credits.balance}</p>
                    <p className="text-xs text-ink-3">Saldo</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-ok">+{credits.earned}</p>
                    <p className="text-xs text-ink-3">Ganados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">−{credits.spent}</p>
                    <p className="text-xs text-ink-3">Gastados</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-ink-2">
                    <span>Cupo del mes</span>
                    <span className="tabular-nums">
                      {credits.received_this_month} de {cap}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${cap ? Math.min(100, (credits.received_this_month / cap) * 100) : 0}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-sm text-ink-2">
                  Ganas 1 crédito por cada enlace que tus artículos dan a otra web de la red y gastas 1 por cada enlace que recibes. Tu plan permite recibir hasta {cap} enlaces al mes
                  {left ? ` (te quedan ${left})` : " y este mes ya has llegado al tope"}. Si un enlace se rechaza o se retira, el crédito se devuelve.
                </p>
              </Card>
              {credits.ledger.length ? (
                <Card className="divide-y divide-line">
                  {credits.ledger.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={cn("grid h-9 w-11 shrink-0 place-items-center rounded-lg text-sm font-semibold tabular-nums", r.delta > 0 ? "bg-ok/10 text-ok" : r.delta < 0 ? "bg-paper-2 text-ink" : "bg-paper-2 text-ink-3")}>
                        {r.delta > 0 ? `+${r.delta}` : r.delta < 0 ? `−${Math.abs(r.delta)}` : "0"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{REASON[r.reason]}</p>
                        {r.note && <p className="truncate text-xs text-ink-3">{r.note}</p>}
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-xs text-ink-3">{fmtDate(r.created_at)}</span>
                    </div>
                  ))}
                </Card>
              ) : (
                <EmptyState title="Sin movimientos">Cuando des o recibas tu primer enlace aparecerá aquí.</EmptyState>
              )}
            </>
          ) : (
            <>
              {rows.length > 0 && (
                <ul className="space-y-3 md:hidden">
                  {rows.map((l) => (
                    <li key={l.id}>
                      <Card className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{l.partner_domain}</p>
                            <p className="truncate text-xs text-ink-3">→ {short(l.target_url)}</p>
                          </div>
                          <Badge tone={STATUS[l.status].tone} className="shrink-0">
                            {STATUS[l.status].label}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-ink-2">“{l.anchor}”</p>
                        <SourceArticle l={l} className="mt-2" />
                        <div className="mt-2 flex gap-4 text-xs text-ink-3">
                          <span>
                            DR <span className="font-semibold tabular-nums text-ink">{l.domain_rating ?? "—"}</span>
                          </span>
                          <span>{fmtDate(l.created_at)}</span>
                          {l.source_article_url && (
                            <a href={l.source_article_url} target="_blank" rel="noreferrer" className="-my-2 ml-auto inline-grid h-9 w-9 place-items-center text-ink-3 hover:text-ink" aria-label="Ver artículo con el enlace">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
              {rows.length ? (
                <Card className="scroll-x max-md:hidden">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                      <tr>
                        <th className="px-4 py-3 font-medium">{tab === "dados" ? "Hacia" : "Desde"}</th>
                        <th className="px-4 py-3 font-medium">Anchor y artículo</th>
                        <th className="px-4 py-3 text-right font-medium">DR</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rows.map((l) => (
                        <tr key={l.id}>
                          <td className="max-w-52 px-4 py-3">
                            <span className="font-medium">{l.partner_domain}</span>
                            <span className="block truncate text-xs text-ink-3">→ {short(l.target_url)}</span>
                          </td>
                          <td className="max-w-80 px-4 py-3">
                            <span className="text-ink-2">“{l.anchor}”</span>
                            <SourceArticle l={l} className="mt-1" />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{l.domain_rating ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-ink-2">{fmtDate(l.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ) : (
                <EmptyState title="Sin enlaces todavía">En cuanto actives la red y publiques artículos, empezarán a llegar.</EmptyState>
              )}
            </>
          )}
        </div>

        <Card className="h-fit p-6">
          <h2 className="font-semibold">Preferencias</h2>
          <p className="mb-4 text-sm text-ink-3">Controla cómo participas en la red.</p>
          <ActionForm action={saveBacklinkPrefs}>
            <Toggle name="opt_in" defaultChecked={prefs?.opt_in ?? true} label="Participar en la red" hint="Recibes enlaces y, a cambio, tus artículos enlazan a webs afines." />
            <Field label="Anchors preferidos" hint="Separados por comas. Los usaremos como guía, no de forma literal.">
              <Textarea name="anchors" rows={3} defaultValue={prefs?.anchors ?? "vajilla artesanal, cerámica hecha a mano, taller de cerámica"} />
            </Field>
            <Field label="DR mínimo de quien te enlaza">
              <Input name="min_dr" type="number" min={0} max={100} defaultValue={prefs?.min_dr ?? 20} />
            </Field>
            <Field label="Dominios que no quieres" hint="Separados por comas">
              <Input name="exclude" defaultValue={prefs?.exclude?.join(", ") ?? ""} placeholder="competidor.com" />
            </Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
