import Link from "next/link";
import { RotateCcw, X } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DataTable, EmptyRow, Td, Th, THead, Tr } from "@/components/admin/table";
import { getSettings, listQueue } from "@/lib/admin/data";
import type { QueueStage } from "@/lib/admin/types";
import { cn, fmtDate } from "@/lib/utils";
import { cancelJob, retryJob } from "../actions";

export const metadata = { title: "Cola de contenido" };

const stages: { id: QueueStage; label: string; tone: "neutral" | "sky" | "signal" | "lime" | "ok" | "bad" }[] = [
  { id: "planned", label: "En cola", tone: "neutral" },
  { id: "writing", label: "Redactando", tone: "sky" },
  { id: "images", label: "Imágenes", tone: "signal" },
  { id: "review", label: "Revisión", tone: "lime" },
  { id: "publishing", label: "Publicando", tone: "ok" },
  { id: "failed", label: "Fallido", tone: "bad" },
];

type SP = Promise<{ stage?: string }>;

export default async function QueuePage({ searchParams }: { searchParams: SP }) {
  const { stage = "" } = await searchParams;
  const [jobs, settings] = await Promise.all([listQueue(), getSettings()]);
  const rows = jobs.filter((j) => !stage || j.stage === stage).sort((a, b) => (a.stage === "failed" ? -1 : 0) - (b.stage === "failed" ? -1 : 0));
  const meta = (s: QueueStage) => stages.find((x) => x.id === s)!;

  return (
    <>
      <PageHeader title="Cola de contenido" intro="Lo que la máquina está generando y publicando ahora mismo, de todos los clientes." />

      {!settings.generation_enabled && (
        <div role="alert" className="mb-4 rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          La generación de artículos está <strong>pausada</strong> globalmente.{" "}
          <Link href="/admin/ajustes" className="underline">
            Cambiar en Ajustes
          </Link>
        </div>
      )}

      <nav aria-label="Filtrar por etapa" className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {stages.map((s) => {
          const count = jobs.filter((j) => j.stage === s.id).length;
          const active = stage === s.id;
          return (
            <Link
              key={s.id}
              href={active ? "/admin/cola" : `/admin/cola?stage=${s.id}`}
              aria-current={active ? "true" : undefined}
              className={cn("rounded-xl border bg-card p-3 transition hover:border-ink", active ? "border-ink ring-2 ring-lime" : "border-line")}
            >
              <span className="block text-xs text-ink-3">{s.label}</span>
              <span className={cn("text-2xl font-semibold tabular-nums", s.id === "failed" && count > 0 && "text-bad")}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <DataTable caption="Trabajos de la cola">
        <THead>
          <Th>Artículo</Th>
          <Th>Sitio</Th>
          <Th>Etapa</Th>
          <Th>Inicio</Th>
          <Th className="text-right">Acciones</Th>
        </THead>
        <tbody>
          {rows.map((j) => {
            const m = meta(j.stage);
            return (
              <Tr key={j.id} className={j.stage === "failed" ? "bg-bad/[0.03]" : undefined}>
                <Td>
                  <div className="font-medium">{j.title}</div>
                  {j.error && <div className="mt-0.5 text-xs text-bad">{j.error}</div>}
                </Td>
                <Td>{j.site}</Td>
                <Td>
                  <Badge tone={m.tone}>{m.label}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-ink-2">{fmtDate(j.started_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-2">
                    {j.stage === "failed" && (
                      <ActionForm action={retryJob} inline>
                        <input type="hidden" name="id" value={j.id} />
                        <SubmitButton size="sm" variant="outline">
                          <RotateCcw className="size-3" aria-hidden /> Reintentar
                        </SubmitButton>
                      </ActionForm>
                    )}
                    {j.stage !== "publishing" && (
                      <ActionForm action={cancelJob} inline confirm={`¿Cancelar «${j.title}»? El tema se marcará como descartado.`}>
                        <input type="hidden" name="id" value={j.id} />
                        <SubmitButton size="sm" variant="ghost" aria-label={`Cancelar ${j.title}`}>
                          <X className="size-3" aria-hidden /> Cancelar
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
          {!rows.length && <EmptyRow cols={5}>No hay trabajos en esta etapa.</EmptyRow>}
        </tbody>
      </DataTable>

      <Card className="mt-6 p-5 text-sm text-ink-2">
        <h2 className="mb-1 font-semibold text-ink">Cómo funciona</h2>
        Un cron de Vercel recoge los temas programados, redacta el artículo, genera imágenes, pasa el control de calidad y lo publica en el CMS del cliente. Si
        algo falla (credenciales caducadas, CMS caído, límite del modelo), el trabajo queda aquí para reintentarlo.
      </Card>
    </>
  );
}
