import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { getCaseStudy } from "@/lib/admin/data";
import { deleteCaseStudy, saveCaseStudy } from "../../actions";

export const metadata = { title: "Editar caso de éxito" };

export default async function CaseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nuevo";
  const c = isNew ? null : await getCaseStudy(id);
  if (!isNew && !c) notFound();

  return (
    <>
      <Link href="/admin/casos" className="mb-2 -mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-2 hover:text-ink sm:mt-0 sm:mb-4 sm:min-h-0">
        <ArrowLeft className="size-4" aria-hidden /> Casos de éxito
      </Link>
      <PageHeader title={c ? c.company : "Nuevo caso de éxito"} intro={c ? `/casos/${c.slug}` : "Rellena los datos y publícalo cuando esté revisado por el cliente."} />

      <Card className="p-5 sm:p-6">
        <ActionForm action={saveCaseStudy} className="space-y-5">
          {c && <input type="hidden" name="id" value={c.id} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Empresa">
              <Input name="company" defaultValue={c?.company} required />
            </Field>
            <Field label="Sector">
              <Input name="sector" defaultValue={c?.sector ?? ""} placeholder="E-commerce, salud, turismo…" />
            </Field>
            <Field label="Slug" hint="Se genera a partir de la empresa si lo dejas vacío.">
              <Input name="slug" defaultValue={c?.slug} pattern="[a-z0-9-]*" />
            </Field>
          </div>
          <Field label="Resumen" hint="Una o dos frases con el resultado. Aparece en las tarjetas.">
            <Textarea name="summary" rows={2} defaultValue={c?.summary} required />
          </Field>
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Métrica destacada</legend>
            <Field label="Antes">
              <Input name="metric_before" type="number" min={0} defaultValue={c?.metric_before ?? ""} />
            </Field>
            <Field label="Después">
              <Input name="metric_after" type="number" min={0} defaultValue={c?.metric_after ?? ""} />
            </Field>
            <Field label="Unidad">
              <Input name="metric_label" defaultValue={c?.metric_label ?? ""} placeholder="clics orgánicos/mes" />
            </Field>
          </fieldset>
          <MarkdownField name="body_md" label="Historia completa" defaultValue={c?.body_md ?? ""} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <label htmlFor="published" className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input id="published" type="checkbox" name="published" defaultChecked={c?.published ?? false} className="size-4 accent-[var(--ink)]" />
              Publicado en la web
            </label>
            <SubmitButton>{c ? "Guardar cambios" : "Crear caso"}</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      {c && (
        <ActionForm action={deleteCaseStudy} confirm={`¿Eliminar el caso de ${c.company}? No se puede deshacer.`} className="mt-6">
          <input type="hidden" name="id" value={c.id} />
          <SubmitButton variant="danger" size="sm">
            Eliminar caso
          </SubmitButton>
        </ActionForm>
      )}
    </>
  );
}
