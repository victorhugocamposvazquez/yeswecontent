import { Check, Minus } from "lucide-react";
import { AreaChart, Bars } from "@/components/charts";
import { ActionForm } from "@/components/panel/action-form";
import { VisibilityTester } from "@/components/panel/visibility-tester";
import { Badge, Card, EmptyState, Input, PageHeader, Stat } from "@/components/ui";
import { getCurrentSite, getSubscription, getVisibility, listPlans } from "@/lib/data";
import { getVisibilityHistory } from "@/lib/panel/data";
import { MODELS, MODEL_LABEL, competitorCounts, latestByPromptModel, overallShare, shareByModel } from "@/lib/panel/visibility";
import { fmtDate } from "@/lib/utils";
import { addPrompt, checkPromptNow, togglePrompt } from "../actions";

export const metadata = { title: "Visibilidad IA" };

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

  return (
    <>
      <PageHeader
        title="Visibilidad en IA"
        intro="Cada mañana preguntamos a ChatGPT, Claude, Gemini y Perplexity lo que preguntarían tus clientes, y anotamos si te recomiendan."
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Cuota de voz" value={`${share}%`} delta={history.length > 1 ? `+${history[history.length - 1].share - history[0].share} pts en 12 semanas` : undefined} />
        <Stat label="Posición media" value={avgPos} />
        <Stat label="Preguntas seguidas" value={`${prompts.length}/${limit}`} />
        <Stat label="Última revisión" value={lastCheck ? fmtDate(lastCheck) : "—"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold">Evolución de tu cuota de voz</h2>
          <p className="mb-4 text-sm text-ink-3">% de respuestas que te mencionan, por semana</p>
          {history.length ? (
            <>
              <AreaChart data={history.map((h) => h.share)} color="var(--ink)" />
              <div className="mt-2 flex justify-between text-xs text-ink-3">
                {history.filter((_, i) => i % 3 === 0).map((h) => (
                  <span key={h.week}>{h.week}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-3">El histórico aparecerá tras la primera semana de seguimiento.</p>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Por modelo</h2>
          <ul className="space-y-4">
            {byModel.map((m) => (
              <li key={m.model}>
                <div className="flex justify-between text-sm">
                  <span>{m.label}</span>
                  <span className="font-semibold tabular-nums">{m.share}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-2">
                  <div className="h-full rounded-full bg-signal" style={{ width: `${m.share}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-ink-3">
                  {m.hits} de {m.total} preguntas
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line p-5">
          <div>
            <h2 className="font-semibold">Preguntas que seguimos</h2>
            <p className="text-sm text-ink-3">✓ te menciona (con su posición) · — no aparece</p>
          </div>
          <ActionForm action={addPrompt} submitLabel="Añadir pregunta" variant="ink" inline className="w-full md:w-auto">
            <label htmlFor="new-prompt" className="sr-only">
              Nueva pregunta
            </label>
            <Input id="new-prompt" name="prompt" placeholder="¿Dónde comprar…?" className="md:w-80" required disabled={prompts.length >= limit} />
          </ActionForm>
        </div>
        {prompts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                <tr>
                  <th className="px-5 py-3 font-medium">Pregunta</th>
                  {MODELS.map((m) => (
                    <th key={m} className="px-3 py-3 text-center font-medium">
                      {MODEL_LABEL[m]}
                    </th>
                  ))}
                  <th className="px-5 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {prompts.map((p) => (
                  <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                    <td className="px-5 py-3 font-medium">{p.prompt}</td>
                    {MODELS.map((m) => {
                      const c = latest.get(`${p.id}:${m}`);
                      return (
                        <td key={m} className="px-3 py-3 text-center">
                          {!c ? (
                            <span className="text-xs text-ink-3">pendiente</span>
                          ) : c.mentioned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ok/12 px-2 py-0.5 text-xs font-semibold text-ok" title={c.answer_excerpt ?? undefined}>
                              <Check className="h-3.5 w-3.5" aria-hidden /> #{c.position}
                              <span className="sr-only">Mencionado en posición {c.position}</span>
                            </span>
                          ) : (
                            <span className="inline-flex text-ink-3" title={c.answer_excerpt ?? undefined}>
                              <Minus className="h-4 w-4" aria-hidden />
                              <span className="sr-only">No mencionado</span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
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
          <div className="p-6">
            <EmptyState title="Añade tu primera pregunta">Piensa en cómo te buscaría un cliente que todavía no te conoce.</EmptyState>
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Competidores que aparecen</h2>
          <p className="mb-4 text-sm text-ink-3">Veces que los modelos los nombran en tus preguntas</p>
          {comps.length ? <Bars data={comps.slice(0, 6)} /> : <p className="text-sm text-ink-3">Aún no hemos visto competidores en las respuestas.</p>}
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold">Qué dicen de ti</h2>
          <p className="mb-4 text-sm text-ink-3">Fragmentos de las últimas respuestas</p>
          <ul className="space-y-3">
            {excerpts.map((c) => (
              <li key={c.id} className="rounded-xl border border-line bg-paper p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge tone={c.mentioned ? "ok" : "neutral"}>{MODEL_LABEL[c.model]}</Badge>
                  <span className="truncate text-xs text-ink-3">{prompts.find((p) => p.id === c.prompt_id)?.prompt}</span>
                </div>
                <blockquote className="text-sm italic text-ink-2">{c.answer_excerpt}</blockquote>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Prueba una pregunta ahora</h2>
        <p className="mb-4 text-sm text-ink-3">Sin guardarla: útil para decidir qué preguntas merece la pena seguir.</p>
        <VisibilityTester />
      </Card>
    </>
  );
}
