import Link from "next/link";
import Image from "next/image";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { ArrowRight, Bot, CalendarDays, Link2, Minus, Network, PenLine, Plus, ScanSearch, Send, Share2, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui";
import type { ProductIcon } from "@/lib/marketing/products";

/* ───────── Layout ───────── */

/** Contenedor de 1200 px de la web pública. */
export function Container({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8", className)} {...p} />;
}

/** Banda de sección: ritmo vertical de 56–72 px en móvil y 96–128 px en escritorio. */
export function Section({ className, children, id, tone = "paper" }: { className?: string; children: ReactNode; id?: string; tone?: "paper" | "paper-2" | "ink" }) {
  return (
    <section
      id={id}
      className={cn(
        "py-14 sm:py-16 md:py-24 lg:py-28",
        tone === "paper-2" && "border-y border-line bg-paper-2",
        tone === "ink" && "bg-ink text-paper",
        className,
      )}
    >
      {children}
    </section>
  );
}

/* ───────── Tipografía ───────── */

/** Etiqueta sobre un titular. En fondos oscuros, tono "paper" (lima). */
export function Eyebrow({ children, className, tone = "signal" }: { children: ReactNode; className?: string; tone?: "signal" | "ink" | "paper" }) {
  const style: CSSProperties | undefined = tone === "paper" ? { color: "var(--lime)" } : tone === "ink" ? { color: "var(--ink-2)" } : undefined;
  return (
    <p className={cn("eyebrow", className)} style={style}>
      {children}
    </p>
  );
}

export function Title({ as: Tag = "h2", className, children, size = "md" }: { as?: "h1" | "h2" | "h3"; className?: string; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <Tag
      className={cn(
        "font-display",
        size === "lg" && "text-[clamp(2.125rem,5.5vw,4.25rem)]",
        size === "md" && "text-[clamp(1.875rem,4vw,2.875rem)]",
        size === "sm" && "text-[clamp(1.5rem,2.6vw,2.125rem)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Lead({ className, ...p }: ComponentProps<"p">) {
  return <p className={cn("text-pretty text-base leading-relaxed text-ink-2 sm:text-lg", className)} {...p} />;
}

/* ───────── Acciones ───────── */

/** CTA de la web pública: envoltorio sobre ButtonLink con flecha opcional. */
export function CtaLink({
  className,
  tone = "signal",
  size = "md",
  children,
  arrow = true,
  ...p
}: ComponentProps<typeof Link> & { tone?: "signal" | "paper" | "ink" | "lime"; size?: "md" | "lg"; arrow?: boolean }) {
  const variant = tone === "signal" ? "primary" : tone === "ink" ? "ink" : "outline";
  return (
    <ButtonLink
      variant={variant}
      size={size}
      className={cn("group", tone === "lime" && "border-0 bg-lime text-ink shadow-[var(--shadow-xs)] hover:bg-lime hover:brightness-95", className)}
      {...p}
    >
      {children}
      {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />}
    </ButtonLink>
  );
}

export function TextLink({ className, children, ...p }: ComponentProps<typeof Link>) {
  return (
    <Link className={cn("group inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink transition-colors duration-150 hover:text-signal sm:min-h-0", className)} {...p}>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

/* ───────── Superficies ───────── */

/** Icono en cuadrado de 40 px con fondo signal-soft. */
export function IconBox({ children, className, tone = "signal" }: { children: ReactNode; className?: string; tone?: "signal" | "lime" | "sky" | "ink" | "paper" }) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]",
        tone === "signal" && "bg-signal-soft text-signal",
        tone === "lime" && "bg-lime-soft text-ink",
        tone === "sky" && "bg-sky-soft text-ink",
        tone === "ink" && "bg-ink text-paper",
        tone === "paper" && "bg-paper-2 text-ink-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tarjeta interactiva: borde fino, sombra xs y elevación al pasar el ratón. */
export function HoverCard({ className, prefetch = false, ...p }: ComponentProps<typeof Link> & { prefetch?: boolean }) {
  return (
    <Link
      prefetch={prefetch}
      className={cn(
        "group block rounded-2xl border border-line bg-card shadow-[var(--shadow-xs)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
      {...p}
    />
  );
}

/** Ventana de producto (.window) con barra superior y título opcional. */
export function Window({ title, className, children, bar = true, right }: { title?: ReactNode; className?: string; children: ReactNode; bar?: boolean; right?: ReactNode }) {
  return (
    <div className={cn("window text-ink", className)}>
      {bar && (
        <div className="window-bar">
          <i aria-hidden />
          <i aria-hidden />
          <i aria-hidden />
          {title && <span className="ml-2 truncate font-mono text-[11px] text-ink-3">{title}</span>}
          {right && <span className="ml-auto">{right}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ───────── FAQ ───────── */

export function Faq({ items, className }: { items: { q: string; a: ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line rounded-2xl border border-line bg-card shadow-[var(--shadow-xs)]", className)}>
      {items.map((it) => (
        <details key={it.q} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-[15px] font-semibold tracking-tight sm:text-base [&::-webkit-details-marker]:hidden">
            <span>{it.q}</span>
            <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper-2 text-ink-2 transition-colors duration-150 group-open:bg-signal-soft group-open:text-signal">
              <Plus className="h-4 w-4 group-open:hidden" />
              <Minus className="hidden h-4 w-4 group-open:block" />
            </span>
          </summary>
          <div className="max-w-3xl pb-5 text-[15px] leading-relaxed text-ink-2">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

/* ───────── CTA final ───────── */

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
    <Section className="pt-0 sm:pt-0 md:pt-0 lg:pt-0">
      <Container>
        <div className="glow relative overflow-hidden rounded-3xl border border-line bg-paper-2 px-6 py-14 text-center shadow-[var(--shadow-md)] sm:px-12 md:py-20">
          <div className="relative mx-auto max-w-3xl">
            <h2 className="font-display text-[clamp(1.875rem,4.4vw,3.25rem)] text-ink">{title}</h2>
            {text && <p className="text-pretty mx-auto mt-5 max-w-xl text-base text-ink-2 sm:text-lg">{text}</p>}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <CtaLink href={href} size="lg">
                {cta}
              </CtaLink>
              {secondary && (
                <Link href={secondary.href} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-ink-2 transition-colors duration-150 hover:text-ink">
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

/* ───────── Iconos de producto ───────── */

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

/* ───────── Logotipos oficiales de motores (a color) ───────── */

const engineLogos: Record<string, string> = {
  Google: "/logos/color/google.svg",
  ChatGPT: "/logos/color/chatgpt.svg",
  Gemini: "/logos/color/gemini.svg",
  Perplexity: "/logos/color/perplexity.svg",
  Claude: "/logos/color/claude.svg",
  Reddit: "/logos/color/reddit.svg",
  Quora: "/logos/color/quora.svg",
};

/** Logotipo oficial a color de un motor o plataforma. Marcas de sus respectivos titulares (nota en el pie). */
export function EngineLogo({ name, size = 20, className, alt }: { name: string; size?: number; className?: string; alt?: string }) {
  const src = engineLogos[name];
  if (!src) return null;
  return <Image src={src} alt={alt ?? `Logotipo de ${name}`} width={size} height={size} className={cn("shrink-0 select-none", className)} draggable={false} />;
}

/* ───────── Ficha de ejemplo (compatibilidad con products.sample) ───────── */

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
    <Window title="yeswecontent" className={className}>
      <div className="p-5 sm:p-6">
        <p className="text-lg font-semibold tracking-tight">{heading}</p>
        <dl className="mt-4 divide-y divide-line">
          {rows.map((r) => (
            <div key={r.k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-ink-2">{r.k}</dt>
              <dd
                className={cn(
                  "tabular rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  r.tone === "ok" && "bg-ok-soft text-ok",
                  r.tone === "warn" && "bg-warn-soft text-warn",
                  r.tone === "signal" && "bg-signal-soft text-signal",
                  !r.tone && "bg-paper-2 text-ink",
                )}
              >
                {r.v}
              </dd>
            </div>
          ))}
        </dl>
        {note && <p className="mt-4 text-xs text-ink-3">{note}</p>}
      </div>
    </Window>
  );
}
