import { cn } from "@/lib/utils";

/** Marca de la agencia: su logotipo si lo tiene; si no, un monograma con su color. */
export function AgencyMark({ name, logoUrl, className, showName = true }: { name: string; logoUrl?: string | null; className?: string; showName?: boolean }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "·";
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logotipo externo de la agencia
        <img src={logoUrl} alt={showName ? "" : name} className="h-8 w-auto max-w-[9rem] object-contain" />
      ) : (
        <span aria-hidden={showName} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-signal text-[13px] font-bold tracking-tight text-signal-ink">
          {initials}
        </span>
      )}
      {showName && <span className="truncate text-[15px] font-semibold tracking-tight text-ink">{name}</span>}
    </span>
  );
}
