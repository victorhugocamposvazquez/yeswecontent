import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Badge, Button, ButtonLink, Card, CardHeader } from "@/components/ui";
import { cn, num } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

/* ───────── Tabla ───────── */

/**
 * Tabla densa de consola: 13px, cabecera pegajosa, filas con línea fina y scroll horizontal en móvil.
 * `count`/`total` pintan el pie con recuento y paginación (stub: una sola página).
 */
export function DataTable({
  caption,
  children,
  className,
  footer,
  count,
  total,
  unit = "filas",
  minWidth = "min-w-[720px]",
  title,
  intro,
  action,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  count?: number;
  total?: number;
  unit?: string;
  minWidth?: string;
  title?: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
}) {
  const showFooter = footer !== undefined || count !== undefined;
  return (
    <Card className={cn("overflow-hidden", className)}>
      {title && <CardHeader title={title} intro={intro} action={action} className="px-4 py-3" />}
      <div className="scroll-x">
        <table className={cn("w-full border-collapse text-[13px]", minWidth)}>
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-paper-2/40 px-4 py-2 text-xs text-ink-3">
          <div className="min-w-0">
            {count !== undefined && (
              <span className="tabular">
                {total !== undefined && total !== count ? (
                  <>
                    <strong className="font-medium text-ink-2">{num(count)}</strong> de {num(total)} {unit}
                  </>
                ) : (
                  <>
                    <strong className="font-medium text-ink-2">{num(count)}</strong> {unit}
                  </>
                )}
              </span>
            )}
            {footer && <span className={cn(count !== undefined && "ml-2 before:mr-2 before:content-['·']")}>{footer}</span>}
          </div>
          {count !== undefined && (
            <div className="flex items-center gap-1" aria-label="Paginación">
              <span className="tabular mr-1">
                1–{num(count)} de {num(total ?? count)}
              </span>
              <button type="button" disabled aria-label="Página anterior" className="grid size-11 place-items-center rounded-md text-ink-3 disabled:opacity-40 sm:size-8">
                <ChevronLeft className="size-3.5" aria-hidden />
              </button>
              <button type="button" disabled aria-label="Página siguiente" className="grid size-11 place-items-center rounded-md text-ink-3 disabled:opacity-40 sm:size-8">
                <ChevronRight className="size-3.5" aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-[1] bg-card text-left text-[11px] uppercase tracking-[0.06em] text-ink-3 shadow-[inset_0_-1px_0_var(--line)]">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ className, numeric = false, ...p }: ComponentProps<"th"> & { numeric?: boolean }) {
  return <th scope="col" className={cn("h-9 whitespace-nowrap px-3 font-medium first:pl-4 last:pr-4", numeric && "text-right", className)} {...p} />;
}

export function Tr({ className, tone, ...p }: ComponentProps<"tr"> & { tone?: "bad" | "warn" }) {
  return (
    <tr
      className={cn(
        "border-t border-line transition-colors first:border-t-0",
        tone === "bad" ? "bg-bad-soft/60 hover:bg-bad-soft" : tone === "warn" ? "bg-warn-soft/60 hover:bg-warn-soft" : "hover:bg-paper-2/70",
        className,
      )}
      {...p}
    />
  );
}

export function Td({ className, numeric = false, muted = false, ...p }: ComponentProps<"td"> & { numeric?: boolean; muted?: boolean }) {
  return (
    <td
      className={cn("px-3 py-2 align-middle first:pl-4 last:pr-4", numeric && "tabular text-right", muted && "text-ink-2", className)}
      {...p}
    />
  );
}

/** Enlace principal de una fila: área táctil de 44px en móvil sin alterar la altura de la fila en escritorio. */
export const rowLink = "-my-3 inline-flex min-h-11 max-w-full items-center py-3 font-medium hover:underline sm:my-0 sm:min-h-0 sm:py-0";

/** Línea secundaria bajo el valor principal de una celda. */
export function Sub({ className, ...p }: ComponentProps<"div">) {
  return <div className={cn("mt-0.5 truncate text-xs text-ink-3", className)} {...p} />;
}

export function EmptyRow({ cols, children = "Sin resultados con estos filtros." }: { cols: number; children?: ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-[13px] text-ink-3">
        {children}
      </td>
    </tr>
  );
}

/* ───────── Selección múltiple (columna de checkbox) ───────── */

const checkbox = "size-4 cursor-pointer rounded border-line-2 accent-[var(--ink)]";

const checkboxHit = "-my-3 flex min-h-11 min-w-8 cursor-pointer items-center py-3 sm:my-0 sm:min-h-0 sm:py-0";

export function SelectAllTh() {
  return (
    <th scope="col" className="w-10 pl-4 pr-1">
      <label className={checkboxHit}>
        <input type="checkbox" aria-label="Seleccionar todas las filas" className={checkbox} />
      </label>
    </th>
  );
}

export function SelectTd({ label }: { label: string }) {
  return (
    <td className="w-10 pl-4 pr-1 align-middle">
      <label className={checkboxHit}>
        <input type="checkbox" aria-label={`Seleccionar ${label}`} className={checkbox} />
      </label>
    </td>
  );
}

/* ───────── Acciones de fila ───────── */

/** Contenedor de acciones al final de la fila (alineadas a la derecha). */
export function RowActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-1", className)}>{children}</div>;
}

const iconBtn =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink sm:size-8 disabled:pointer-events-none disabled:opacity-50";

/** Botón de icono fantasma (32px en escritorio, 44px en móvil). Con `href` es un enlace; `external` abre en pestaña nueva. */
export function IconButton({ label, href, external = false, className, children, ...p }: ComponentProps<"button"> & { label: string; href?: string; external?: boolean }) {
  if (href && external)
    return (
      <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className={cn(iconBtn, className)}>
        {children}
      </a>
    );
  if (href)
    return (
      <Link href={href} aria-label={label} title={label} className={cn(iconBtn, className)}>
        {children}
      </Link>
    );
  return (
    <button type="button" aria-label={label} title={label} className={cn(iconBtn, className)} {...p}>
      {children}
    </button>
  );
}

/* ───────── Estados ───────── */

const subTone = { active: "ok", trialing: "sky", past_due: "warn", canceled: "neutral" } as const;
const subLabel = { active: "Activa", trialing: "En prueba", past_due: "Impago", canceled: "Cancelada" } as const;

export function SubStatusBadge({ status }: { status: Subscription["status"] | null }) {
  if (!status) return <Badge dot>Sin plan</Badge>;
  return (
    <Badge tone={subTone[status]} dot>
      {subLabel[status]}
    </Badge>
  );
}

export const subStatusOptions = Object.entries(subLabel) as [Subscription["status"], string][];

export function HealthBadge({ health }: { health: "ok" | "warn" | "bad" }) {
  const map = { ok: ["ok", "Sana"], warn: ["warn", "Revisar"], bad: ["bad", "Fallo"] } as const;
  const [tone, label] = map[health];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

/* ───────── Barra de filtros ───────── */

export type Chip = { label: string; value: string; href: string };

/**
 * Convierte los parámetros activos en chips; cada chip enlaza a la misma URL sin ese parámetro.
 * `labels` traduce clave → etiqueta y, opcionalmente, valor → texto visible.
 */
export function buildChips(base: string, params: Record<string, string | undefined>, labels: Record<string, { label: string; value?: (v: string) => string }>): Chip[] {
  const active = Object.entries(params).filter(([k, v]) => v && labels[k]) as [string, string][];
  return active.map(([k, v]) => {
    const rest = new URLSearchParams(active.filter(([kk]) => kk !== k));
    const qs = rest.toString();
    return { label: labels[k].label, value: labels[k].value?.(v) ?? v, href: qs ? `${base}?${qs}` : base };
  });
}

/**
 * Barra de filtros por GET en una sola fila (funciona sin JS y deja la URL compartible).
 * `chips` muestra los filtros activos con enlace para quitarlos uno a uno.
 */
export function FilterBar({ children, action, resetHref, chips = [], className }: { children: ReactNode; action: string; resetHref: string; chips?: Chip[]; className?: string }) {
  return (
    <div className={cn("mb-3 space-y-2", className)}>
      <form action={action} method="get" role="search" className="flex flex-wrap items-center gap-2">
        {children}
        <Button type="submit" variant="outline" size="sm" className="h-11 sm:h-9">
          Filtrar
        </Button>
        {chips.length > 0 && (
          <ButtonLink href={resetHref} variant="ghost" size="sm" className="h-11 sm:h-9">
            <X className="size-3.5" aria-hidden /> Limpiar
          </ButtonLink>
        )}
      </form>
      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5" aria-label="Filtros activos">
          {chips.map((c) => (
            <li key={c.label}>
              <Link
                href={c.href}
                className="inline-flex min-h-8 items-center gap-1 rounded-md bg-ink px-2 py-0.5 text-xs font-medium text-paper hover:bg-ink-2"
                aria-label={`Quitar filtro ${c.label}: ${c.value}`}
              >
                <span className="text-paper/60">{c.label}:</span> {c.value}
                <X className="ml-0.5 size-3" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const control =
  "h-11 w-full rounded-lg border border-line-2 bg-card text-[13px] text-ink shadow-[var(--shadow-xs)] outline-none transition placeholder:text-ink-3 hover:border-ink-3 focus:border-signal focus:shadow-[var(--ring)] sm:h-9";

/** Campo de búsqueda con icono (ocupa toda la fila en móvil). */
export function SearchField({ name = "q", defaultValue, placeholder, label = "Buscar", className }: { name?: string; defaultValue?: string; placeholder?: string; label?: string; className?: string }) {
  return (
    <label className={cn("relative block w-full sm:w-72", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
      <input type="search" name={name} defaultValue={defaultValue} placeholder={placeholder} className={cn(control, "pl-8 pr-3")} />
    </label>
  );
}

/** Select compacto de la barra de filtros, con etiqueta visible solo para lectores de pantalla. */
export function FilterSelect({ label, className, children, ...p }: ComponentProps<"select"> & { label: string }) {
  return (
    <label className={cn("relative block min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:flex-none sm:basis-auto", className)}>
      <span className="sr-only">{label}</span>
      <select
        className={cn(
          control,
          "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a8a85%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat pl-3 pr-8",
        )}
        {...p}
      >
        {children}
      </select>
    </label>
  );
}

/** Input compacto (números, etc.) para la barra de filtros. */
export function FilterInput({ label, className, ...p }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className={cn("relative block min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:flex-none sm:basis-auto", className)}>
      <span className="sr-only">{label}</span>
      <input className={cn(control, "px-3")} {...p} />
    </label>
  );
}

/** Compatibilidad: envoltorio con etiqueta para controles del `FilterBar`. */
export function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-3", className)}>
      {label}
      {children}
    </label>
  );
}

/* ───────── Control segmentado ───────── */

export type Segment = { href: string; label: string; count?: number; active?: boolean; tone?: "bad" };

export function Segmented({ items, label, className }: { items: Segment[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("scroll-x no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0", className)} style={{ ["--scroll-bg" as string]: "var(--paper-2)" }}>
      <ul className="inline-flex min-w-max gap-0.5 rounded-[10px] border border-line bg-card p-0.5 shadow-[var(--shadow-xs)]">
        {items.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              aria-current={s.active ? "true" : undefined}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors sm:h-8",
                s.active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
              )}
            >
              {s.label}
              {s.count !== undefined && (
                <span className={cn("tabular rounded-md px-1.5 text-[11px]", s.active ? "bg-white/15 text-paper" : s.tone === "bad" && s.count > 0 ? "bg-bad-soft text-bad" : "bg-paper-2 text-ink-3")}>
                  {num(s.count)}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ───────── Páginas de detalle ───────── */

/** Lista clave/valor para el panel lateral de metadatos. */
export function KeyValue({ items, className }: { items: { k: string; v: ReactNode; mono?: boolean }[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line text-[13px]", className)}>
      {items.map((it) => (
        <div key={it.k} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
          <dt className="shrink-0 text-ink-3">{it.k}</dt>
          <dd className={cn("min-w-0 text-right text-ink", it.mono && "truncate font-mono text-xs")}>{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Tarjeta de acciones destructivas (borde rojo, botones `danger`). */
export function DangerZone({ title = "Zona peligrosa", intro, children, className }: { title?: string; intro?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("border-bad/30", className)}>
      <CardHeader title={<span className="text-bad">{title}</span>} intro={intro} className="border-bad/20 px-4 py-3" />
      <div className="space-y-3 px-4 py-3">{children}</div>
    </Card>
  );
}

/** Dos columnas: contenido principal + carril lateral pegajoso. */
export function DetailLayout({ children, rail, className }: { children: ReactNode; rail: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]", className)}>
      <div className="min-w-0 space-y-4">{children}</div>
      <aside className="space-y-4 lg:sticky lg:top-[68px]">{rail}</aside>
    </div>
  );
}

/** Barra pegajosa de guardado al pie de formularios largos (flota dentro de su columna). */
export function StickyBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-3 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card/95 px-4 py-2.5 shadow-[var(--shadow-md)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Título de sección fuera de tarjeta, con acción opcional a la derecha. */
export function SectionTitle({ id, children, action, className }: { id?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-2 flex items-center justify-between gap-3", className)}>
      <h2 id={id} className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">
        {children}
      </h2>
      {action}
    </div>
  );
}
