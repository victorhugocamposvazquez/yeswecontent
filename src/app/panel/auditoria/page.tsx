import { ExternalLink, ShieldCheck } from "lucide-react";
import { ScoreRing } from "@/components/charts";
import { ActionForm } from "@/components/panel/action-form";
import { AuditChecks, auditSummary } from "@/components/panel/audit-report";
import { CopyButton } from "@/components/panel/copy-button";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentSite, getLatestAudit } from "@/lib/data";
import { fmtDate } from "@/lib/utils";
import { rerunAudit } from "../actions";

export const metadata = { title: "Auditoría" };

export default async function AuditPage() {
  const site = (await getCurrentSite())!;
  const audit = await getLatestAudit(site.id);
  const rerun = <ActionForm action={rerunAudit} submitLabel="Volver a auditar" pendingLabel="Analizando tu web…" variant="outline" inline />;

  if (!audit) {
    return (
      <>
        <PageHeader title="Auditoría técnica y GEO" actions={rerun} />
        <EmptyState title="Todavía no hemos auditado tu web" icon={<ShieldCheck className="h-5 w-5" />}>
          Lanza la primera auditoría: tarda menos de un minuto.
        </EmptyState>
      </>
    );
  }
  const s = auditSummary(audit);
  const publicPath = `/auditoria/${audit.share_token}`;
  const score = audit.score ?? 0;

  return (
    <>
      <PageHeader title="Auditoría técnica y GEO" intro="Lo que impide que Google y los asistentes de IA entiendan, rastreen y citen tu web." actions={rerun} />

      <Card className="mb-4 overflow-hidden md:mb-5">
        <div className="grid grid-cols-1 items-center gap-6 p-5 md:grid-cols-[auto_1fr_auto] md:p-6">
          <ScoreRing score={score} size={136} label="/ 100" />
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight">{score >= 85 ? "Tu web está en forma" : score >= 65 ? "Buena base, con margen" : "Hay trabajo por delante"}</p>
            <p className="mt-1 text-[13px] text-ink-2">
              {audit.url} · analizada el {fmtDate(audit.created_at, { day: "numeric", month: "long" })}
            </p>
            <div className="mt-4 grid max-w-sm grid-cols-3 gap-2">
              {(
                [
                  ["bg-ok-soft text-ok", s.pass, "correctas"],
                  ["bg-warn-soft text-warn", s.warn, "mejorables"],
                  ["bg-bad-soft text-bad", s.fail, "fallos"],
                ] as const
              ).map(([cls, n, l]) => (
                <div key={l} className={`rounded-xl px-3 py-2 ${cls}`}>
                  <p className="tabular text-xl font-semibold leading-none">{n}</p>
                  <p className="mt-1 text-[11px] text-ink-2">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:self-start">
            <CopyButton text={publicPath} label="Copiar enlace público" />
            <ButtonLink href={publicPath} target="_blank" variant="ghost" size="sm" className="justify-center">
              <ExternalLink className="h-4 w-4" aria-hidden /> Ver informe público
            </ButtonLink>
          </div>
        </div>
      </Card>

      <AuditChecks audit={audit} />
    </>
  );
}
