import { ExternalLink } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { LinkTabs } from "@/components/panel/tabs";
import { Toggle } from "@/components/panel/toggle";
import { Badge, Card, EmptyState, Field, Input, PageHeader, Stat, Textarea } from "@/components/ui";
import { getCurrentSite, getSubscription, listPlans } from "@/lib/data";
import { listBacklinks } from "@/lib/panel/data";
import type { BacklinkLink } from "@/lib/types";
import { fmtDate } from "@/lib/utils";
import { saveBacklinkPrefs } from "../actions";

export const metadata = { title: "Enlaces" };

const STATUS: Record<BacklinkLink["status"], { label: string; tone: "ok" | "warn" | "bad" | "neutral" }> = {
  live: { label: "Activo", tone: "ok" },
  pending: { label: "Pendiente", tone: "warn" },
  rejected: { label: "Rechazado", tone: "bad" },
  removed: { label: "Retirado", tone: "neutral" },
};

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "recibidos" } = await searchParams;
  const site = (await getCurrentSite())!;
  const [links, sub, plans] = await Promise.all([listBacklinks(site.id), getSubscription(site.id), listPlans()]);
  const credits = plans.find((p) => p.id === sub?.plan_id)?.backlink_credits ?? 0;
  const received = links.filter((l) => l.direction === "received");
  const given = links.filter((l) => l.direction === "given");
  const live = received.filter((l) => l.status === "live");
  const avgDr = live.length ? Math.round(live.reduce((a, l) => a + (l.domain_rating ?? 0), 0) / live.length) : 0;
  const balance = credits - received.length + given.length;
  const prefs = (site.seo_settings as Record<string, unknown>)?.backlinks as { opt_in?: boolean; anchors?: string; min_dr?: number; exclude?: string[] } | undefined;
  const rows = tab === "dados" ? given : received;

  return (
    <>
      <PageHeader title="Red de enlaces" intro="Intercambiamos enlaces contextuales entre webs de la red, dentro de artículos relacionados y nunca de forma recíproca directa." />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Enlaces recibidos activos" value={live.length} />
        <Stat label="DR medio de quien te enlaza" value={avgDr} />
        <Stat label="Enlaces que has dado" value={given.length} />
        <Stat label="Créditos disponibles" value={balance} delta={`${credits} incluidos en tu plan`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LinkTabs basePath="/panel/enlaces" current={tab} tabs={[{ id: "recibidos", label: "Recibidos", count: received.length }, { id: "dados", label: "Dados", count: given.length }]} />
          {rows.length ? (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                  <tr>
                    <th className="px-4 py-3 font-medium">{tab === "dados" ? "Hacia" : "Desde"}</th>
                    <th className="px-4 py-3 font-medium">Anchor</th>
                    <th className="px-4 py-3 text-right font-medium">DR</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3">
                        <span className="font-medium">{l.partner_domain}</span>
                        {l.source_article_url && (
                          <a href={l.source_article_url} target="_blank" rel="noreferrer" className="ml-1.5 inline-flex align-middle text-ink-3 hover:text-ink" aria-label="Ver artículo con el enlace">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <span className="block truncate text-xs text-ink-3">→ {l.target_url.replace(/^https?:\/\//, "")}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-2">“{l.anchor}”</td>
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
