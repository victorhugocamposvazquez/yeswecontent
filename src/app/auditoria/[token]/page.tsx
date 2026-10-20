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
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" aria-label="yeswecontent">
            <Logo />
          </Link>
          <span className="rounded-full bg-paper-2 px-3 py-1 text-xs text-ink-2">Informe de solo lectura</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">Auditoría técnica y GEO</p>
        <h1 className="mt-2 font-display text-4xl leading-tight md:text-5xl">
          Cómo ven <span className="marker">{host}</span> Google y la IA
        </h1>
        <p className="mt-2 text-ink-2">Analizada el {fmtDate(audit.created_at, { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="grain mt-8 flex flex-col items-center gap-6 rounded-2xl border border-line bg-card p-6 sm:flex-row">
          <ScoreRing score={audit.score ?? 0} size={140} />
          <div className="grid flex-1 grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-ok/10 p-3">
              <p className="text-3xl font-semibold text-ok">{s.pass}</p>
              <p className="text-xs text-ink-2">correctas</p>
            </div>
            <div className="rounded-xl bg-warn/10 p-3">
              <p className="text-3xl font-semibold text-warn">{s.warn}</p>
              <p className="text-xs text-ink-2">mejorables</p>
            </div>
            <div className="rounded-xl bg-bad/10 p-3">
              <p className="text-3xl font-semibold text-bad">{s.fail}</p>
              <p className="text-xs text-ink-2">fallos</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <AuditChecks audit={audit} />
        </div>

        <section className="mt-10 rounded-2xl bg-ink p-8 text-paper">
          <h2 className="font-display text-3xl">¿Quieres que lo arreglemos por ti?</h2>
          <p className="mt-2 max-w-xl text-paper/80">yeswecontent corrige lo técnico, escribe contenido que responde lo que busca tu cliente y lo publica solo. Pruébalo 3 días gratis.</p>
          <ButtonLink href="/registro" className="mt-5">
            Empezar gratis
          </ButtonLink>
        </section>
      </main>
    </div>
  );
}
