import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight, Bot, CalendarDays, Link2, Network, PenLine, ScanSearch, Send, Share2, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductIcon } from "@/lib/marketing/products";

export function Container({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...p} />;
}

export function Eyebrow({ children, className, tone = "signal" }: { children: ReactNode; className?: string; tone?: "signal" | "ink" | "paper" }) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.22em]",
        tone === "signal" && "text-signal",
        tone === "ink" && "text-ink-2",
        tone === "paper" && "text-lime",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** CTA grueso con sombra desplazada, propio de la web pública. */
export function CtaLink({
  className,
  tone = "signal",
  size = "md",
  children,
  arrow = true,
  ...p
}: ComponentProps<typeof Link> & { tone?: "signal" | "paper" | "ink" | "lime"; size?: "md" | "lg"; arrow?: boolean }) {
  return (
    <Link
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition",
        size === "md" ? "px-5 py-2.5 text-sm" : "px-6 py-3 text-base",
        tone === "signal" && "bg-signal text-signal-ink shadow-sm hover:brightness-95",
        tone === "paper" && "border border-line bg-card text-ink hover:border-ink-3",
        tone === "ink" && "bg-ink text-paper hover:bg-ink-2",
        tone === "lime" && "bg-lime text-ink hover:brightness-95",
        className,
      )}
      {...p}
    >
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </Link>
  );
}

export function Section({ className, children, id }: { className?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className={cn("py-20 md:py-28", className)}>
      {children}
    </section>
  );
}

export function Title({ as: Tag = "h2", className, children }: { as?: "h1" | "h2" | "h3"; className?: string; children: ReactNode }) {
  return <Tag className={cn("font-display text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-5xl", className)}>{children}</Tag>;
}

export function Faq({ items, className }: { items: { q: string; a: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it) => (
        <details key={it.q} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            <span>{it.q}</span>
            <span
              aria-hidden
              className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line font-mono text-sm transition-transform group-open:rotate-45 group-open:bg-lime"
            >
              +
            </span>
          </summary>
          <div className="-mt-2 max-w-3xl pb-5 text-ink-2 leading-relaxed">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({
  title,
  text,
  cta = "Empieza tu prueba de 3 días",
  href = "/registro",
  secondary,
}: {
  title: ReactNode;
  text?: ReactNode;
  cta?: string;
  href?: string;
  secondary?: { label: string; href: string };
}) {
  return (
    <Section className="pt-0 md:pt-0">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-14 text-center text-paper sm:px-12 md:py-20">
          <div className="relative mx-auto max-w-3xl">
            <h2 className="font-display text-3xl leading-[1.1] sm:text-4xl md:text-5xl">{title}</h2>
            {text && <p className="mx-auto mt-5 max-w-xl text-lg text-paper/75">{text}</p>}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <CtaLink href={href} size="lg">
                {cta}
              </CtaLink>
              {secondary && (
                <Link href={secondary.href} className="font-semibold text-paper/80 underline underline-offset-4 hover:text-paper">
                  {secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

const productIcons: Record<ProductIcon, LucideIcon> = {
  bot: Bot,
  pen: PenLine,
  calendar: CalendarDays,
  send: Send,
  link: Link2,
  network: Network,
  sparkles: Sparkles,
  scan: ScanSearch,
  share: Share2,
  bag: ShoppingBag,
};

export function ProductGlyph({ icon, className }: { icon: ProductIcon; className?: string }) {
  const I = productIcons[icon];
  return <I className={className} aria-hidden />;
}

export function Ticket({
  heading,
  rows,
  note,
  className,
}: {
  heading: string;
  rows: { k: string; v: string; tone?: "ok" | "warn" | "signal" }[];
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-card p-5 shadow-[0_12px_32px_-16px_rgba(21,19,15,0.22)]", className)}>
      <div className="flex items-center justify-between border-b border-dashed border-line pb-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">yeswecontent</p>
        <span className="flex gap-1" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime" />
          <span className="h-2.5 w-2.5 rounded-full bg-sky" />
        </span>
      </div>
      <p className="mt-4 font-display text-2xl leading-tight">{heading}</p>
      <dl className="mt-4 divide-y divide-line">
        {rows.map((r) => (
          <div key={r.k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <dt className="text-ink-2">{r.k}</dt>
            <dd
              className={cn(
                "rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold",
                r.tone === "ok" && "bg-ok/12 text-ok",
                r.tone === "warn" && "bg-warn/15 text-warn",
                r.tone === "signal" && "bg-lime text-ink",
                !r.tone && "bg-paper-2 text-ink",
              )}
            >
              {r.v}
            </dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{note}</p>}
    </div>
  );
}
