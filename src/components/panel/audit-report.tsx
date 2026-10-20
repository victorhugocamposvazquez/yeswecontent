import { ChevronDown, CircleAlert, CircleCheck, CircleX, Wrench } from "lucide-react";
import { Card } from "@/components/ui";
import { FIXES } from "@/lib/panel/audit";
import type { Audit, AuditCheck } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON = {
  pass: { Icon: CircleCheck, cls: "bg-ok-soft text-ok", label: "Correcto" },
  warn: { Icon: CircleAlert, cls: "bg-warn-soft text-warn", label: "Mejorable" },
  fail: { Icon: CircleX, cls: "bg-bad-soft text-bad", label: "Fallo" },
};
const ORDER: Record<AuditCheck["status"], number> = { fail: 0, warn: 1, pass: 2 };

export function auditSummary(audit: Audit) {
  return {
    pass: audit.results.filter((r) => r.status === "pass").length,
    warn: audit.results.filter((r) => r.status === "warn").length,
    fail: audit.results.filter((r) => r.status === "fail").length,
  };
}

/** Icono de estado en círculo suave. */
export function StatusIcon({ status, size = "md" }: { status: AuditCheck["status"]; size?: "sm" | "md" }) {
  const { Icon, cls, label } = ICON[status];
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full", cls, size === "sm" ? "h-6 w-6" : "h-8 w-8")} aria-label={label} role="img">
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
    </span>
  );
}

/** Listado de comprobaciones agrupadas en acordeones, con sugerencia de arreglo en las que fallan. */
export function AuditChecks({ audit, showFixes = true }: { audit: Audit; showFixes?: boolean }) {
  const groups = [...new Set(audit.results.map((r) => r.group))];
  return (
    <div className="space-y-3 md:space-y-4">
      {groups.map((g, gi) => {
        const rows = audit.results.filter((r) => r.group === g).sort((a, b) => ORDER[a.status] - ORDER[b.status]);
        const okCount = rows.filter((r) => r.status === "pass").length;
        const fails = rows.filter((r) => r.status === "fail").length;
        const warns = rows.filter((r) => r.status === "warn").length;
        const worst: AuditCheck["status"] = fails ? "fail" : warns ? "warn" : "pass";
        return (
          <Card key={g} className="overflow-hidden">
            <details className="group" open={gi === 0 || worst !== "pass"}>
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition-colors hover:bg-paper-2 md:px-5 [&::-webkit-details-marker]:hidden">
                <StatusIcon status={worst} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold tracking-tight">{g}</h3>
                  <p className="tabular text-xs text-ink-3">
                    {okCount}/{rows.length} correctas
                    {fails > 0 && <span className="text-bad"> · {fails} fallos</span>}
                    {warns > 0 && <span className="text-warn"> · {warns} mejorables</span>}
                  </p>
                </div>
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-paper-3 sm:block" aria-hidden>
                  <div className="h-full rounded-full bg-ok" style={{ width: `${(okCount / rows.length) * 100}%` }} />
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <ul className="divide-y divide-line border-t border-line">
                {rows.map((r) => (
                  <li key={r.id} className="flex gap-3 px-4 py-3.5 md:px-5">
                    <StatusIcon status={r.status} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug">{r.label}</p>
                      <p className="mt-0.5 text-[13px] text-ink-2">{r.detail}</p>
                      {showFixes && r.status !== "pass" && FIXES[r.id] && (
                        <p className="mt-2 flex gap-2 rounded-lg bg-lime-soft px-3 py-2 text-[13px] leading-relaxed">
                          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span>
                            <span className="font-semibold">Cómo arreglarlo: </span>
                            {FIXES[r.id]}
                          </span>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          </Card>
        );
      })}
    </div>
  );
}
