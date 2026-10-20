import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  /** Celda. Recibe la fila y su índice. */
  cell: (row: T, i: number) => ReactNode;
  /** Alineación a la derecha (numéricos, con tabular-nums). */
  numeric?: boolean;
  /** Clases extra para th y td (anchos, truncado…). */
  className?: string;
  /** Cabecera solo para lectores de pantalla (columna de acciones). */
  srOnly?: boolean;
};

/**
 * Tabla de datos del panel: 13 px, cabecera fija en mayúsculas, filas con
 * hairline y hover. En móvil se puede ocultar (`mobile="hidden"`) y mostrar en
 * su lugar las tarjetas apiladas que ya tiene cada página.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  minWidth = 640,
  footer,
  empty,
  caption,
  className,
  mobile = "hidden",
  dense = false,
  flat = false,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  rowClassName?: (row: T, i: number) => string | undefined;
  /** Ancho mínimo de la tabla: por debajo, scroll horizontal con sombras. */
  minWidth?: number;
  /** Línea inferior: paginación, totales, recuento… */
  footer?: ReactNode;
  /** Qué mostrar cuando no hay filas. */
  empty?: ReactNode;
  caption?: string;
  className?: string;
  /** "hidden": la tabla no se muestra por debajo de md (hay tarjetas). "scroll": siempre visible con scroll. */
  mobile?: "hidden" | "scroll";
  dense?: boolean;
  /** Sin tarjeta alrededor: para incrustar dentro de otra Card (Section flush). */
  flat?: boolean;
}) {
  const pad = dense ? "px-3 py-2" : "px-4 py-3";
  if (!rows.length && empty) return <>{empty}</>;
  const Wrap = flat ? "div" : Card;
  return (
    <Wrap className={cn("overflow-hidden", mobile === "hidden" && "max-md:hidden", className)}>
      <div className="scroll-x max-h-[70vh] overflow-y-auto">
        <table className="w-full text-[13px]" style={{ minWidth }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-[1] bg-card/95 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 backdrop-blur [&_th]:border-b [&_th]:border-line">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn(pad, "whitespace-nowrap font-semibold", c.numeric && "text-right", c.className)}>
                  {c.srOnly ? <span className="sr-only">{c.header}</span> : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={rowKey(r, i)} className={cn("group transition-colors duration-150 hover:bg-paper-2", rowClassName?.(r, i))}>
                {columns.map((c) => (
                  <td key={c.key} className={cn(pad, "align-middle", c.numeric && "tabular text-right", c.className)}>
                    {c.cell(r, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper-2/60 px-4 py-2 text-xs text-ink-3">{footer}</div>}
    </Wrap>
  );
}

/** Texto principal + secundario dentro de una celda. */
export function CellText({ primary, secondary, className }: { primary: ReactNode; secondary?: ReactNode; className?: string }) {
  return (
    <span className={cn("block min-w-0", className)}>
      <span className="block truncate font-medium text-ink">{primary}</span>
      {secondary && <span className="block truncate text-xs text-ink-3">{secondary}</span>}
    </span>
  );
}

/** Botón de icono fantasma para acciones de fila (36 px, 44 en táctil). */
export const rowIconBtn =
  "inline-grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition-colors duration-150 hover:bg-paper-3 hover:text-ink focus-visible:bg-paper-3 max-md:h-11 max-md:w-11";

/** Línea de pie estándar: «Mostrando N de M». */
export function TableCount({ shown, total, unit = "filas" }: { shown: number; total: number; unit?: string }) {
  return (
    <span className="tabular">
      {shown === total ? `${total} ${unit}` : `Mostrando ${shown} de ${total} ${unit}`}
    </span>
  );
}
