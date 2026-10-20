import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ink" | "ghost" | "outline";
const variants: Record<Variant, string> = {
  primary: "bg-signal text-signal-ink hover:brightness-95 shadow-sm",
  ink: "bg-ink text-paper hover:bg-ink-2",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-paper-2",
};
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...p} />;
}

export function ButtonLink({ variant = "primary", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...p} />;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-card", className)} {...p} />;
}

type Tone = "neutral" | "ok" | "warn" | "bad" | "signal" | "lime" | "sky";
const tones: Record<Tone, string> = {
  neutral: "bg-paper-2 text-ink-2",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/15 text-warn",
  bad: "bg-bad/12 text-bad",
  signal: "bg-signal/12 text-signal",
  lime: "bg-lime text-ink",
  sky: "bg-sky/50 text-ink",
};
export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)} {...p} />;
}

export function Input({ className, ...p }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-3 focus:border-ink focus:ring-2 focus:ring-lime",
        className,
      )}
      {...p}
    />
  );
}

export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-3 focus:border-ink focus:ring-2 focus:ring-lime",
        className,
      )}
      {...p}
    />
  );
}

export function Select({ className, ...p }: ComponentProps<"select">) {
  return (
    <select
      className={cn("w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-lime", className)}
      {...p}
    />
  );
}

export function Label({ className, ...p }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink-2", className)} {...p} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

/** Logotipo propio: "yes" en una burbuja de diálogo + wordmark. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 40 32" className="h-7 w-auto" aria-hidden>
        <path d="M4 2h32a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H16l-8 6v-6H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" fill="var(--signal)" stroke="var(--ink)" strokeWidth="2" />
        <text x="20" y="17" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="var(--font-body)">yes</text>
      </svg>
      <span className={cn("text-lg", inverted ? "text-paper" : "text-ink")}>
        yeswe<span className="font-logo text-xl">content</span>
      </span>
    </span>
  );
}

export function SectionHeading({ eyebrow, title, intro, className }: { eyebrow?: string; title: ReactNode; intro?: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <p className="mb-3 text-sm font-semibold text-signal">{eyebrow}</p>}
      <h2 className="font-display text-3xl leading-[1.1] md:text-[2.75rem]">{title}</h2>
      {intro && <p className="mt-4 text-lg text-ink-2">{intro}</p>}
    </div>
  );
}

export function PageHeader({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-sm text-ink-2">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, delta, className }: { label: string; value: ReactNode; delta?: string; className?: string }) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <p className="text-[13px] text-ink-3">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {delta && <p className="mt-1 text-xs font-medium text-ok">{delta}</p>}
    </Card>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="grain flex flex-col items-center gap-2 p-10 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="max-w-md text-sm text-ink-2">{children}</div>}
    </Card>
  );
}
