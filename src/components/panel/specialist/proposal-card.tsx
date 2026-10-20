"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CalendarPlus, Check, CircleAlert, LoaderCircle, Radar, Wrench } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { ActionState } from "@/lib/panel/action-types";
import type { Proposal } from "@/lib/panel/specialist-types";
import { cn } from "@/lib/utils";

const META = {
  content_topic: { icon: CalendarPlus, label: "Plan de contenidos", cta: "Añadir al plan", href: "/panel/plan", hrefLabel: "Ver plan" },
  tracked_prompt: { icon: Radar, label: "Visibilidad IA", cta: "Seguir pregunta", href: "/panel/visibilidad-ia", hrefLabel: "Ver visibilidad" },
  audit_fix: { icon: Wrench, label: "Auditoría", cta: "Abrir tarea", href: "/panel/auditoria", hrefLabel: "Ver auditoría" },
} as const;

const INTENT: Record<string, string> = { informational: "informativa", commercial: "comercial", transactional: "transaccional", navigational: "navegacional" };

function confirmText(p: Proposal) {
  if (p.kind === "content_topic") return p.data.kind === "refresh" ? "¿Añadimos esta actualización a tu plan de contenidos?" : "¿Añadimos este tema a tu plan de contenidos?";
  if (p.kind === "tracked_prompt") return "¿Empezamos a seguir esta pregunta en ChatGPT, Claude, Gemini y Perplexity?";
  return "¿Abrimos esta tarea en tu auditoría?";
}

export function ProposalCard({
  proposal,
  disabled,
  onApply,
  onDismiss,
}: {
  proposal: Proposal;
  disabled?: boolean;
  onApply: (p: Proposal) => Promise<ActionState>;
  onDismiss: (p: Proposal) => Promise<ActionState>;
}) {
  const meta = META[proposal.kind];
  const Icon = meta.icon;
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ActionState>(null);
  const [pending, start] = useTransition();
  const done = proposal.status !== "pending";

  const title = proposal.kind === "tracked_prompt" ? `«${proposal.data.prompt}»` : proposal.data.title;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3.5 sm:p-4",
        proposal.status === "applied" ? "border-ok/40" : proposal.status === "dismissed" ? "border-line opacity-60" : "border-line",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", proposal.status === "applied" ? "bg-ok/12 text-ok" : "bg-paper-2 text-ink-2")} aria-hidden>
          {proposal.status === "applied" ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-3">{meta.label}</span>
            {proposal.kind === "content_topic" && <Badge tone={proposal.data.kind === "refresh" ? "sky" : "lime"}>{proposal.data.kind === "refresh" ? "Actualización" : "Nuevo"}</Badge>}
            {proposal.kind === "audit_fix" && <Badge tone={proposal.data.priority === "alta" ? "bad" : proposal.data.priority === "media" ? "warn" : "neutral"}>Prioridad {proposal.data.priority}</Badge>}
            {proposal.status === "applied" && <Badge tone="ok">Hecho</Badge>}
            {proposal.status === "dismissed" && <Badge>Descartada</Badge>}
          </div>
          <p className="mt-1 break-words text-sm font-semibold leading-snug">{title}</p>
          {proposal.data.reason && <p className="mt-1 text-sm text-ink-2">{proposal.data.reason}</p>}
          {proposal.kind === "content_topic" && (
            <p className="mt-1.5 text-xs text-ink-3">
              Palabra clave: <span className="font-medium text-ink-2">{proposal.data.keyword}</span>
              {proposal.data.intent ? ` · intención ${INTENT[proposal.data.intent] ?? proposal.data.intent}` : ""}
              {proposal.data.cluster ? ` · ${proposal.data.cluster}` : ""}
            </p>
          )}
          {proposal.kind === "audit_fix" && proposal.data.steps.length > 0 && (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-2">
              {proposal.data.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {!done && !confirming && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="ink" className="min-h-11 flex-1 px-4 sm:flex-none" disabled={disabled} onClick={() => setConfirming(true)}>
            {meta.cta}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-4"
            disabled={disabled || pending}
            onClick={() => start(async () => setResult(await onDismiss(proposal)))}
          >
            Descartar
          </Button>
        </div>
      )}

      {!done && confirming && (
        <div className="mt-3 rounded-lg bg-paper-2 p-3" role="group" aria-label="Confirmar propuesta">
          <p className="text-sm font-medium">{confirmText(proposal)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              className="min-h-11 flex-1 px-4 sm:flex-none"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await onApply(proposal);
                  setResult(r);
                  if (!r?.ok) setConfirming(false);
                })
              }
            >
              {pending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Aplicando…
                </>
              ) : (
                "Sí, confirmar"
              )}
            </Button>
            <Button type="button" variant="ghost" className="min-h-11 px-4" disabled={pending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div role="status" aria-live="polite">
        {result && (
          <p className={cn("mt-3 flex items-start gap-1.5 text-sm", result.ok ? "text-ink-2" : "text-bad")}>
            {result.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            <span>{result.message}</span>
          </p>
        )}
      </div>
      {proposal.status === "applied" && (
        <Link href={meta.href} className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-signal underline-offset-2 hover:underline">
          {meta.hrefLabel} →
        </Link>
      )}
    </div>
  );
}
