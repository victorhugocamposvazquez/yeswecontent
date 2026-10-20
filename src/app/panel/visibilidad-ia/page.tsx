import { Check, MessageSquareQuote, Plus, Radar } from "lucide-react";
import { AreaChart, Bars } from "@/components/charts";
import { ActionForm } from "@/components/panel/action-form";
import { ModelLogo } from "@/components/panel/model-logo";
import { VisibilityTester } from "@/components/panel/visibility-tester";
import { Badge, Card, CardHeader, EmptyState, Input, PageHeader, Stat } from "@/components/ui";
import { getCurrentSite, getSubscription, getVisibility, listPlans } from "@/lib/data";
import { getVisibilityHistory } from "@/lib/panel/data";
import { MODELS, MODEL_LABEL, competitorCounts, latestByPromptModel, overallShare, shareByModel } from "@/lib/panel/visibility";
import { cn, fmtDate } from "@/lib/utils";
import { addPrompt, checkPromptNow, togglePrompt } from "../actions";

export const metadata = { title: "Visibilidad IA" };

const actionBtn = "[&_button]:h-8 [&_button]:px-2.5 [&_button]:text-xs";

export default async function VisibilityPage() {
  const site = (await getCurrentSite())!;
  const [{ prompts, checks }, sub, plans] = await Promise.all([getVisibility(site.id), getSubscription(site.id), listPlans()]);
  const limit = plans.find((p) => p.id === sub?.plan_id)?.tracked_prompts ?? 10;
  const latest = latestByPromptModel(checks);
  const byModel = shareByModel(checks);
  const share = overallShare(checks);
  const comps = competitorCounts(checks);
  const history = getVisibilityHistory();
  const positions = [...latest.values()].filter((c) => c.position != null).map((c) => c.position!);
  const avgPos = positions.length ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : "—";
  const lastCheck = checks[0]?.checked_at;
  const excerpts = [...latest.values()].filter((c) => c.answer_excerpt).slice(0, 4);
  const delta = history.length > 1 ? history[history.length - 1].share - history[0].share : null;

  const Mention = ({ c }: { c?: { mentioned: boolean; position: number | null; answer_excerpt: string | null } }) =>
    !c ? (
      <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-line-2" title="Pendiente" aria-label="Pendiente" />
    ) : c.mentioned ? (
      <span className="tabular inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok" title={c.answer_excerpt ?? undefined}>
        <Check className="h-3.5 w-3.5" aria-hidden /> #{c.position}
        <span className="sr-only">Mencionado en posición {c.position}</span>
      </span>
    ) : (
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-line-2" title={c.answer_excerpt ?? undefined} aria-label="No mencionado" />
    );

  return (
    <>
      <PageHeader title="Visibilidad en IA" intro="Cada mañana preguntamos a ChatGPT, Claude, Gemini y Perplexity lo que preguntarían tus clientes, y anotamos si te recomiendan." />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Cuota de voz" value={`${share}%`} delta={delta != null ? `${delta >= 0 ? "+" : ""}${delta} pts` : undefined} trend={delta == null || delta === 0 ? "flat" : delta > 0 ? "up" : "down"} hint={delta != null ? "en 12 semanas" : undefined} icon={<Radar className="h-4 w-4" />} />
        <Stat label="Posición media" value={avgPos} hint="cuando te mencionan" />
        <Stat label="Preguntas seguidas" value={`${prompts.length}/${limit}`} hint="de tu plan" />
        <Stat label="Última revisión" value={lastCheck ? fmtDate(lastCheck) : "—"} hint="cada mañana" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Evolución de tu cuota de voz" intro="% de respuestas que te mencionan, por semana" />
          <div className="p-5">
            {history.length ? (
              <AreaChart data={history.map((h) => h.share)} color="var(--ink)" labels={history.filter((_, i) => i % 3 === 0 || i === history.length - 1).map((h) => h.week)} height={190} className="h-44 md:h-48" />
            ) : (
              <p className="text-[13px] text-ink-3">El histórico aparecerá tras la primera semana de seguimiento.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Por modelo" intro="Dónde te recomiendan más" />
          <ul className="divide-y divide-line">
            {byModel.map((m) => (
              <li key={m.model} className="flex items-center gap-3 px-5 py-3">
                <ModelLogo model={m.model} size={20} boxed />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="font-medium">{m.label}</span>
                    <span className="tabular font-semibold">{m.share}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-3">
                    <div className="h-full rounded-full bg-signal transition-[width] duration-500" style={{ width: `${m.share}%` }} />
                  </div>
                  <p className="tabular mt-1 text-[11px] text-ink-3">
                    {m.hits} de {m.total} preguntas
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden md:mt-5">
        <CardHeader
          title="Preguntas que seguimos"
          intro={
            <>
              <span className="mr-3 inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-ok" /> te menciona (con su posición)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-line-2" /> no aparece
              </span>
            </>
          }
          action={
            <Badge tone={prompts.length >= limit ? "warn" : "neutral"} className="tabular">
              {prompts.length}/{limit}
            </Badge>
          }
        />
        <div className="border-b border-line bg-paper-2/60 px-5 py-3">
          <ActionForm action={addPrompt} submitLabel={<><Plus className="h-4 w-4" aria-hidden /> Añadir pregunta</>} variant="ink" inline className="w-full">
            <label htmlFor="new-prompt" className="sr-only">
              Nueva pregunta
            </label>
            <Input id="new-prompt" name="prompt" placeholder="¿Dónde comprar…?" className="min-w-0 flex-1 md:max-w-md" required disabled={prompts.length >= limit} />
          </ActionForm>
        </div>
        {prompts.length > 0 && (
          <ul className="divide-y divide-line md:hidden">
            {prompts.map((p) => (
              <li key={p.id} className={cn("p-4", !p.active && "opacity-50")}>
                <p className="font-medium leading-snug">{p.prompt}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  {MODELS.map((m) => (
                    <div key={m} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-paper-2/50 px-3 py-2">
                      <dt className="flex items-center gap-1.5 truncate text-xs text-ink-2">
                        <ModelLogo model={m} size={14} /> {MODEL_LABEL[m]}
                      </dt>
                      <dd className="flex items-center">
                        <Mention c={latest.get(`${p.id}:${m}`)} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-2 flex gap-1">
                  <ActionForm action={checkPromptNow} submitLabel="Comprobar" variant="ghost" pendingLabel="Preguntando…" inline>
                    <input type="hidden" name="id" value={p.id} />
                  </ActionForm>
                  <ActionForm action={togglePrompt} submitLabel={p.active ? "Pausar" : "Reactivar"} variant="ghost" inline>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={String(!p.active)} />
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>
        )}
        {prompts.length ? (
          <div className="scroll-x max-md:hidden">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 [&_th]:border-b [&_th]:border-line">
                <tr>
                  <th className="px-5 py-3">Pregunta</th>
                  {MODELS.map((m) => (
                    <th key={m} className="px-3 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <ModelLogo model={m} size={14} /> {MODEL_LABEL[m]}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {prompts.map((p) => (
                  <tr key={p.id} className={cn("group transition-colors hover:bg-paper-2", !p.active && "opacity-50")}>
                    <td className="px-5 py-3 font-medium">
                      {p.prompt}
                      {!p.active && <Badge className="ml-2 px-1.5 py-0 text-[11px]">En pausa</Badge>}
                    </td>
                    {MODELS.map((m) => (
                      <td key={m} className="px-3 py-3 text-center">
                        <Mention c={latest.get(`${p.id}:${m}`)} />
                      </td>
                    ))}
                    <td className="px-5 py-2">
                      <div className={cn("flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100", actionBtn)}>
                        <ActionForm action={checkPromptNow} submitLabel="Comprobar" variant="ghost" pendingLabel="Preguntando…" inline>
                          <input type="hidden" name="id" value={p.id} />
                        </ActionForm>
                        <ActionForm action={togglePrompt} submitLabel={p.active ? "Pausar" : "Reactivar"} variant="ghost" inline>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="active" value={String(!p.active)} />
                        </ActionForm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState title="Añade tu primera pregunta" icon={<Radar className="h-5 w-5" />}>
              Piensa en cómo te buscaría un cliente que todavía no te conoce.
            </EmptyState>
          </div>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Competidores que aparecen" intro="Veces que los modelos los nombran en tus preguntas" />
          <div className="p-5">{comps.length ? <Bars data={comps.slice(0, 6)} /> : <p className="text-[13px] text-ink-3">Aún no hemos visto competidores en las respuestas.</p>}</div>
        </Card>
        <Card>
          <CardHeader title="Qué dicen de ti" intro="Fragmentos de las últimas respuestas" />
          <ul className="divide-y divide-line">
            {excerpts.map((c) => (
              <li key={c.id} className="flex gap-3 px-5 py-3.5">
                <ModelLogo model={c.model} size={18} boxed className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium">{MODEL_LABEL[c.model]}</span>
                    <Badge tone={c.mentioned ? "ok" : "neutral"} dot className="px-2 py-0 text-[11px]">
                      {c.mentioned ? `Te menciona · #${c.position}` : "No te menciona"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-3">{prompts.find((p) => p.id === c.prompt_id)?.prompt}</p>
                  <blockquote className="mt-2 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-ink-2">{c.answer_excerpt}</blockquote>
                </div>
              </li>
            ))}
            {!excerpts.length && (
              <li className="flex items-center gap-2 px-5 py-6 text-[13px] text-ink-3">
                <MessageSquareQuote className="h-4 w-4" aria-hidden /> Aún no hay respuestas guardadas.
              </li>
            )}
          </ul>
        </Card>
      </div>

      <Card className="mt-4 md:mt-5">
        <CardHeader title="Prueba una pregunta ahora" intro="Sin guardarla: útil para decidir qué preguntas merece la pena seguir." />
        <div className="p-5">
          <VisibilityTester />
        </div>
      </Card>
    </>
  );
}
