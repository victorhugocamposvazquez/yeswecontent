import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreRing } from "@/components/charts";
import { AuditChecks, auditSummary } from "@/components/panel/audit-report";
import { ButtonLink, Logo } from "@/components/ui";
import { getSharedAudit } from "@/lib/panel/data";
import { fmtDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Auditoría compartida", robots: { index: false, follow: false } };

export default async function PublicAuditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const audit = await getSharedAudit(token);
  if (!audit) notFound();
  const s = auditSummary(audit);
  const host = audit.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="glow min-h-screen bg-paper-2">
      <header className="border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" aria-label="yeswecontent">
            <Logo />
          </Link>
          <span className="rounded-full border border-line bg-paper-2 px-2.5 py-0.5 text-xs font-medium text-ink-2">Informe de solo lectura</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <p className="eyebrow">Auditoría técnica y GEO</p>
        <h1 className="mt-3 font-display text-[2.25rem] md:text-5xl">
          Cómo ven <span className="marker">{host}</span> Google y la IA
        </h1>
        <p className="mt-3 text-[15px] text-ink-2">Analizada el {fmtDate(audit.created_at, { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="surface mt-8 flex flex-col items-center gap-6 p-6 sm:flex-row md:p-8">
          <ScoreRing score={audit.score ?? 0} size={140} label="/ 100" />
          <div className="grid w-full flex-1 grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-ok-soft p-3">
              <p className="tabular text-3xl font-semibold tracking-tight text-ok">{s.pass}</p>
              <p className="text-xs text-ink-2">correctas</p>
            </div>
            <div className="rounded-xl bg-warn-soft p-3">
              <p className="tabular text-3xl font-semibold tracking-tight text-warn">{s.warn}</p>
              <p className="text-xs text-ink-2">mejorables</p>
            </div>
            <div className="rounded-xl bg-bad-soft p-3">
              <p className="tabular text-3xl font-semibold tracking-tight text-bad">{s.fail}</p>
              <p className="text-xs text-ink-2">fallos</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <AuditChecks audit={audit} />
        </div>

        <section className="mt-10 rounded-2xl bg-ink p-8 text-paper shadow-[var(--shadow-lg)] md:p-10">
          <h2 className="font-display text-3xl">¿Quieres que lo arreglemos por ti?</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-paper/80">yeswecontent corrige lo técnico, escribe contenido que responde lo que busca tu cliente y lo publica solo. Pruébalo 3 días gratis.</p>
          <ButtonLink href="/registro" className="mt-6">
            Empezar gratis
          </ButtonLink>
        </section>
      </main>
    </div>
  );
}
