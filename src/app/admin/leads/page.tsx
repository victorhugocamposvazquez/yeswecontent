import { Download, ExternalLink, Mail } from "lucide-react";
import { Badge, PageHeader, Stat } from "@/components/ui";
import { buildChips, DataTable, EmptyRow, FilterBar, FilterSelect, IconButton, RowActions, SearchField, SelectAllTh, SelectTd, Td, Th, THead, Tr } from "@/components/admin/table";
import { listLeads } from "@/lib/admin/data";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Leads" };

type SP = Promise<{ tool?: string; q?: string }>;

const toolLabel = (t: string) => t.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export default async function LeadsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { tool = "", q = "" } = sp;
  const leads = await listLeads();
  const tools = [...new Set(leads.map((l) => l.tool))].sort();
  const needle = q.trim().toLowerCase();
  const rows = leads.filter(
    (l) => (!tool || l.tool === tool) && (!needle || (l.email ?? "").toLowerCase().includes(needle) || (l.url ?? "").toLowerCase().includes(needle)),
  );
  const withEmail = leads.filter((l) => l.email).length;
  const csvHref = `/api/admin/leads.csv?${new URLSearchParams({ ...(tool && { tool }), ...(q && { q }) }).toString()}`;
  const chips = buildChips("/admin/leads", sp, { q: { label: "Buscar" }, tool: { label: "Herramienta", value: toolLabel } });

  return (
    <>
      <PageHeader
        title="Leads"
        intro="Personas que han usado las herramientas gratuitas de la web pública."
        actions={
          <a
            href={csvHref}
            download
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] border border-line-2 bg-card px-4 text-sm font-semibold text-ink shadow-[var(--shadow-xs)] transition hover:border-ink-3 hover:bg-paper-2 sm:h-9 sm:text-[13px]"
          >
            <Download className="size-4" aria-hidden /> Exportar CSV
          </a>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Leads totales" value={num(leads.length)} />
        <Stat label="Con email" value={num(withEmail)} delta={leads.length ? `${Math.round((withEmail / leads.length) * 100)} %` : undefined} trend="up" hint="conversión a email" />
        <Stat label="Herramientas activas" value={num(tools.length)} className="col-span-2 md:col-span-1" />
      </div>

      <FilterBar action="/admin/leads" resetHref="/admin/leads" chips={chips}>
        <SearchField defaultValue={q} placeholder="Email o web" />
        <FilterSelect label="Herramienta" name="tool" defaultValue={tool}>
          <option value="">Herramienta: todas</option>
          {tools.map((t) => (
            <option key={t} value={t}>
              {toolLabel(t)}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      <DataTable caption="Leads de herramientas gratuitas" count={rows.length} total={leads.length} unit="leads" footer="El CSV respeta los filtros actuales." minWidth="min-w-[720px]">
        <THead>
          <SelectAllTh />
          <Th>Email</Th>
          <Th>Web analizada</Th>
          <Th>Herramienta</Th>
          <Th numeric>Fecha</Th>
          <Th className="w-20">
            <span className="sr-only">Acciones</span>
          </Th>
        </THead>
        <tbody>
          {rows.map((l) => (
            <Tr key={l.id}>
              <SelectTd label={l.email ?? l.url ?? "lead"} />
              <Td>{l.email ? <span className="font-medium">{l.email}</span> : <span className="text-ink-3">Anónimo</span>}</Td>
              <Td muted>{l.url ? l.url.replace(/^https?:\/\//, "") : "—"}</Td>
              <Td>
                <Badge>{toolLabel(l.tool)}</Badge>
              </Td>
              <Td numeric muted className="whitespace-nowrap">
                {fmtDate(l.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </Td>
              <Td>
                <RowActions>
                  {l.email && (
                    <IconButton label={`Escribir a ${l.email}`} href={`mailto:${l.email}`} external>
                      <Mail className="size-4" aria-hidden />
                    </IconButton>
                  )}
                  {l.url && (
                    <IconButton label="Abrir la web analizada" href={l.url} external>
                      <ExternalLink className="size-4" aria-hidden />
                    </IconButton>
                  )}
                </RowActions>
              </Td>
            </Tr>
          ))}
          {!rows.length && <EmptyRow cols={6} />}
        </tbody>
      </DataTable>
    </>
  );
}
