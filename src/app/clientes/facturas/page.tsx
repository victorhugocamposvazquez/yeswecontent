import Link from "next/link";
import { ChevronRight, FileDown } from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { agencyName, getPortal, listClientInvoices } from "@/lib/clientes/data";
import { INVOICE_STATUS, money } from "@/lib/clientes/format";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Facturas" };

export default async function ClientInvoicesPage() {
  const { site, client, agency } = await getPortal();
  const invoices = await listClientInvoices(site.id);
  const pending = invoices.filter((i) => i.status === "sent");
  const pendingTotal = pending.reduce((a, i) => a + i.amount_cents, 0);
  const name = agencyName(agency);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight md:text-[1.9rem]">Facturas</h1>
        <p className="mt-1 text-sm text-ink-2">Las facturas que te emite {name} por el servicio de contenidos.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:max-w-xl">
        <Card className="p-4 sm:p-5">
          <p className="text-[13px] font-medium text-ink-3">Cuota mensual</p>
          <p className="tabular mt-2 text-[1.75rem] font-semibold leading-none tracking-tight">{money(client.price_cents, client.currency)}</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <p className="text-[13px] font-medium text-ink-3">Pendiente de pago</p>
          <p className={pendingTotal ? "tabular mt-2 text-[1.75rem] font-semibold leading-none tracking-tight text-warn" : "tabular mt-2 text-[1.75rem] font-semibold leading-none tracking-tight"}>{money(pendingTotal, client.currency)}</p>
        </Card>
      </div>

      {invoices.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {invoices.map((inv) => {
              const st = INVOICE_STATUS[inv.status];
              return (
                <li key={inv.id} className="flex items-center gap-2 pr-2 sm:pr-3">
                  <Link href={`/clientes/facturas/${inv.id}`} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-paper-2 sm:px-5">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-sm font-medium">{inv.number}</span>
                        <Badge tone={st.tone} dot>{st.label}</Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink-2 first-letter:uppercase">{inv.concept}</span>
                      <span className="text-xs text-ink-3">
                        Emitida el {fmtDate(inv.issued_at, { day: "numeric", month: "short", year: "numeric" })}
                        {inv.status === "sent" && inv.due_at ? ` · vence el ${fmtDate(inv.due_at)}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right font-semibold tabular-nums">{money(inv.amount_cents, inv.currency)}</span>
                    <ChevronRight className="hidden h-5 w-5 shrink-0 text-ink-3 sm:block" aria-hidden />
                  </Link>
                  {inv.pdf_url && (
                    <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-paper-2" aria-label={`Descargar PDF de ${inv.number}`}>
                      <FileDown className="h-5 w-5" aria-hidden />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <EmptyState title="Aún no tienes facturas">Cuando {name} emita la primera, aparecerá aquí.</EmptyState>
      )}

      <p className="text-sm text-ink-3">
        ¿Dudas con una factura o necesitas cambiar tus datos fiscales?{" "}
        <Link href="/clientes/ajustes/equipo" className="font-semibold text-signal underline">
          Escribe al equipo
        </Link>
        .
      </p>
    </div>
  );
}
