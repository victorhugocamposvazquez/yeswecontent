import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, ButtonLink, PageHeader } from "@/components/ui";
import { DataTable, EmptyRow, Td, Th, THead, Tr } from "@/components/admin/table";
import { listProductUpdates } from "@/lib/admin/data";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Novedades" };

export default async function UpdatesPage() {
  const updates = await listProductUpdates();
  const now = Date.now();
  return (
    <>
      <PageHeader
        title="Novedades"
        intro="Anuncios de producto que ven los clientes en su panel. Con fecha futura quedan programados."
        actions={
          <ButtonLink href="/admin/novedades/nuevo" variant="ink">
            <Plus className="size-4" aria-hidden /> Nueva novedad
          </ButtonLink>
        }
      />
      <DataTable caption="Novedades del producto">
        <THead>
          <Th>Título</Th>
          <Th>Etiqueta</Th>
          <Th>Estado</Th>
          <Th className="text-right">Fecha</Th>
        </THead>
        <tbody>
          {updates.map((u) => {
            const scheduled = new Date(u.published_at).getTime() > now;
            return (
              <Tr key={u.id}>
                <Td>
                  <Link href={`/admin/novedades/${u.id}`} className="font-medium hover:underline">
                    {u.title}
                  </Link>
                  <div className="line-clamp-1 max-w-xl text-xs text-ink-3">{u.body_md}</div>
                </Td>
                <Td>{u.tag ? <Badge tone={u.tag === "Nuevo" ? "lime" : "sky"}>{u.tag}</Badge> : "—"}</Td>
                <Td>
                  <Badge tone={scheduled ? "warn" : "ok"}>{scheduled ? "Programada" : "Publicada"}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-right text-ink-2">{fmtDate(u.published_at, { day: "numeric", month: "short", year: "numeric" })}</Td>
              </Tr>
            );
          })}
          {!updates.length && <EmptyRow cols={4}>Sin novedades publicadas.</EmptyRow>}
        </tbody>
      </DataTable>
    </>
  );
}
