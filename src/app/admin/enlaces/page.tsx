import { Ban, Check, X } from "lucide-react";
import { Badge, Card, Input, PageHeader, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DataTable, EmptyRow, FilterBar, FilterField, Td, Th, THead, Tr } from "@/components/admin/table";
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

  return (
    <>
      <PageHeader
        title="Red de enlaces"
        intro={`Modera los intercambios entre clientes antes de que se publiquen. ${num(pending)} pendientes de revisión.`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <FilterBar action="/admin/enlaces" resetHref="/admin/enlaces">
            <FilterField label="Buscar" className="col-span-2 sm:min-w-48 sm:flex-1">
              <Input type="search" name="q" defaultValue={sp.q} placeholder="dominio o anchor" />
            </FilterField>
            <FilterField label="Estado">
              <Select name="status" defaultValue={status}>
                <option value="pending">Pendientes</option>
                <option value="live">Publicados</option>
                <option value="rejected">Rechazados</option>
                <option value="removed">Retirados</option>
                <option value="all">Todos</option>
              </Select>
            </FilterField>
            <FilterField label="DR mínimo">
              <Input type="number" name="dr" min={0} max={100} defaultValue={sp.dr} placeholder="0" className="sm:w-24" />
            </FilterField>
          </FilterBar>

          <DataTable caption="Enlaces de la red" footer={`${num(rows.length)} enlaces · DR por debajo de ${LOW_DR} o dominio vetado se marcan como sospechosos`}>
            <THead>
              <Th>Origen → destino</Th>
              <Th>Anchor</Th>
              <Th className="text-right">DR</Th>
              <Th>Estado</Th>
              <Th>Fecha</Th>
              <Th className="text-right">Moderación</Th>
            </THead>
            <tbody>
              {rows.map((l) => {
                const isBanned = banned.includes(l.source_domain);
                const suspicious = isBanned || (l.domain_rating ?? 0) < LOW_DR;
                const m = statusMeta[l.status];
                return (
                  <Tr key={l.id}>
                    <Td>
                      <div className="font-medium">
                        {l.source_article_url ? (
                          <a href={l.source_article_url} target="_blank" rel="noreferrer nofollow" className="hover:underline">
                            {l.source_domain}
                          </a>
                        ) : (
                          l.source_domain
                        )}
                        <span className="mx-1 text-ink-3" aria-label="enlaza a">
                          →
                        </span>
                        {l.target_domain}
                      </div>
                      {suspicious && (
                        <Badge tone="bad" className="mt-1">
                          {isBanned ? "Dominio vetado" : "DR muy bajo"}
                        </Badge>
                      )}
                    </Td>
                    <Td className="max-w-56 truncate" title={l.anchor}>
                      «{l.anchor}»
                    </Td>
                    <Td className="text-right tabular-nums">{l.domain_rating ?? "—"}</Td>
                    <Td>
                      <Badge tone={m.tone}>{m.label}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">{fmtDate(l.created_at)}</Td>
                    <Td>
                      <ActionForm action={moderateLink} inline className="justify-end">
                        <input type="hidden" name="id" value={l.id} />
                        {l.status === "pending" && (
                          <>
                            <SubmitButton size="sm" variant="ink" name="decision" value="approve" aria-label={`Aprobar enlace de ${l.source_domain}`}>
                              <Check className="size-3" aria-hidden /> Aprobar
                            </SubmitButton>
                            <SubmitButton size="sm" variant="danger" name="decision" value="reject" aria-label={`Rechazar enlace de ${l.source_domain}`}>
                              <X className="size-3" aria-hidden /> Rechazar
                            </SubmitButton>
                          </>
                        )}
                        {l.status === "live" && (
                          <SubmitButton size="sm" variant="ghost" name="decision" value="remove">
                            Retirar
                          </SubmitButton>
                        )}
                      </ActionForm>
                    </Td>
                  </Tr>
                );
              })}
              {!rows.length && <EmptyRow cols={6}>Nada que moderar con estos filtros.</EmptyRow>}
            </tbody>
          </DataTable>
        </div>

        <Card className="h-fit p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Ban className="size-4" aria-hidden /> Dominios vetados
          </h2>
          <p className="mb-3 text-sm text-ink-2">No pueden participar en la red. Al vetar, sus enlaces pendientes se rechazan.</p>
          <ActionForm action={banDomain}>
            <label htmlFor="ban-domain" className="sr-only">
              Dominio a vetar
            </label>
            <div className="flex gap-2">
              <Input id="ban-domain" name="domain" placeholder="granja-de-enlaces.com" required />
              <SubmitButton variant="danger">Vetar</SubmitButton>
            </div>
          </ActionForm>
          <ul className="mt-4 divide-y divide-line text-sm">
            {banned.map((d) => (
              <li key={d} className="flex items-center justify-between gap-2 py-2">
                <span className="truncate font-mono text-xs">{d}</span>
                <ActionForm action={unbanDomain} inline>
                  <input type="hidden" name="domain" value={d} />
                  <SubmitButton size="sm" variant="ghost" aria-label={`Quitar veto a ${d}`}>
                    Quitar
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
            {!banned.length && <li className="py-2 text-ink-3">Ningún dominio vetado.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
