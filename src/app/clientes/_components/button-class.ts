import { cn } from "@/lib/utils";

/** Clases de botón del portal (44 px de alto). Sin "use client": sirve en servidor y cliente. */
export type Variant = "primary" | "ink" | "outline" | "ghost";
export const pButton = (variant: Variant = "primary", className?: string) =>
  cn(
    "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-4.5 text-sm font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-signal text-signal-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.18),var(--shadow-xs)] hover:brightness-95",
    variant === "ink" && "bg-ink text-paper shadow-[var(--shadow-xs)] hover:bg-ink-2",
    variant === "outline" && "border border-line-2 bg-card text-ink shadow-[var(--shadow-xs)] hover:border-ink-3 hover:bg-paper-2",
    variant === "ghost" && "text-ink-2 hover:bg-paper-2 hover:text-ink",
    className,
  );

