"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/admin/types";

type Action = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/**
 * Formulario conectado a una server action con aviso accesible del resultado.
 * `confirm` pide confirmación antes de enviar (acciones destructivas).
 */
export function ActionForm({
  action,
  children,
  className,
  confirm,
  inline = false,
  id,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  confirm?: string;
  inline?: boolean;
  /** Permite que controles fuera del formulario lo referencien con `form={id}`. */
  id?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      id={id}
      action={formAction}
      className={cn(inline && "inline-flex flex-wrap items-center gap-2", className)}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <p role="status" aria-live="polite" className={cn("text-xs", !state && "sr-only", state?.ok ? "text-ok" : "text-bad", !inline && state && "mt-2")}>
        {state?.message ?? ""}
      </p>
    </form>
  );
}

type Variant = "primary" | "ink" | "outline" | "ghost" | "soft" | "danger";

/**
 * Botón de envío que se deshabilita mientras la acción está en curso.
 * Usa el `Button` compartido; `size="icon"` es un botón fantasma cuadrado para acciones de fila
 * (32px en escritorio, 44px en móvil) y requiere `aria-label`.
 */
export function SubmitButton({
  children,
  variant = "ink",
  size = "md",
  className,
  name,
  value,
  title,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "icon";
  className?: string;
  name?: string;
  value?: string;
  title?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  if (size === "icon")
    return (
      <button
        type="submit"
        name={name}
        value={value}
        aria-label={ariaLabel}
        title={title ?? ariaLabel}
        disabled={pending}
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-50 sm:size-8",
          variant === "danger" ? "text-ink-3 hover:bg-bad-soft hover:text-bad" : "text-ink-3 hover:bg-paper-2 hover:text-ink",
          className,
        )}
      >
        {pending ? <span className="text-xs">…</span> : children}
      </button>
    );
  return (
    <Button
      type="submit"
      name={name}
      value={value}
      aria-label={ariaLabel}
      title={title}
      disabled={pending}
      variant={variant}
      size={size}
      className={cn(size === "sm" && "min-h-11 sm:min-h-0", className)}
    >
      {pending ? "…" : children}
    </Button>
  );
}
