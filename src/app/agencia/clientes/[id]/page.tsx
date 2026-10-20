import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { getAgencyClient, getAgencyContext, getPortalResults, listClientInvoices, listClientMembers, listClientMessages } from "@/lib/clientes/data";
import { INVOICE_STATUS, VISIBILITY_MODE, host, money } from "@/lib/clientes/format";
import { cn, fmtDate } from "@/lib/utils";
import { pButton } from "../../../clientes/_components/button-class";
import { PField, PForm, PInput, PSelect, PTextarea } from "../../../clientes/_components/form";
import { createClientInvoice, saveAgencyClientSettings, sendAgencyMessage, setClientInvoiceStatus } from "../../actions";

export const metadata = { title: "Cliente" };

export default async function AgencyClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAgencyContext();
  if (!ctx || ctx === "login") return null;
  const found = await getAgencyClient(ctx.agency.id, id);
  if (!found) notFound();
  const { client, site } = found;
  const [invoices, messages, members, results] = await Promise.all([
    listClientInvoices(id, { includeDrafts: true }),
    listClientMessages(id),
    listClientMembers(id),
    getPortalResults(site),
  ]);
  const month = new Date().toISOString().slice(0, 7);
  const published = results.articles.filter((a) => a.status === "published" && a.published_at?.startsWith(month)).length;
  const clicks = results.traffic.slice(-30).reduce((a, p) => a + p.clicks, 0);
  const paidYear = invoices.filter((i) => i.status === "paid" && i.issued_at.startsWith(month.slice(0, 4))).reduce((a, i) => a + i.amount_cents, 0);

  return (
    <div className="space-y-6">
      <Link href="/agencia/clientes" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Clientes
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{client.client_name}</h1>
          <a href={site.url} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 text-sm text-ink-2 hover:underline">
            {host(site.url)} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={`/clientes/previsualizar?as=${site.id}`} className={pButton("primary", "w-full sm:w-auto")}>
            <Eye className="h-4 w-4" aria-hidden /> Ver portal como el cliente
          </a>
          <Link href="/panel" className={pButton("outline", "w-full sm:w-auto")}>
            Gestionar contenido
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Cuota", `${money(client.price_cents, client.currency)}/mes`],
          ["Facturado este año", money(paidYear, client.currency)],
          ["Publicados este mes", String(published)],
          ["Clics (30 días)", new Intl.NumberFormat("es-ES").format(clicks)],
        ].map(([l, v]) => (
          <Card key={l} className="p-4">
            <p className="text-[13px] text-ink-3">{l}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">{v}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <h2 className="font-semibold">Acceso y precio</h2>
          <p className="mb-5 text-sm text-ink-3">Decide qué ve tu cliente en su portal y cuánto le cobras.</p>
          <PForm action={saveAgencyClientSettings.bind(null, site.id)}>
            <fieldset className="space-y-2">
              <legend className="mb-1.5 text-sm font-medium text-ink-2">Qué verá en el portal</legend>
              {(["resultados", "completo"] as const).map((m) => (
                <label key={m} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-[:checked]:border-signal has-[:checked]:bg-signal/5">
                  <input type="radio" name="visibility_mode" value={m} defaultChecked={client.visibility_mode === m} className="mt-1 h-4 w-4 accent-[var(--signal)]" />
                  <span>
                    <span className="block text-[15px] font-medium">{VISIBILITY_MODE[m].label}</span>
                    <span className="block text-xs text-ink-3">{VISIBILITY_MODE[m].hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="grid gap-5 sm:grid-cols-2">
              <PField label="Precio mensual (€, IVA incl.)" htmlFor="price">
                <PInput id="price" name="price" inputMode="decimal" defaultValue={(client.price_cents / 100).toString().replace(".", ",")} required />
              </PField>
              <PField label="Email de facturación" htmlFor="client_email">
                <PInput id="client_email" name="client_email" type="email" defaultValue={client.client_email} />
              </PField>
            </div>
            <PField label="Enlace para reservar llamada" htmlFor="booking_url" hint="Cal.com, Calendly… Aparece en «Habla con tu equipo».">
              <PInput id="booking_url" name="booking_url" type="url" defaultValue={client.booking_url ?? ""} placeholder="https://cal.com/tuagencia/seguimiento" />
            </PField>
          </PForm>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="font-semibold">Nueva factura</h2>
          <p className="mb-5 text-sm text-ink-3">Numeración correlativa automática. En borrador, el cliente aún no la ve.</p>
          <PForm action={createClientInvoice.bind(null, site.id)} submitLabel="Crear factura" pendingLabel="Creando…" resetOnSuccess>
            <PField label="Concepto" htmlFor="concept">
              <PInput id="concept" name="concept" defaultValue={`Contenidos y posicionamiento · ${new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date())}`} />
            </PField>
            <div className="grid gap-5 sm:grid-cols-2">
              <PField label="Importe (€, IVA incl.)" htmlFor="amount">
                <PInput id="amount" name="amount" inputMode="decimal" defaultValue={(client.price_cents / 100).toString().replace(".", ",")} required />
              </PField>
              <PField label="Vence en (días)" htmlFor="due_days">
                <PInput id="due_days" name="due_days" type="number" min={0} max={90} defaultValue={15} />
              </PField>
            </div>
            <PField label="PDF (opcional)" htmlFor="pdf_url" hint="Si la emites con tu programa de facturación, pega aquí el enlace al PDF.">
              <PInput id="pdf_url" name="pdf_url" type="url" placeholder="https://…" />
            </PField>
            <PField label="Estado" htmlFor="status">
              <PSelect id="status" name="status" defaultValue="sent">
                <option value="sent">Enviar al cliente ahora</option>
                <option value="draft">Guardar como borrador</option>
              </PSelect>
            </PField>
          </PForm>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 font-semibold">Facturas</h2>
        {invoices.length ? (
          <ul className="divide-y divide-line">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">{inv.number}</span>
                    <Badge tone={INVOICE_STATUS[inv.status].tone}>{INVOICE_STATUS[inv.status].label}</Badge>
                  </div>
                  <p className="truncate text-sm text-ink-2 first-letter:uppercase">{inv.concept}</p>
                  <p className="text-xs text-ink-3">
                    {fmtDate(inv.issued_at, { day: "numeric", month: "short", year: "numeric" })} · {money(inv.amount_cents, inv.currency)}
                  </p>
                </div>
                <PForm action={setClientInvoiceStatus.bind(null, site.id)} submitLabel="Cambiar" pendingLabel="…" variant="outline" className="flex flex-col gap-2 space-y-0 sm:flex-row sm:items-start">
                  <input type="hidden" name="invoice_id" value={inv.id} />
                  <label htmlFor={`st_${inv.id}`} className="sr-only">
                    Estado de {inv.number}
                  </label>
                  <PSelect id={`st_${inv.id}`} name="status" defaultValue={inv.status} className="sm:w-48">
                    {(["draft", "sent", "paid", "void"] as const).map((s) => (
                      <option key={s} value={s}>
                        {INVOICE_STATUS[s].label}
                      </option>
                    ))}
                  </PSelect>
                </PForm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">Aún no has emitido facturas a este cliente.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-4 sm:p-6 lg:col-span-3">
          <h2 className="mb-4 font-semibold">Conversación con el cliente</h2>
          {messages.length ? (
            <ol className="space-y-3">
              {messages.map((m) => {
                const own = m.author_side === "agency";
                return (
                  <li key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5", own ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md bg-paper-2")}>
                      <p className="mb-0.5 text-xs font-semibold opacity-80">{m.author_name}</p>
                      <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.body}</p>
                      <p className="mt-1 text-[11px] opacity-60">{fmtDate(m.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-ink-3">Sin mensajes todavía.</p>
          )}
          <div className="mt-5 border-t border-line pt-5">
            <PForm action={sendAgencyMessage.bind(null, site.id)} submitLabel="Responder" pendingLabel="Enviando…" variant="ink" resetOnSuccess>
              <label htmlFor="reply" className="sr-only">
                Tu respuesta
              </label>
              <PTextarea id="reply" name="body" rows={3} required placeholder="Escribe tu respuesta…" />
            </PForm>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-3 font-semibold">Personas del cliente</h2>
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{m.full_name ?? m.email}</span>
                  <span className="block truncate text-xs text-ink-3">{m.email}</span>
                </span>
                <Badge tone={m.status === "active" ? "ok" : "warn"}>{m.status === "active" ? "Activa" : "Invitada"}</Badge>
              </li>
            ))}
            {!members.length && <li className="py-2.5 text-sm text-ink-3">Nadie todavía.</li>}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Las personas administradoras del cliente pueden invitar a su equipo desde su portal.</p>
        </Card>
      </div>
    </div>
  );
}
