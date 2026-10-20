import { ExternalLink } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import {
  buildChips,
  DataTable,
  EmptyRow,
  FilterBar,
  FilterSelect,
  HealthBadge,
  IconButton,
  RowActions,
  SearchField,
  SelectAllTh,
  SelectTd,
  Sub,
  SubStatusBadge,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/admin/table";
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
const healthLabel: Record<string, string> = { ok: "Sana", warn: "Revisar", bad: "Fallo" };

export default async function SitesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { q = "", plan = "", health = "" } = sp;
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
  const chips = buildChips("/admin/sitios", sp, {
    q: { label: "Buscar" },
    plan: { label: "Plan", value: (v) => planName(v) },
    health: { label: "Salud", value: (v) => healthLabel[v] ?? v },
  });

  return (
    <>
      <PageHeader
        title="Sitios"
        intro={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            {num(sites.length)} webs en la plataforma
            <Badge tone="ok" dot>
              {counts.ok} sanas
            </Badge>
            <Badge tone="warn" dot>
              {counts.warn} a revisar
            </Badge>
            <Badge tone="bad" dot>
              {counts.bad} con fallos
            </Badge>
          </span>
        }
      />
      <FilterBar action="/admin/sitios" resetHref="/admin/sitios" chips={chips}>
        <SearchField defaultValue={q} placeholder="Nombre, dominio o cliente" />
        <FilterSelect label="Plan" name="plan" defaultValue={plan}>
          <option value="">Plan: todos</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Salud" name="health" defaultValue={health}>
          <option value="">Salud: todas</option>
          <option value="ok">Sana</option>
          <option value="warn">Revisar</option>
          <option value="bad">Fallo</option>
        </FilterSelect>
      </FilterBar>

      <DataTable
        caption="Todos los sitios"
        count={rows.length}
        total={sites.length}
        unit="sitios"
        minWidth="min-w-[960px]"
        footer="«Revisar»: sin publicar en 14 días con plan activo o con menos de dos integraciones. «Fallo»: integración caída o artículos fallidos."
      >
        <THead>
          <SelectAllTh />
          <Th>Sitio</Th>
          <Th>Cliente</Th>
          <Th>Plan</Th>
          <Th numeric>Publicados</Th>
          <Th>Última publicación</Th>
          <Th>Integraciones</Th>
          <Th>Salud</Th>
          <Th className="w-12">
            <span className="sr-only">Acciones</span>
          </Th>
        </THead>
        <tbody>
          {rows.map((s) => (
            <Tr key={s.id} tone={s.health === "bad" ? "bad" : undefined}>
              <SelectTd label={s.name} />
              <Td>
                <div className="font-medium">{s.name}</div>
                <Sub>{s.url.replace(/^https?:\/\//, "")}</Sub>
              </Td>
              <Td>
                {s.workspace}
                <Sub>{s.owner_email}</Sub>
              </Td>
              <Td>
                <div className="flex flex-wrap items-center gap-1.5">
                  {planName(s.plan_id)}
                  <SubStatusBadge status={s.status} />
                </div>
              </Td>
              <Td numeric>{num(s.articles)}</Td>
              <Td muted className="whitespace-nowrap">
                {s.last_published_at ? fmtDate(s.last_published_at, { day: "numeric", month: "short", year: "numeric" }) : "Nunca"}
              </Td>
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
              <Td>
                <RowActions>
                  <IconButton label={`Abrir ${s.name} en una pestaña nueva`} href={s.url} external>
                    <ExternalLink className="size-4" aria-hidden />
                  </IconButton>
                </RowActions>
              </Td>
            </Tr>
          ))}
          {!rows.length && <EmptyRow cols={9} />}
        </tbody>
      </DataTable>
    </>
  );
}
