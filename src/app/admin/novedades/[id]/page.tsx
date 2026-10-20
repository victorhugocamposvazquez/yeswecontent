import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { DangerZone, DetailLayout, KeyValue, StickyBar } from "@/components/admin/table";
import { getProductUpdate } from "@/lib/admin/data";
import { fmtDate } from "@/lib/utils";
import { deleteProductUpdate, saveProductUpdate } from "../../actions";

export const metadata = { title: "Editar novedad" };

const TAGS = ["Nuevo", "Mejora", "Corrección", "Aviso"];
const FORM = "update-form";

export default async function UpdateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nuevo";
  const u = isNew ? null : await getProductUpdate(id);
  if (!isNew && !u) notFound();
  // datetime-local espera "YYYY-MM-DDTHH:mm"
  const local = (u ? new Date(u.published_at) : new Date()).toISOString().slice(0, 16);
  const scheduled = u ? new Date(u.published_at).getTime() > Date.now() : false;

  return (
    <>
      <PageHeader
        title={u ? u.title : "Nueva novedad"}
        crumbs={
          <Link href="/admin/novedades" className="hover:text-ink">
            ← Novedades
          </Link>
        }
        intro={u ? "Los clientes la ven en su panel." : "Con fecha futura queda programada."}
      />

      <DetailLayout
        rail={
          <>
            <Card>
              <CardHeader title="Metadatos" className="px-4 py-3" />
              <div className="px-4 py-3">
                <KeyValue
                  items={[
                    {
                      k: "Estado",
                      v: u ? (
                        <Badge tone={scheduled ? "warn" : "ok"} dot>
                          {scheduled ? "Programada" : "Publicada"}
                        </Badge>
                      ) : (
                        <Badge dot>Nueva</Badge>
                      ),
                    },
                    { k: "Etiqueta", v: u?.tag ?? "—" },
                    { k: "Fecha", v: u ? fmtDate(u.published_at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" },
                    ...(u ? [{ k: "ID", v: u.id, mono: true }] : []),
                  ]}
                />
              </div>
            </Card>
            {u && (
              <DangerZone intro="Desaparece del panel de todos los clientes. No se puede deshacer.">
                <ActionForm action={deleteProductUpdate} confirm="¿Eliminar esta novedad? No se puede deshacer.">
                  <input type="hidden" name="id" value={u.id} />
                  <SubmitButton variant="danger" size="sm" className="h-9">
                    Eliminar novedad
                  </SubmitButton>
                </ActionForm>
              </DangerZone>
            )}
          </>
        }
      >
        <ActionForm id={FORM} action={saveProductUpdate} className="space-y-4 [&>p[role=status]]:mt-3">
          {u && <input type="hidden" name="id" value={u.id} />}
          <Card>
            <CardHeader title="Anuncio" className="px-4 py-3 sm:px-5" />
            <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5">
              <div className="sm:col-span-2">
                <Field label="Título">
                  <Input name="title" defaultValue={u?.title} required maxLength={120} />
                </Field>
              </div>
              <Field label="Etiqueta">
                <Select name="tag" defaultValue={u?.tag ?? "Nuevo"}>
                  <option value="">Sin etiqueta</option>
                  {TAGS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Fecha de publicación (UTC)" hint="Una fecha futura la deja programada.">
                <Input name="published_at" type="datetime-local" defaultValue={local} className="tabular" />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Texto" className="px-4 py-3 sm:px-5" />
            <div className="px-4 py-4 sm:px-5">
              <MarkdownField name="body_md" label="Texto en Markdown" rows={8} defaultValue={u?.body_md ?? ""} required />
            </div>
          </Card>

          <StickyBar className="mt-0">
            <p className="text-xs text-ink-3">{u ? "Los cambios se ven al instante en el panel de los clientes." : "Se publica en la fecha indicada."}</p>
            <SubmitButton size="sm" className="h-10 sm:h-9">
              {u ? "Guardar cambios" : "Publicar novedad"}
            </SubmitButton>
          </StickyBar>
        </ActionForm>
      </DetailLayout>
    </>
  );
}
