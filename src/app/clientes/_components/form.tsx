"use client";

/**
 * Controles de formulario pensados para móvil: 44 px de alto mínimo y texto de
 * 16 px (evita el zoom automático de iOS al enfocar). Los usa también /agencia.
 */
import { useActionState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Notice } from "@/components/panel/action-form";
import type { FormAction } from "@/lib/panel/action-types";
import { cn } from "@/lib/utils";
import { pButton, type Variant } from "./button-class";

const field =
  "block w-full min-h-11 rounded-[10px] border border-line-2 bg-card px-3.5 py-2.5 text-base text-ink shadow-[var(--shadow-xs)] outline-none transition placeholder:text-ink-3 hover:border-ink-3 focus:border-signal focus:shadow-[var(--ring)] disabled:bg-paper-2 disabled:text-ink-3 sm:min-h-10 sm:text-sm";

export function PInput({ className, ...p }: ComponentProps<"input">) {
  return <input className={cn(field, className)} {...p} />;
}
export function PTextarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "leading-relaxed", className)} {...p} />;
}
export function PSelect({ className, ...p }: ComponentProps<"select">) {
  return <select className={cn(field, "pr-9", className)} {...p} />;
}

export function PField({ label, hint, htmlFor, children }: { label: string; hint?: ReactNode; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function PSubmit({ children, variant = "primary", pendingLabel = "Un momento…", className, name, value }: { children: ReactNode; variant?: Variant; pendingLabel?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={pButton(variant, className)} name={name} value={value}>
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Formulario con server action y confirmación en línea. */
export function PForm({
  action,
  children,
  submitLabel = "Guardar cambios",
  pendingLabel = "Guardando…",
  variant = "primary",
  className,
  submitClassName,
  resetOnSuccess = false,
}: {
  action: FormAction;
  children?: ReactNode;
  submitLabel?: ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
  submitClassName?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      key={resetOnSuccess && state?.ok ? state.at : undefined}
      className={cn("space-y-5", className)}
    >
      {children}
      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap sm:items-center">
        <PSubmit variant={variant} pendingLabel={pendingLabel} className={cn("w-full sm:w-auto", submitClassName)}>
          {submitLabel}
        </PSubmit>
        <Notice state={state} />
      </div>
    </form>
  );
}
