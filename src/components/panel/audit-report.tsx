import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { Card } from "@/components/ui";
import { FIXES } from "@/lib/panel/audit";
import type { Audit, AuditCheck } from "@/lib/types";

const ICON = {
  pass: <CircleCheck className="h-5 w-5 shrink-0 text-ok" aria-label="Correcto" />,
  warn: <CircleAlert className="h-5 w-5 shrink-0 text-warn" aria-label="Mejorable" />,
  fail: <CircleX className="h-5 w-5 shrink-0 text-bad" aria-label="Fallo" />,
};
const ORDER: Record<AuditCheck["status"], number> = { fail: 0, warn: 1, pass: 2 };

export function auditSummary(audit: Audit) {
  return {
    pass: audit.results.filter((r) => r.status === "pass").length,
    warn: audit.results.filter((r) => r.status === "warn").length,
    fail: audit.results.filter((r) => r.status === "fail").length,
  };
}

/** Listado de comprobaciones agrupadas, con sugerencia de arreglo en las que fallan. */
export function AuditChecks({ audit, showFixes = true }: { audit: Audit; showFixes?: boolean }) {
  const groups = [...new Set(audit.results.map((r) => r.group))];
  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const rows = audit.results.filter((r) => r.group === g).sort((a, b) => ORDER[a.status] - ORDER[b.status]);
        const okCount = rows.filter((r) => r.status === "pass").length;
        return (
          <Card key={g} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-paper px-5 py-3">
              <h3 className="font-semibold">{g}</h3>
              <span className="text-xs text-ink-3">
                {okCount}/{rows.length} correctas
              </span>
            </div>
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.id} className="flex gap-3 px-5 py-4">
                  {ICON[r.status]}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.label}</p>
                    <p className="text-sm text-ink-2">{r.detail}</p>
                    {showFixes && r.status !== "pass" && FIXES[r.id] && (
                      <p className="mt-2 rounded-lg bg-lime/40 px-3 py-2 text-sm">
                        <span className="font-semibold">Cómo arreglarlo: </span>
                        {FIXES[r.id]}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
