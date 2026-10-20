import { ExternalLink } from "lucide-react";
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
  const rerun = (
    <ActionForm action={rerunAudit} submitLabel="Volver a auditar" pendingLabel="Analizando tu web…" variant="outline" inline />
  );

  if (!audit) {
    return (
      <>
        <PageHeader title="Auditoría técnica y GEO" actions={rerun} />
        <EmptyState title="Todavía no hemos auditado tu web">Lanza la primera auditoría: tarda menos de un minuto.</EmptyState>
      </>
    );
  }
  const s = auditSummary(audit);
  const publicPath = `/auditoria/${audit.share_token}`;

  return (
    <>
      <PageHeader
        title="Auditoría técnica y GEO"
        intro="Lo que impide que Google y los asistentes de IA entiendan, rastreen y citen tu web."
        actions={
          <>
            <CopyButton text={publicPath} label="Copiar enlace público" />
            <ButtonLink href={publicPath} target="_blank" variant="ghost">
              <ExternalLink className="h-4 w-4" aria-hidden /> Ver
            </ButtonLink>
          </>
        }
      />

      <Card className="mb-6 grid items-center gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
        <ScoreRing score={audit.score ?? 0} size={128} />
        <div>
          <p className="font-display text-3xl">{(audit.score ?? 0) >= 85 ? "Tu web está en forma" : (audit.score ?? 0) >= 65 ? "Buena base, con margen" : "Hay trabajo por delante"}</p>
          <p className="mt-1 text-sm text-ink-2">
            {audit.url} · analizada el {fmtDate(audit.created_at, { day: "numeric", month: "long" })}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span>
              <strong className="text-ok">{s.pass}</strong> correctas
            </span>
            <span>
              <strong className="text-warn">{s.warn}</strong> mejorables
            </span>
            <span>
              <strong className="text-bad">{s.fail}</strong> fallos
            </span>
          </div>
        </div>
        <div className="md:self-start">{rerun}</div>
      </Card>

      <AuditChecks audit={audit} />
    </>
  );
}
