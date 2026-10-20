import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { Badge, ButtonLink, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DataTable, EmptyRow, IconButton, RowActions, rowLink, SelectAllTh, SelectTd, Sub, Td, Th, THead, Tr } from "@/components/admin/table";
import { listCaseStudies } from "@/lib/admin/data";
import { num } from "@/lib/utils";
import { toggleCaseStudy } from "../actions";

export const metadata = { title: "Casos de éxito" };

export default async function CasesPage() {
  const cases = await listCaseStudies();
  const published = cases.filter((c) => c.published).length;
  return (
    <>
      <PageHeader
        title="Casos de éxito"
        intro="Historias de clientes para la web pública. Solo se muestran las publicadas."
        actions={
          <ButtonLink href="/admin/casos/nuevo" variant="ink" size="sm" className="h-10 sm:h-9">
            <Plus className="size-4" aria-hidden /> Nuevo caso
          </ButtonLink>
        }
      />
      <DataTable caption="Casos de éxito" count={cases.length} unit="casos" footer={`${num(published)} publicados`} minWidth="min-w-[720px]">
        <THead>
          <SelectAllTh />
          <Th>Empresa</Th>
          <Th>Resultado</Th>
          <Th>Estado</Th>
          <Th className="w-24">
            <span className="sr-only">Acciones</span>
          </Th>
        </THead>
        <tbody>
          {cases.map((c) => (
            <Tr key={c.id}>
              <SelectTd label={c.company} />
              <Td>
                <Link href={`/admin/casos/${c.id}`} className={rowLink}>
                  {c.company}
                </Link>
                <Sub>
                  {c.sector ?? "—"} · /casos/{c.slug}
                </Sub>
              </Td>
              <Td className="max-w-md">
                {c.metric_before !== null && c.metric_after !== null ? (
                  <span className="tabular">
                    {num(c.metric_before)} → <strong>{num(c.metric_after)}</strong> <span className="text-ink-3">{c.metric_label}</span>
                  </span>
                ) : (
                  <span className="line-clamp-2 text-ink-2">{c.summary}</span>
                )}
              </Td>
              <Td>
                <Badge tone={c.published ? "ok" : "neutral"} dot>
                  {c.published ? "Publicado" : "Borrador"}
                </Badge>
              </Td>
              <Td>
                <RowActions>
                  <ActionForm action={toggleCaseStudy} inline>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="published" value={String(!c.published)} />
                    <SubmitButton size="icon" aria-label={c.published ? `Despublicar ${c.company}` : `Publicar ${c.company}`}>
                      {c.published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </SubmitButton>
                  </ActionForm>
                  <IconButton label={`Editar ${c.company}`} href={`/admin/casos/${c.id}`}>
                    <Pencil className="size-4" aria-hidden />
                  </IconButton>
                </RowActions>
              </Td>
            </Tr>
          ))}
          {!cases.length && <EmptyRow cols={5}>Todavía no hay casos. Crea el primero.</EmptyRow>}
        </tbody>
      </DataTable>
    </>
  );
}
