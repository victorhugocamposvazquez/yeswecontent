import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/lib/types";

/** Tabla densa con scroll horizontal en móvil. */
export function DataTable({ caption, children, className, footer }: { caption: string; children: ReactNode; className?: string; footer?: ReactNode }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          {children}
        </table>
      </div>
      {footer && <div className="border-t border-line px-4 py-2.5 text-xs text-ink-3">{footer}</div>}
    </Card>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-paper-2/60 text-left text-xs uppercase tracking-wide text-ink-3">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ className, ...p }: ComponentProps<"th">) {
  return <th scope="col" className={cn("whitespace-nowrap px-4 py-2.5 font-medium", className)} {...p} />;
}

export function Tr({ className, ...p }: ComponentProps<"tr">) {
  return <tr className={cn("border-t border-line/70 transition-colors hover:bg-paper/60", className)} {...p} />;
}

export function Td({ className, ...p }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-2.5 align-middle", className)} {...p} />;
}

export function EmptyRow({ cols, children = "Sin resultados con estos filtros." }: { cols: number; children?: ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-ink-3">
        {children}
      </td>
    </tr>
  );
}

const subTone = { active: "ok", trialing: "sky", past_due: "warn", canceled: "neutral" } as const;
const subLabel = { active: "Activa", trialing: "En prueba", past_due: "Impago", canceled: "Cancelada" } as const;

export function SubStatusBadge({ status }: { status: Subscription["status"] | null }) {
  if (!status) return <Badge>Sin plan</Badge>;
  return <Badge tone={subTone[status]}>{subLabel[status]}</Badge>;
}

export const subStatusOptions = Object.entries(subLabel) as [Subscription["status"], string][];

export function HealthBadge({ health }: { health: "ok" | "warn" | "bad" }) {
  const map = { ok: ["ok", "Sana"], warn: ["warn", "Revisar"], bad: ["bad", "Fallo"] } as const;
  const [tone, label] = map[health];
  return (
    <Badge tone={tone}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </Badge>
  );
}

/** Barra de filtros por GET (funciona sin JS y deja la URL compartible). */
export function FilterBar({ children, action, resetHref }: { children: ReactNode; action: string; resetHref: string }) {
  return (
    <form action={action} method="get" role="search" className="mb-4 flex flex-wrap items-end gap-2">
      {children}
      <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:bg-ink-2">
        <Search className="size-4" aria-hidden /> Filtrar
      </button>
      <Link href={resetHref} className="rounded-full px-3 py-2.5 text-sm text-ink-2 underline-offset-4 hover:underline">
        Limpiar
      </Link>
    </form>
  );
}

export function FilterField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1 text-xs font-medium text-ink-3", className)}>
      {label}
      {children}
    </label>
  );
}
