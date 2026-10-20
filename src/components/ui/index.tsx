import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

/* ───────── Botones ───────── */

type Variant = "primary" | "ink" | "ghost" | "outline" | "soft" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-signal text-signal-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.18),var(--shadow-xs)] hover:bg-signal-2 active:translate-y-px",
  ink: "bg-ink text-paper shadow-[var(--shadow-xs)] hover:bg-ink-2 active:translate-y-px",
  outline: "border border-line-2 bg-card text-ink shadow-[var(--shadow-xs)] hover:border-ink-3 hover:bg-paper-2 active:translate-y-px",
  ghost: "text-ink-2 hover:bg-paper-2 hover:text-ink",
  soft: "bg-signal-soft text-signal hover:bg-signal/15",
  danger: "bg-bad-soft text-bad hover:bg-bad/15",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-10 px-4.5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};
const base =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50";

export function Button({ variant = "primary", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, sizes[size], variants[variant], className)} {...p} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, sizes[size], variants[variant], className)} {...p} />;
}

/* ───────── Superficies ───────── */

export function Card({ className, elevated = false, ...p }: ComponentProps<"div"> & { elevated?: boolean }) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-card", elevated ? "shadow-[var(--shadow-md)]" : "shadow-[var(--shadow-xs)]", className)}
      {...p}
    />
  );
}

export function CardHeader({ title, intro, action, className }: { title: ReactNode; intro?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {intro && <p className="mt-0.5 text-[13px] text-ink-3">{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ───────── Etiquetas ───────── */

type Tone = "neutral" | "ok" | "warn" | "bad" | "signal" | "lime" | "sky" | "ink";
const tones: Record<Tone, string> = {
  neutral: "bg-paper-2 text-ink-2 ring-1 ring-inset ring-line",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  signal: "bg-signal-soft text-signal",
  lime: "bg-lime-soft text-ink",
  sky: "bg-sky-soft text-ink",
  ink: "bg-ink text-paper",
};
export function Badge({ tone = "neutral", dot = false, className, children, ...p }: ComponentProps<"span"> & { tone?: Tone; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5", tones[tone], className)} {...p}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/* ───────── Formularios ───────── */

const control =
  "w-full rounded-[10px] border border-line-2 bg-card px-3.5 text-sm text-ink shadow-[var(--shadow-xs)] outline-none transition placeholder:text-ink-3 hover:border-ink-3 focus:border-signal focus:shadow-[var(--ring)] disabled:bg-paper-2 disabled:text-ink-3";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...p} />;
}

export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 py-2.5 leading-relaxed", className)} {...p} />;
}

export function Select({ className, ...p }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        control,
        "h-10 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a8a85%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      {...p}
    />
  );
}

export function Label({ className, ...p }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-ink-2", className)} {...p} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

/* ───────── Marca ───────── */

/** Logotipo propio: "yes!" en una burbuja de diálogo + wordmark "yeswecontent!". */
export function Logo({ className, inverted = false, compact = false }: { className?: string; inverted?: boolean; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 40 32" className="h-9 w-auto sm:h-10" aria-hidden>
        <path
          d="M4 2h32a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H16l-8 6v-6H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
          fill="var(--signal)"
          stroke={inverted ? "var(--paper)" : "var(--ink)"}
          strokeWidth="2"
        />
        <text x="20" y="18.6" textAnchor="middle" fontSize="15" letterSpacing="-0.4" fontWeight="800" fill="#fff" fontFamily="var(--font-body)">
          yes<tspan dx="0.5" fontFamily="var(--font-serif), Georgia, serif" fontStyle="italic" fontWeight="400" fontSize="17">!</tspan>
        </text>
      </svg>
      {!compact && (
        <span className={cn("whitespace-nowrap text-[22px] leading-none sm:text-2xl", inverted ? "text-paper" : "text-ink")}>
          yeswe<span className="font-logo text-[25px] sm:text-[27px]">content!</span>
        </span>
      )}
    </span>
  );
}

/* ───────── Encabezados ───────── */

export function Eyebrow({ className, ...p }: ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...p} />;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow className={cn("mb-4", align === "center" && "justify-center")}>{eyebrow}</Eyebrow>}
      <h2 className="font-display text-[2rem] md:text-[2.75rem]">{title}</h2>
      {intro && <p className="text-pretty mt-4 text-lg leading-relaxed text-ink-2">{intro}</p>}
    </div>
  );
}

export function PageHeader({ title, intro, actions, crumbs }: { title: string; intro?: ReactNode; actions?: ReactNode; crumbs?: ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      {crumbs && <div className="mb-2 text-[13px] text-ink-3">{crumbs}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.65rem] font-semibold tracking-tight md:text-[1.9rem]">{title}</h1>
          {intro && <p className="mt-1 max-w-2xl text-sm text-ink-2">{intro}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ───────── Datos ───────── */

export function Stat({
  label,
  value,
  delta,
  trend,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const tone = trend === "down" ? "bad" : trend === "flat" ? "neutral" : "ok";
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-3">{label}</p>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <p className="tabular mt-2 text-[1.75rem] font-semibold leading-none tracking-tight">{value}</p>
      {(delta || hint) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {delta && (
            <Badge tone={tone} className="px-2">
              {delta}
            </Badge>
          )}
          {hint && <span className="text-xs text-ink-3">{hint}</span>}
        </div>
      )}
    </Card>
  );
}

export function EmptyState({ title, icon, action, children }: { title: string; icon?: ReactNode; action?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && <span className="grid h-12 w-12 place-items-center rounded-2xl bg-paper-2 text-ink-2">{icon}</span>}
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      {children && <div className="max-w-md text-sm leading-relaxed text-ink-2">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-line", className)} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-md border border-line-2 bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{children}</kbd>;
}
