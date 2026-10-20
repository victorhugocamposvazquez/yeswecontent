import { Badge, Input, PageHeader, Select } from "@/components/ui";
import { DataTable, EmptyRow, FilterBar, FilterField, HealthBadge, SubStatusBadge, Td, Th, THead, Tr } from "@/components/admin/table";
import { listAdminPlans, listAdminSites } from "@/lib/admin/data";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Sitios" };

type SP = Promise<{ q?: string; plan?: string; health?: string }>;

const providerLabel: Record<string, string> = {
  wordpress: "WordPress",
  shopify: "Shopify",
  webflow: "Webflow",
  ghost: "Ghost",
  webhook: "Webhook",
  gsc: "Search Console",
  ga4: "GA4",
  meta: "Meta",
  reddit: "Reddit",
  quora: "Quora",
};

export default async function SitesPage({ searchParams }: { searchParams: SP }) {
  const { q = "", plan = "", health = "" } = await searchParams;
  const [sites, plans] = await Promise.all([listAdminSites(), listAdminPlans()]);
  const needle = q.trim().toLowerCase();
  const rows = sites.filter(
    (s) =>
      (!needle || [s.name, s.url, s.workspace, s.owner_email ?? ""].some((v) => v.toLowerCase().includes(needle))) &&
      (!plan || s.plan_id === plan) &&
      (!health || s.health === health),
  );
  const planName = (id: string | null) => plans.find((p) => p.id === id)?.name ?? "—";
  const counts = { ok: sites.filter((s) => s.health === "ok").length, warn: sites.filter((s) => s.health === "warn").length, bad: sites.filter((s) => s.health === "bad").length };

  return (
    <>
      <PageHeader
        title="Sitios"
        intro={
          <>
            {num(sites.length)} webs en la plataforma · <span className="text-ok">{counts.ok} sanas</span> ·{" "}
            <span className="text-warn">{counts.warn} a revisar</span> · <span className="text-bad">{counts.bad} con fallos</span>
          </>
        }
      />
      <FilterBar action="/admin/sitios" resetHref="/admin/sitios">
        <FilterField label="Buscar" className="min-w-56 flex-1">
          <Input type="search" name="q" defaultValue={q} placeholder="nombre, dominio o cliente" />
        </FilterField>
        <FilterField label="Plan">
          <Select name="plan" defaultValue={plan}>
            <option value="">Todos</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Salud">
          <Select name="health" defaultValue={health}>
            <option value="">Todas</option>
            <option value="ok">Sana</option>
            <option value="warn">Revisar</option>
            <option value="bad">Fallo</option>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable
        caption="Todos los sitios"
        footer={
          <>
            {num(rows.length)} de {num(sites.length)} sitios. «Revisar»: sin publicar en 14 días con plan activo o con menos de dos integraciones. «Fallo»: integración caída o artículos fallidos.
          </>
        }
      >
        <THead>
          <Th>Sitio</Th>
          <Th>Cliente</Th>
          <Th>Plan</Th>
          <Th className="text-right">Publicados</Th>
          <Th>Última publicación</Th>
          <Th>Integraciones</Th>
          <Th>Salud</Th>
        </THead>
        <tbody>
          {rows.map((s) => (
            <Tr key={s.id}>
              <Td>
                <div className="font-medium">{s.name}</div>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-ink-3 hover:underline">
                  {s.url.replace(/^https?:\/\//, "")}
                </a>
              </Td>
              <Td>
                {s.workspace}
                <div className="text-xs text-ink-3">{s.owner_email}</div>
              </Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  {planName(s.plan_id)}
                  <SubStatusBadge status={s.status} />
                </div>
              </Td>
              <Td className="text-right tabular-nums">{num(s.articles)}</Td>
              <Td className="whitespace-nowrap text-ink-2">{s.last_published_at ? fmtDate(s.last_published_at, { day: "numeric", month: "short", year: "numeric" }) : "Nunca"}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {s.integrations.map((i) => (
                    <Badge key={i.provider} tone={i.status === "connected" ? "neutral" : "bad"} title={i.status}>
                      {providerLabel[i.provider] ?? i.provider}
                    </Badge>
                  ))}
                  {!s.integrations.length && <span className="text-xs text-ink-3">Ninguna</span>}
                </div>
              </Td>
              <Td>
                <HealthBadge health={s.health} />
              </Td>
            </Tr>
          ))}
          {!rows.length && <EmptyRow cols={7} />}
        </tbody>
      </DataTable>
    </>
  );
}
