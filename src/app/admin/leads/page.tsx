import { Download } from "lucide-react";
import { Badge, Input, PageHeader, Select, Stat } from "@/components/ui";
import { DataTable, EmptyRow, FilterBar, FilterField, Td, Th, THead, Tr } from "@/components/admin/table";
import { listLeads } from "@/lib/admin/data";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Leads" };

type SP = Promise<{ tool?: string; q?: string }>;

const toolLabel = (t: string) => t.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export default async function LeadsPage({ searchParams }: { searchParams: SP }) {
  const { tool = "", q = "" } = await searchParams;
  const leads = await listLeads();
  const tools = [...new Set(leads.map((l) => l.tool))].sort();
  const needle = q.trim().toLowerCase();
  const rows = leads.filter(
    (l) => (!tool || l.tool === tool) && (!needle || (l.email ?? "").toLowerCase().includes(needle) || (l.url ?? "").toLowerCase().includes(needle)),
  );
  const withEmail = leads.filter((l) => l.email).length;
  const csvHref = `/api/admin/leads.csv?${new URLSearchParams({ ...(tool && { tool }), ...(q && { q }) }).toString()}`;

  return (
    <>
      <PageHeader
        title="Leads"
        intro="Personas que han usado las herramientas gratuitas de la web pública."
        actions={
          <a href={csvHref} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-2" download>
            <Download className="size-4" aria-hidden /> Exportar CSV
          </a>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Leads totales" value={num(leads.length)} />
        <Stat label="Con email" value={num(withEmail)} delta={leads.length ? `${Math.round((withEmail / leads.length) * 100)}% de conversión a email` : undefined} />
        <Stat label="Herramientas activas" value={num(tools.length)} className="col-span-2 md:col-span-1" />
      </div>

      <FilterBar action="/admin/leads" resetHref="/admin/leads">
        <FilterField label="Buscar" className="min-w-56 flex-1">
          <Input type="search" name="q" defaultValue={q} placeholder="email o web" />
        </FilterField>
        <FilterField label="Herramienta">
          <Select name="tool" defaultValue={tool}>
            <option value="">Todas</option>
            {tools.map((t) => (
              <option key={t} value={t}>
                {toolLabel(t)}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable caption="Leads de herramientas gratuitas" footer={`${num(rows.length)} de ${num(leads.length)} leads. El CSV respeta los filtros actuales.`}>
        <THead>
          <Th>Email</Th>
          <Th>Web analizada</Th>
          <Th>Herramienta</Th>
          <Th className="text-right">Fecha</Th>
        </THead>
        <tbody>
          {rows.map((l) => (
            <Tr key={l.id}>
              <Td>{l.email ? <a href={`mailto:${l.email}`} className="font-medium hover:underline">{l.email}</a> : <span className="text-ink-3">Anónimo</span>}</Td>
              <Td>
                {l.url ? (
                  <a href={l.url} target="_blank" rel="noreferrer nofollow" className="hover:underline">
                    {l.url.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </Td>
              <Td>
                <Badge>{toolLabel(l.tool)}</Badge>
              </Td>
              <Td className="whitespace-nowrap text-right text-ink-2">{fmtDate(l.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Td>
            </Tr>
          ))}
          {!rows.length && <EmptyRow cols={4} />}
        </tbody>
      </DataTable>
    </>
  );
}
