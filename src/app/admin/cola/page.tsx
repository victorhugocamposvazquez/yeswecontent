import Link from "next/link";
import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DataTable, EmptyRow, RowActions, Segmented, Sub, Td, Th, THead, Tr } from "@/components/admin/table";
import { getSettings, listQueue } from "@/lib/admin/data";
import type { QueueStage } from "@/lib/admin/types";
import { fmtDate } from "@/lib/utils";
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

/** Tiempo transcurrido en formato corto («4 min», «2 h», «3 d»). */
function elapsed(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}

type SP = Promise<{ stage?: string }>;

export default async function QueuePage({ searchParams }: { searchParams: SP }) {
  const { stage = "" } = await searchParams;
  const [jobs, settings] = await Promise.all([listQueue(), getSettings()]);
  const rows = jobs.filter((j) => !stage || j.stage === stage).sort((a, b) => (a.stage === "failed" ? -1 : 0) - (b.stage === "failed" ? -1 : 0));
  const meta = (s: QueueStage) => stages.find((x) => x.id === s)!;
  const now = Date.now();
  const failed = jobs.filter((j) => j.stage === "failed").length;

  return (
    <>
      <PageHeader
        title="Cola de contenido"
        intro="Lo que la máquina está generando y publicando ahora mismo, de todos los clientes."
        actions={
          <Badge tone={settings.generation_enabled ? "ok" : "bad"} dot className="h-8 px-3">
            {settings.generation_enabled ? "Generación activa" : "Generación pausada"}
          </Badge>
        }
      />

      {!settings.generation_enabled && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-[13px] text-bad">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            La generación de artículos está <strong>pausada</strong> globalmente.{" "}
            <Link href="/admin/ajustes" className="font-medium underline underline-offset-2">
              Cambiar en Ajustes
            </Link>
          </span>
        </div>
      )}

      <div className="mb-3">
        <Segmented
          label="Filtrar por etapa"
          items={[
            { href: "/admin/cola", label: "Todas", count: jobs.length, active: !stage },
            ...stages.map((s) => ({
              href: `/admin/cola?stage=${s.id}`,
              label: s.label,
              count: jobs.filter((j) => j.stage === s.id).length,
              active: stage === s.id,
              tone: s.id === "failed" ? ("bad" as const) : undefined,
            })),
          ]}
        />
      </div>

      <DataTable caption="Trabajos de la cola" count={rows.length} total={jobs.length} unit="trabajos" footer={failed ? `${failed} fallidos primero` : undefined} minWidth="min-w-[760px]">
        <THead>
          <Th>Artículo</Th>
          <Th>Sitio</Th>
          <Th>Etapa</Th>
          <Th>Inicio</Th>
          <Th numeric>Transcurrido</Th>
          <Th className="w-24">
            <span className="sr-only">Acciones</span>
          </Th>
        </THead>
        <tbody>
          {rows.map((j) => {
            const m = meta(j.stage);
            return (
              <Tr key={j.id} tone={j.stage === "failed" ? "bad" : undefined}>
                <Td>
                  <div className="font-medium">{j.title}</div>
                  {j.error && <Sub className="whitespace-normal text-bad">{j.error}</Sub>}
                </Td>
                <Td muted>{j.site}</Td>
                <Td>
                  <Badge tone={m.tone} dot>
                    {m.label}
                  </Badge>
                </Td>
                <Td muted className="whitespace-nowrap">
                  {fmtDate(j.started_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Td>
                <Td numeric muted>
                  {elapsed(j.started_at, now)}
                </Td>
                <Td>
                  <RowActions>
                    {j.stage === "failed" && (
                      <ActionForm action={retryJob} inline>
                        <input type="hidden" name="id" value={j.id} />
                        <SubmitButton size="icon" aria-label={`Reintentar ${j.title}`}>
                          <RotateCcw className="size-4" aria-hidden />
                        </SubmitButton>
                      </ActionForm>
                    )}
                    {j.stage !== "publishing" && (
                      <ActionForm action={cancelJob} inline confirm={`¿Cancelar «${j.title}»? El tema se marcará como descartado.`}>
                        <input type="hidden" name="id" value={j.id} />
                        <SubmitButton size="icon" variant="danger" aria-label={`Cancelar ${j.title}`}>
                          <X className="size-4" aria-hidden />
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </RowActions>
                </Td>
              </Tr>
            );
          })}
          {!rows.length && <EmptyRow cols={6}>No hay trabajos en esta etapa.</EmptyRow>}
        </tbody>
      </DataTable>

      <Card className="mt-4">
        <CardHeader title="Cómo funciona" className="px-4 py-3" />
        <p className="px-4 py-3 text-[13px] leading-relaxed text-ink-2">
          Un cron de Vercel recoge los temas programados, redacta el artículo, genera imágenes, pasa el control de calidad y lo publica en el CMS del cliente. Si algo
          falla (credenciales caducadas, CMS caído, límite del modelo), el trabajo queda aquí para reintentarlo.
        </p>
      </Card>
    </>
  );
}
