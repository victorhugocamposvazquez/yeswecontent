"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
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
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  confirm?: string;
  inline?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
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

type Variant = "primary" | "ink" | "outline" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-signal text-signal-ink hover:brightness-95",
  ink: "bg-ink text-paper hover:bg-ink-2",
  outline: "border border-line bg-card text-ink hover:border-ink",
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-ink",
  danger: "border border-bad/40 text-bad hover:bg-bad hover:text-white",
};

/** Botón de envío compacto que se deshabilita mientras la acción está en curso. */
export function SubmitButton({
  children,
  variant = "ink",
  size = "md",
  className,
  name,
  value,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  name?: string;
  value?: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      aria-label={ariaLabel}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
        variants[variant],
        className,
      )}
    >
      {pending ? "…" : children}
    </button>
  );
}
