import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { Badge } from "@/components/ui";
import { agencyName, getClientInvoice, getPortal } from "@/lib/clientes/data";
import { INVOICE_STATUS, host, money } from "@/lib/clientes/format";
import { fmtDate } from "@/lib/utils";
import { AgencyMark } from "../../_components/agency-mark";
import { pButton } from "../../_components/button-class";
import { PrintButton } from "../../_components/print-button";

export const metadata = { title: "Factura" };

const long = { day: "numeric", month: "long", year: "numeric" } as const;

export default async function ClientInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { site, client, agency } = await getPortal();
  const inv = await getClientInvoice(site.id, id);
  if (!inv) notFound();
  const st = INVOICE_STATUS[inv.status];
  const name = agencyName(agency);
  // Precio con IVA incluido: desglosamos el 21 % general.
  const base = Math.round(inv.amount_cents / 1.21);
  const vat = inv.amount_cents - base;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link href="/clientes/facturas" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-2 hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Facturas
        </Link>
        {inv.pdf_url ? (
          <a href={inv.pdf_url} target="_blank" rel="noreferrer" className={pButton("ink", "w-full sm:w-auto")}>
            <FileDown className="h-4 w-4" aria-hidden /> Descargar PDF
          </a>
        ) : (
          <PrintButton label="Guardar como PDF" />
        )}
      </div>

      <article className="rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <AgencyMark name={name} logoUrl={agency.white_label.logo_url} />
            {agency.white_label.support_email && <p className="text-sm text-ink-3">{agency.white_label.support_email}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-signal">Factura</p>
            <p className="font-mono text-lg font-semibold">{inv.number}</p>
            <Badge tone={st.tone} className="mt-1 print:hidden">
              {st.label}
            </Badge>
          </div>
        </header>

        <dl className="grid gap-4 border-b border-line py-6 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-3">Facturado a</dt>
            <dd className="mt-0.5 font-medium">{client.client_name}</dd>
            <dd className="text-ink-2">{client.client_email}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Fecha de emisión</dt>
            <dd className="mt-0.5 font-medium">{fmtDate(inv.issued_at, long)}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Vencimiento</dt>
            <dd className="mt-0.5 font-medium">{inv.due_at ? fmtDate(inv.due_at, long) : "A la vista"}</dd>
          </div>
        </dl>

        <table className="mt-6 w-full text-[15px]">
          <thead className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
            <tr>
              <th className="pb-2 font-medium">Concepto</th>
              <th className="pb-2 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line align-top">
              <td className="py-3 pr-3">
                <span className="block first-letter:uppercase">{inv.concept}</span>
                <span className="text-sm text-ink-3">{host(site.url)}</span>
              </td>
              <td className="py-3 text-right tabular-nums">{money(base, inv.currency)}</td>
            </tr>
          </tbody>
          <tfoot className="text-sm">
            <tr className="border-t border-line">
              <td className="pt-3 text-right text-ink-3">Base imponible</td>
              <td className="pt-3 text-right tabular-nums">{money(base, inv.currency)}</td>
            </tr>
            <tr>
              <td className="pt-1 text-right text-ink-3">IVA (21 %)</td>
              <td className="pt-1 text-right tabular-nums">{money(vat, inv.currency)}</td>
            </tr>
            <tr>
              <td className="pt-3 text-right text-base font-semibold">Total</td>
              <td className="pt-3 text-right text-base font-semibold tabular-nums">{money(inv.amount_cents, inv.currency)}</td>
            </tr>
          </tfoot>
        </table>

        <footer className="mt-8 border-t border-line pt-4 text-xs text-ink-3">
          {inv.status === "paid" ? "Factura pagada. ¡Gracias!" : inv.status === "void" ? "Factura anulada: no tienes que pagarla." : `Emitida por ${name}. Para cualquier duda, escríbenos desde tu portal.`}
        </footer>
      </article>
    </div>
  );
}
