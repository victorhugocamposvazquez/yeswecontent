import Link from "next/link";
import { ChevronRight, Eye } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { agencyName, getAgencyContext, listAgencyClients, safeColor } from "@/lib/clientes/data";
import { INVOICE_STATUS, VISIBILITY_MODE, host, money } from "@/lib/clientes/format";
import { pButton } from "../../clientes/_components/button-class";
import { PField, PForm, PInput, PSelect } from "../../clientes/_components/form";
import { addAgencyClient, saveWhiteLabel } from "../actions";

export const metadata = { title: "Clientes" };

const ERRORS: Record<string, string> = {
  permiso: "Necesitas rol de propietario o editor en la agencia para previsualizar el portal.",
  cliente: "No encontramos ese cliente en tu agencia.",
};

export default async function AgencyClientsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAgencyContext();
  if (!ctx || ctx === "login") return null;
  const { agency } = ctx;
  const rows = await listAgencyClients(agency.id);
  const mrr = rows.reduce((a, r) => a + r.price_cents, 0);
  const pending = rows.filter((r) => r.last_invoice?.status === "sent").length;
  const wl = agency.white_label;

  return (
    <>
      <PageHeader
        title="Clientes"
        intro={`Las webs que gestionas para tus clientes. Cada uno ve un portal con la marca de ${agencyName(agency)}, nunca la nuestra.`}
        actions={
          <a href="#nuevo" className={pButton("primary")}>
            Añadir cliente
          </a>
        }
      />
      {sp.error && ERRORS[sp.error] && <p className="mb-6 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">{ERRORS[sp.error]}</p>}

      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat label="Clientes activos" value={rows.length} />
        <Stat label="Facturación mensual" value={money(mrr)} />
        <Stat label="Facturas pendientes" value={pending} />
        <Stat label="Publicados este mes" value={rows.reduce((a, r) => a + r.published_this_month, 0)} />
      </section>

      {rows.length ? (
        <Card className="mb-10">
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.site_id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
                <Link href={`/agencia/clientes/${r.site_id}`} className="group flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper-2 text-sm font-bold text-ink-2" aria-hidden>
                    {r.client_name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium group-hover:underline">{r.client_name}</span>
                    <span className="block truncate text-xs text-ink-3">
                      {host(r.site.url)} · {r.members} {r.members === 1 ? "persona" : "personas"}
                    </span>
                  </span>
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end">
                  <Badge tone={r.visibility_mode === "completo" ? "sky" : "neutral"}>{VISIBILITY_MODE[r.visibility_mode].label}</Badge>
                  <span className="font-semibold tabular-nums">{money(r.price_cents, r.currency)}/mes</span>
                  {r.last_invoice && <Badge tone={INVOICE_STATUS[r.last_invoice.status].tone}>{INVOICE_STATUS[r.last_invoice.status].label}</Badge>}
                </div>
                <div className="flex gap-2">
                  <a href={`/clientes/previsualizar?as=${r.site_id}`} className={pButton("outline", "flex-1 px-3 sm:flex-none")} aria-label={`Ver el portal como ${r.client_name}`}>
                    <Eye className="h-4 w-4" aria-hidden /> <span className="sm:hidden lg:inline">Ver portal</span>
                  </a>
                  <Link href={`/agencia/clientes/${r.site_id}`} className={pButton("ghost", "px-3")} aria-label={`Gestionar ${r.client_name}`}>
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <div className="mb-10">
          <EmptyState title="Aún no tienes clientes">Añade el primero: crearemos su sitio y le enviaremos una invitación a su portal.</EmptyState>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card id="nuevo" className="scroll-mt-24 p-4 sm:p-6">
          <h2 className="font-semibold">Añadir cliente</h2>
          <p className="mb-5 text-sm text-ink-3">Creamos su sitio en tu agencia y le invitamos por email a su portal.</p>
          <PForm action={addAgencyClient} submitLabel="Añadir e invitar" pendingLabel="Creando…" resetOnSuccess>
            <PField label="Nombre del cliente" htmlFor="c_name">
              <PInput id="c_name" name="name" required placeholder="Clínica Ejemplo" autoComplete="organization" />
            </PField>
            <PField label="Web" htmlFor="c_url">
              <PInput id="c_url" name="url" required placeholder="clinicaejemplo.es" inputMode="url" autoCapitalize="none" spellCheck={false} />
            </PField>
            <PField label="Email de la persona de contacto" htmlFor="c_email" hint="Recibirá la invitación al portal y las facturas.">
              <PInput id="c_email" name="email" type="email" required placeholder="direccion@clinicaejemplo.es" inputMode="email" />
            </PField>
            <div className="grid gap-5 sm:grid-cols-2">
              <PField label="Precio mensual (€)" htmlFor="c_price">
                <PInput id="c_price" name="price" inputMode="decimal" placeholder="590" />
              </PField>
              <PField label="Qué verá" htmlFor="c_mode">
                <PSelect id="c_mode" name="visibility_mode" defaultValue="resultados">
                  <option value="resultados">{VISIBILITY_MODE.resultados.label}</option>
                  <option value="completo">{VISIBILITY_MODE.completo.label}</option>
                </PSelect>
              </PField>
            </div>
          </PForm>
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="font-semibold">Tu marca blanca</h2>
          <p className="mb-5 text-sm text-ink-3">Así se verá el portal de todos tus clientes: tu nombre, tu logotipo y tu color.</p>
          <PForm action={saveWhiteLabel} submitLabel="Guardar marca">
            <PField label="Nombre comercial" htmlFor="wl_name">
              <PInput id="wl_name" name="brand_name" defaultValue={wl.brand_name ?? agency.name} />
            </PField>
            <PField label="Color principal" htmlFor="wl_color" hint="Botones, enlaces y gráficos del portal.">
              <div className="flex gap-3">
                <span aria-hidden className="h-11 w-14 shrink-0 rounded-xl border border-line" style={{ background: safeColor(wl.primary_color) }} />
                <PInput id="wl_color" name="primary_color" defaultValue={safeColor(wl.primary_color)} pattern="#[0-9a-fA-F]{6}" required />
              </div>
            </PField>
            <PField label="Logotipo (URL)" htmlFor="wl_logo">
              <PInput id="wl_logo" name="logo_url" type="url" defaultValue={wl.logo_url ?? ""} placeholder="https://tuagencia.es/logo.svg" />
            </PField>
            <PField label="Dominio del portal" htmlFor="wl_domain" hint="Opcional. Por ejemplo clientes.tuagencia.es (requiere un CNAME).">
              <PInput id="wl_domain" name="custom_domain" defaultValue={wl.custom_domain ?? ""} placeholder="clientes.tuagencia.es" autoCapitalize="none" />
            </PField>
            <PField label="Email de soporte" htmlFor="wl_support">
              <PInput id="wl_support" name="support_email" type="email" defaultValue={wl.support_email ?? ""} placeholder="hola@tuagencia.es" />
            </PField>
          </PForm>
        </Card>
      </div>
    </>
  );
}
