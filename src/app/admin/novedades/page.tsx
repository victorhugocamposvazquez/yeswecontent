import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { Badge, ButtonLink, PageHeader } from "@/components/ui";
import { DataTable, EmptyRow, IconButton, RowActions, rowLink, SelectAllTh, SelectTd, Sub, Td, Th, THead, Tr } from "@/components/admin/table";
import { listProductUpdates } from "@/lib/admin/data";
import { fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Novedades" };

export default async function UpdatesPage() {
  const updates = await listProductUpdates();
  const now = Date.now();
  const scheduledCount = updates.filter((u) => new Date(u.published_at).getTime() > now).length;
  return (
    <>
      <PageHeader
        title="Novedades"
        intro="Anuncios de producto que ven los clientes en su panel. Con fecha futura quedan programados."
        actions={
          <ButtonLink href="/admin/novedades/nuevo" variant="ink" size="sm" className="h-10 sm:h-9">
            <Plus className="size-4" aria-hidden /> Nueva novedad
          </ButtonLink>
        }
      />
      <DataTable caption="Novedades del producto" count={updates.length} unit="novedades" footer={scheduledCount ? `${num(scheduledCount)} programadas` : undefined} minWidth="min-w-[720px]">
        <THead>
          <SelectAllTh />
          <Th>Título</Th>
          <Th>Etiqueta</Th>
          <Th>Estado</Th>
          <Th numeric>Fecha</Th>
          <Th className="w-12">
            <span className="sr-only">Acciones</span>
          </Th>
        </THead>
        <tbody>
          {updates.map((u) => {
            const scheduled = new Date(u.published_at).getTime() > now;
            return (
              <Tr key={u.id}>
                <SelectTd label={u.title} />
                <Td>
                  <Link href={`/admin/novedades/${u.id}`} className={rowLink}>
                    {u.title}
                  </Link>
                  <Sub className="max-w-xl">{u.body_md}</Sub>
                </Td>
                <Td>{u.tag ? <Badge tone={u.tag === "Nuevo" ? "lime" : "sky"}>{u.tag}</Badge> : "—"}</Td>
                <Td>
                  <Badge tone={scheduled ? "warn" : "ok"} dot>
                    {scheduled ? "Programada" : "Publicada"}
                  </Badge>
                </Td>
                <Td numeric muted className="whitespace-nowrap">
                  {fmtDate(u.published_at, { day: "numeric", month: "short", year: "numeric" })}
                </Td>
                <Td>
                  <RowActions>
                    <IconButton label={`Editar ${u.title}`} href={`/admin/novedades/${u.id}`}>
                      <Pencil className="size-4" aria-hidden />
                    </IconButton>
                  </RowActions>
                </Td>
              </Tr>
            );
          })}
          {!updates.length && <EmptyRow cols={6}>Sin novedades publicadas.</EmptyRow>}
        </tbody>
      </DataTable>
    </>
  );
}
