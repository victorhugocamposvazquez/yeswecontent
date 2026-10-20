import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { getProductUpdate } from "@/lib/admin/data";
import { deleteProductUpdate, saveProductUpdate } from "../../actions";

export const metadata = { title: "Editar novedad" };

const TAGS = ["Nuevo", "Mejora", "Corrección", "Aviso"];

export default async function UpdateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nuevo";
  const u = isNew ? null : await getProductUpdate(id);
  if (!isNew && !u) notFound();
  // datetime-local espera "YYYY-MM-DDTHH:mm"
  const local = (u ? new Date(u.published_at) : new Date()).toISOString().slice(0, 16);

  return (
    <>
      <Link href="/admin/novedades" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Novedades
      </Link>
      <PageHeader title={u ? "Editar novedad" : "Nueva novedad"} />

      <Card className="p-5 sm:p-6">
        <ActionForm action={saveProductUpdate} className="space-y-5">
          {u && <input type="hidden" name="id" value={u.id} />}
          <Field label="Título">
            <Input name="title" defaultValue={u?.title} required maxLength={120} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Etiqueta">
              <Select name="tag" defaultValue={u?.tag ?? "Nuevo"}>
                <option value="">Sin etiqueta</option>
                {TAGS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha de publicación (UTC)" hint="Una fecha futura la deja programada.">
              <Input name="published_at" type="datetime-local" defaultValue={local} />
            </Field>
          </div>
          <MarkdownField name="body_md" label="Texto" rows={8} defaultValue={u?.body_md ?? ""} required />
          <div className="flex justify-end border-t border-line pt-4">
            <SubmitButton>{u ? "Guardar cambios" : "Publicar novedad"}</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      {u && (
        <ActionForm action={deleteProductUpdate} confirm="¿Eliminar esta novedad? No se puede deshacer." className="mt-6">
          <input type="hidden" name="id" value={u.id} />
          <SubmitButton variant="danger" size="sm">
            Eliminar novedad
          </SubmitButton>
        </ActionForm>
      )}
    </>
  );
}
