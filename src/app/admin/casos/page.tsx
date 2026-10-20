import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, ButtonLink, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DataTable, EmptyRow, Td, Th, THead, Tr } from "@/components/admin/table";
import { listCaseStudies } from "@/lib/admin/data";
import { num } from "@/lib/utils";
import { toggleCaseStudy } from "../actions";

export const metadata = { title: "Casos de éxito" };

export default async function CasesPage() {
  const cases = await listCaseStudies();
  return (
    <>
      <PageHeader
        title="Casos de éxito"
        intro="Historias de clientes para la web pública. Solo se muestran las publicadas."
        actions={
          <ButtonLink href="/admin/casos/nuevo" variant="ink">
            <Plus className="size-4" aria-hidden /> Nuevo caso
          </ButtonLink>
        }
      />
      <DataTable caption="Casos de éxito">
        <THead>
          <Th>Empresa</Th>
          <Th>Resultado</Th>
          <Th>Estado</Th>
          <Th className="text-right">Acciones</Th>
        </THead>
        <tbody>
          {cases.map((c) => (
            <Tr key={c.id}>
              <Td>
                <Link href={`/admin/casos/${c.id}`} className="font-medium hover:underline">
                  {c.company}
                </Link>
                <div className="text-xs text-ink-3">
                  {c.sector ?? "—"} · /casos/{c.slug}
                </div>
              </Td>
              <Td className="max-w-md">
                {c.metric_before !== null && c.metric_after !== null ? (
                  <span className="tabular-nums">
                    {num(c.metric_before)} → <strong>{num(c.metric_after)}</strong> <span className="text-ink-3">{c.metric_label}</span>
                  </span>
                ) : (
                  <span className="line-clamp-2 text-ink-2">{c.summary}</span>
                )}
              </Td>
              <Td>
                <Badge tone={c.published ? "ok" : "neutral"}>{c.published ? "Publicado" : "Borrador"}</Badge>
              </Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <ActionForm action={toggleCaseStudy} inline>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="published" value={String(!c.published)} />
                    <SubmitButton size="sm" variant="outline">
                      {c.published ? "Despublicar" : "Publicar"}
                    </SubmitButton>
                  </ActionForm>
                  <Link href={`/admin/casos/${c.id}`} className="inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-semibold text-ink-2 hover:bg-paper-2 sm:min-h-0">
                    Editar
                  </Link>
                </div>
              </Td>
            </Tr>
          ))}
          {!cases.length && <EmptyRow cols={4}>Todavía no hay casos. Crea el primero.</EmptyRow>}
        </tbody>
      </DataTable>
    </>
  );
}
