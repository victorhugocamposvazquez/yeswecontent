"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui";
import type { ActionState, FormAction } from "@/lib/panel/action-types";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ink" | "ghost" | "outline";

export function Notice({ state, className }: { state: ActionState; className?: string }) {
  return (
    <p role="status" aria-live="polite" className={cn("min-h-5 text-sm", className)}>
      {state && (
        <span key={state.at} className={cn("inline-flex items-start gap-1.5 rounded-lg px-2.5 py-1", state.ok ? "bg-lime/60 text-ink" : "bg-bad/10 text-bad")}>
          {state.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          {state.message}
        </span>
      )}
    </p>
  );
}

export function SubmitButton({ children, variant = "primary", pendingLabel = "Un momento…", className, name, value }: { children: ReactNode; variant?: Variant; pendingLabel?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className} name={name} value={value}>
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Formulario con server action y confirmación en línea (tipo toast).
 * La acción devuelve { ok, message }; en modo demo no guarda nada y lo indica.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Guardar cambios",
  pendingLabel = "Guardando…",
  variant = "primary",
  className,
  footerClassName,
  hideSubmit = false,
  inline = false,
  onSuccess,
}: {
  action: FormAction;
  children?: ReactNode;
  submitLabel?: ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
  footerClassName?: string;
  hideSubmit?: boolean;
  inline?: boolean;
  /** Se llama tras cada respuesta correcta (p. ej. para recargar datos en un componente cliente). */
  onSuccess?: (state: NonNullable<ActionState>) => void;
}) {
  const [state, formAction] = useActionState(action, null);
  const cb = useRef(onSuccess);
  useEffect(() => {
    cb.current = onSuccess;
  });
  useEffect(() => {
    if (state?.ok) cb.current?.(state);
  }, [state]);
  return (
    <form action={formAction} className={cn(inline ? "flex flex-wrap items-center gap-2" : "space-y-5", className)}>
      {children}
      <div className={cn("flex flex-wrap items-center gap-3", footerClassName)}>
        {!hideSubmit && (
          <SubmitButton variant={variant} pendingLabel={pendingLabel}>
            {submitLabel}
          </SubmitButton>
        )}
        <Notice state={state} />
      </div>
    </form>
  );
}
