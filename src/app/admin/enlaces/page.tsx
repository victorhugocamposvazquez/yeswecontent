import { Ban, Check, X } from "lucide-react";
import { Progress } from "@/components/charts";
import { Badge, Card, CardHeader, Input, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { buildChips, DataTable, EmptyRow, FilterBar, FilterInput, FilterSelect, RowActions, SearchField, SelectAllTh, SelectTd, Sub, Td, Th, THead, Tr } from "@/components/admin/table";
import { getBannedDomains, listModerationLinks } from "@/lib/admin/data";
import { fmtDate, num } from "@/lib/utils";
import { banDomain, moderateLink, unbanDomain } from "../actions";

export const metadata = { title: "Red de enlaces" };

type SP = Promise<{ status?: string; dr?: string; q?: string }>;

const statusMeta = {
  pending: { label: "Pendiente", tone: "warn" },
  live: { label: "Publicado", tone: "ok" },
  rejected: { label: "Rechazado", tone: "bad" },
  removed: { label: "Retirado", tone: "neutral" },
} as const;

const LOW_DR = 10;

export default async function LinksPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = sp.status ?? "pending";
  const minDr = Number.parseInt(sp.dr ?? "", 10) || 0;
  const q = (sp.q ?? "").trim().toLowerCase();
  const [links, banned] = await Promise.all([listModerationLinks(), getBannedDomains()]);
  const rows = links.filter(
    (l) =>
      (status === "all" || l.status === status) &&
      (l.domain_rating ?? 0) >= minDr &&
      (!q || [l.source_domain, l.target_domain, l.anchor].some((v) => v.toLowerCase().includes(q))),
  );
  const pending = links.filter((l) => l.status === "pending").length;
  const chips = buildChips("/admin/enlaces", { q: sp.q, dr: sp.dr, status: sp.status && sp.status !== "pending" ? sp.status : undefined }, {
    q: { label: "Buscar" },
    dr: { label: "DR mínimo" },
    status: { label: "Estado", value: (v) => (v === "all" ? "Todos" : (statusMeta[v as keyof typeof statusMeta]?.label ?? v)) },
  });

  return (
    <>
      <PageHeader
        title="Red de enlaces"
        intro="Modera los intercambios entre clientes antes de que se publiquen."
        actions={
          <Badge tone={pending ? "warn" : "ok"} dot className="h-8 px-3">
            {num(pending)} pendientes
          </Badge>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <FilterBar action="/admin/enlaces" resetHref="/admin/enlaces" chips={chips}>
            <SearchField defaultValue={sp.q} placeholder="Dominio o anchor" />
            <FilterSelect label="Estado" name="status" defaultValue={status}>
              <option value="pending">Pendientes</option>
              <option value="live">Publicados</option>
              <option value="rejected">Rechazados</option>
              <option value="removed">Retirados</option>
              <option value="all">Todos</option>
            </FilterSelect>
            <FilterInput label="DR mínimo" type="number" name="dr" min={0} max={100} defaultValue={sp.dr} placeholder="DR mín." className="sm:w-24" />
          </FilterBar>

          <DataTable caption="Enlaces de la red" count={rows.length} unit="enlaces" footer={`DR por debajo de ${LOW_DR} o dominio vetado se marcan como sospechosos`} minWidth="min-w-[800px]">
            <THead>
              <SelectAllTh />
              <Th>Origen → destino</Th>
              <Th>Anchor</Th>
              <Th className="w-24">DR</Th>
              <Th>Estado</Th>
              <Th numeric>Fecha</Th>
              <Th className="text-right">Moderación</Th>
            </THead>
            <tbody>
              {rows.map((l) => {
                const isBanned = banned.includes(l.source_domain);
                const suspicious = isBanned || (l.domain_rating ?? 0) < LOW_DR;
                const m = statusMeta[l.status];
                const dr = l.domain_rating ?? 0;
                return (
                  <Tr key={l.id} tone={isBanned ? "bad" : undefined}>
                    <SelectTd label={`enlace de ${l.source_domain}`} />
                    <Td>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-medium">
                        {l.source_article_url ? (
                          <a href={l.source_article_url} target="_blank" rel="noreferrer nofollow" className="hover:underline">
                            {l.source_domain}
                          </a>
                        ) : (
                          l.source_domain
                        )}
                        <span className="text-ink-3" aria-label="enlaza a">
                          →
                        </span>
                        <span className="text-ink-2">{l.target_domain}</span>
                        {suspicious && (
                          <Badge tone="warn" dot>
                            {isBanned ? "Dominio vetado" : "DR muy bajo"}
                          </Badge>
                        )}
                      </div>
                    </Td>
                    <Td className="max-w-44">
                      <Sub className="mt-0 text-[13px] text-ink" title={l.anchor}>
                        «{l.anchor}»
                      </Sub>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Progress value={dr} tone={dr < LOW_DR ? "bad" : dr < 30 ? "warn" : "ok"} className="w-12" />
                        <span className="tabular w-6 text-right text-ink">{l.domain_rating ?? "—"}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={m.tone} dot>
                        {m.label}
                      </Badge>
                    </Td>
                    <Td numeric muted className="whitespace-nowrap">
                      {fmtDate(l.created_at)}
                    </Td>
                    <Td>
                      <ActionForm action={moderateLink} inline className="w-full">
                        <input type="hidden" name="id" value={l.id} />
                        <RowActions className="w-full gap-1.5">
                          {l.status === "pending" && (
                            <>
                              <SubmitButton size="sm" variant="ink" name="decision" value="approve" aria-label={`Aprobar enlace de ${l.source_domain}`} title="Aprobar" className="h-8 px-2.5">
                                <Check className="size-3.5" aria-hidden /> <span className="hidden 2xl:inline">Aprobar</span>
                              </SubmitButton>
                              <SubmitButton size="sm" variant="danger" name="decision" value="reject" aria-label={`Rechazar enlace de ${l.source_domain}`} title="Rechazar" className="h-8 px-2.5">
                                <X className="size-3.5" aria-hidden /> <span className="hidden 2xl:inline">Rechazar</span>
                              </SubmitButton>
                            </>
                          )}
                          {l.status === "live" && (
                            <SubmitButton size="sm" variant="ghost" name="decision" value="remove" className="h-8 px-2.5">
                              Retirar
                            </SubmitButton>
                          )}
                        </RowActions>
                      </ActionForm>
                    </Td>
                  </Tr>
                );
              })}
              {!rows.length && <EmptyRow cols={7}>Nada que moderar con estos filtros.</EmptyRow>}
            </tbody>
          </DataTable>
        </div>

        <Card className="h-fit">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Ban className="size-4 text-bad" aria-hidden /> Dominios vetados
              </span>
            }
            intro="No pueden participar en la red. Al vetar, sus enlaces pendientes se rechazan."
            className="px-4 py-3"
          />
          <div className="px-4 py-3">
            <ActionForm action={banDomain}>
              <label htmlFor="ban-domain" className="sr-only">
                Dominio a vetar
              </label>
              <div className="flex gap-2">
                <Input id="ban-domain" name="domain" placeholder="granja-de-enlaces.com" required className="h-9 text-[13px]" />
                <SubmitButton variant="danger" size="sm" className="h-9">
                  Vetar
                </SubmitButton>
              </div>
            </ActionForm>
            <ul className="mt-3 divide-y divide-line text-[13px]">
              {banned.map((d) => (
                <li key={d} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="truncate font-mono text-xs">{d}</span>
                  <ActionForm action={unbanDomain} inline>
                    <input type="hidden" name="domain" value={d} />
                    <SubmitButton size="icon" aria-label={`Quitar veto a ${d}`}>
                      <X className="size-4" aria-hidden />
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
              {!banned.length && <li className="py-2 text-ink-3">Ningún dominio vetado.</li>}
            </ul>
          </div>
        </Card>
      </div>
    </>
  );
}
