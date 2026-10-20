"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Notice, SubmitButton } from "@/components/panel/action-form";
import { CopyButton } from "@/components/panel/copy-button";
import { cn } from "@/lib/utils";
import type { RevealState } from "./actions";

/**
 * Formulario cuya acción puede devolver un secreto (clave de API, secreto de
 * webhook) que se muestra una única vez con botón de copiar.
 */
export function RevealForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Guardando…",
  secretTitle = "Tu clave",
  secretHint = "Guárdala en tus variables de entorno. Por seguridad no volveremos a mostrarla.",
  className,
}: {
  action: (prev: RevealState, fd: FormData) => Promise<RevealState>;
  children: ReactNode;
  submitLabel: ReactNode;
  pendingLabel?: string;
  secretTitle?: string;
  secretHint?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={cn("space-y-5", className)}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
        <Notice state={state} />
      </div>
      {state?.secret && (
        <div key={state.at} className="rounded-xl border border-lime bg-lime-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <KeyRound className="h-4 w-4" aria-hidden /> {secretTitle}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="block min-w-0 flex-1 select-all break-all rounded-lg bg-card px-3 py-2.5 font-mono text-[13px] text-ink">{state.secret}</code>
            <CopyButton text={state.secret} label="Copiar" variant="ink" className="shrink-0" />
          </div>
          <p className="mt-2 text-xs text-ink-2">{secretHint}</p>
        </div>
      )}
    </form>
  );
}

/** Copiar literal (CopyButton antepone el origen a textos que empiezan por "/", y los comentarios // lo harían). */
export function CopyCode({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          window.prompt("Copia este texto:", text);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-paper/80 transition hover:bg-white/10 hover:text-paper"
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      <span aria-live="polite">{copied ? "Copiado" : label}</span>
    </button>
  );
}
