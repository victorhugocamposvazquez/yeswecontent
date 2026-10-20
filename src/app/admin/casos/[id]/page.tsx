import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge, Card, CardHeader, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { MarkdownField } from "@/components/admin/MarkdownField";
import { DangerZone, DetailLayout, KeyValue, StickyBar } from "@/components/admin/table";
import { getCaseStudy } from "@/lib/admin/data";
import { num } from "@/lib/utils";
import { deleteCaseStudy, saveCaseStudy } from "../../actions";

export const metadata = { title: "Editar caso de éxito" };

const FORM = "case-form";

export default async function CaseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "nuevo";
  const c = isNew ? null : await getCaseStudy(id);
  if (!isNew && !c) notFound();

  return (
    <>
      <PageHeader
        title={c ? c.company : "Nuevo caso de éxito"}
        crumbs={
          <Link href="/admin/casos" className="hover:text-ink">
            ← Casos de éxito
          </Link>
        }
        intro={c ? `/casos/${c.slug}` : "Rellena los datos y publícalo cuando esté revisado por el cliente."}
        actions={
          c?.published ? (
            <a href={`/casos/${c.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-2 bg-card px-3 text-[13px] font-semibold text-ink shadow-[var(--shadow-xs)] hover:bg-paper-2">
              Ver en la web <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : undefined
        }
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
                      v: (
                        <Badge tone={c?.published ? "ok" : "neutral"} dot>
                          {c?.published ? "Publicado" : "Borrador"}
                        </Badge>
                      ),
                    },
                    { k: "Slug", v: c?.slug ?? "—", mono: true },
                    { k: "Sector", v: c?.sector ?? "—" },
                    { k: "Métrica", v: c && c.metric_before !== null && c.metric_after !== null ? `${num(c.metric_before)} → ${num(c.metric_after)}` : "—" },
                    ...(c ? [{ k: "ID", v: c.id, mono: true }] : []),
                  ]}
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Publicación" className="px-4 py-3" />
              <div className="px-4 py-3">
                <label htmlFor="published" className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-[13px] font-medium sm:min-h-0">
                  <input id="published" form={FORM} type="checkbox" name="published" defaultChecked={c?.published ?? false} className="size-4 accent-[var(--ink)]" />
                  Publicado en la web
                </label>
                <p className="mt-1.5 text-xs text-ink-3">Solo los casos publicados aparecen en /casos. Se aplica al guardar.</p>
              </div>
            </Card>
            {c && (
              <DangerZone intro="Se borra también de la web pública. No se puede deshacer.">
                <ActionForm action={deleteCaseStudy} confirm={`¿Eliminar el caso de ${c.company}? No se puede deshacer.`}>
                  <input type="hidden" name="id" value={c.id} />
                  <SubmitButton variant="danger" size="sm" className="h-9">
                    Eliminar caso
                  </SubmitButton>
                </ActionForm>
              </DangerZone>
            )}
          </>
        }
      >
        <ActionForm id={FORM} action={saveCaseStudy} className="space-y-4 [&>p[role=status]]:mt-3">
          {c && <input type="hidden" name="id" value={c.id} />}
          <Card>
            <CardHeader title="Datos del cliente" className="px-4 py-3 sm:px-5" />
            <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5">
              <Field label="Empresa">
                <Input name="company" defaultValue={c?.company} required />
              </Field>
              <Field label="Sector">
                <Input name="sector" defaultValue={c?.sector ?? ""} placeholder="E-commerce, salud, turismo…" />
              </Field>
              <Field label="Slug" hint="Se genera a partir de la empresa si lo dejas vacío.">
                <Input name="slug" defaultValue={c?.slug} pattern="[a-z0-9-]*" className="font-mono text-[13px]" />
              </Field>
              <div className="sm:col-span-3">
                <Field label="Resumen" hint="Una o dos frases con el resultado. Aparece en las tarjetas.">
                  <Textarea name="summary" rows={2} defaultValue={c?.summary} required className="min-h-0" />
                </Field>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Métrica destacada" intro="Antes y después, con su unidad." className="px-4 py-3 sm:px-5" />
            <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5">
              <Field label="Antes">
                <Input name="metric_before" type="number" min={0} defaultValue={c?.metric_before ?? ""} className="tabular" />
              </Field>
              <Field label="Después">
                <Input name="metric_after" type="number" min={0} defaultValue={c?.metric_after ?? ""} className="tabular" />
              </Field>
              <div className="col-span-2 sm:col-span-1">
                <Field label="Unidad">
                  <Input name="metric_label" defaultValue={c?.metric_label ?? ""} placeholder="clics orgánicos/mes" />
                </Field>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Historia completa" className="px-4 py-3 sm:px-5" />
            <div className="px-4 py-4 sm:px-5">
              <MarkdownField name="body_md" label="Texto en Markdown" defaultValue={c?.body_md ?? ""} />
            </div>
          </Card>

          <StickyBar className="mt-0">
            <p className="text-xs text-ink-3">{c ? "Los cambios se ven en la web al guardar si el caso está publicado." : "Puedes guardarlo como borrador y publicarlo más tarde."}</p>
            <SubmitButton size="sm" className="h-10 sm:h-9">
              {c ? "Guardar cambios" : "Crear caso"}
            </SubmitButton>
          </StickyBar>
        </ActionForm>
      </DetailLayout>
    </>
  );
}
