import { cn } from "@/lib/utils";

/** Clases de botón del portal (44 px de alto). Sin "use client": sirve en servidor y cliente. */
export type Variant = "primary" | "ink" | "outline" | "ghost";
export const pButton = (variant: Variant = "primary", className?: string) =>
  cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" && "bg-signal text-signal-ink shadow-sm hover:brightness-95",
    variant === "ink" && "bg-ink text-paper hover:bg-ink-2",
    variant === "outline" && "border border-line bg-card text-ink hover:border-ink",
    variant === "ghost" && "text-ink hover:bg-paper-2",
    className,
  );

