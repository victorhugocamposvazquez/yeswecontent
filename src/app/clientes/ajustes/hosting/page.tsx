import { CircleCheck, Clock } from "lucide-react";
import { CopyButton } from "@/components/panel/copy-button";
import { Badge, Card } from "@/components/ui";
import { CNAME_TARGET, getClientSiteSettings, getPortal, listClientIntegrations } from "@/lib/clientes/data";
import { fmtDate } from "@/lib/utils";
import { saveClientCms, saveClientDomain, verifyClientDomain } from "../../actions";
import { CmsForm } from "../../_components/cms-form";
import { PField, PForm, PInput } from "../../_components/form";

export const metadata = { title: "Dominio y CMS" };

const CMS_LABEL: Record<string, string> = { wordpress: "WordPress", shopify: "Shopify", webflow: "Webflow", ghost: "Ghost", webhook: "Webhook" };

export default async function ClientHostingPage() {
  const { site } = await getPortal();
  const [settings, integrations] = await Promise.all([getClientSiteSettings(site.id), listClientIntegrations(site.id)]);
  const domain = settings.custom_domain;
  const sub = domain ? domain.split(".")[0] : "blog";
  const cms = integrations.filter((i) => i.provider in CMS_LABEL);

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Dominio propio</h2>
          {domain &&
            (settings.domain_verified_at ? (
              <Badge tone="ok">
                <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Verificado
              </Badge>
            ) : (
              <Badge tone="warn">
                <Clock className="h-3.5 w-3.5" aria-hidden /> Pendiente de DNS
              </Badge>
            ))}
        </div>
        <p className="mb-5 text-sm text-ink-3">Sirve tu blog en un subdominio de tu marca, por ejemplo blog.tuempresa.es.</p>
        <PForm action={saveClientDomain} submitLabel="Guardar dominio">
          <PField label="Subdominio" htmlFor="custom_domain">
            <PInput
              id="custom_domain"
              name="custom_domain"
              defaultValue={domain ?? ""}
              placeholder="blog.tuempresa.es"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
            />
          </PField>
        </PForm>

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="text-[15px] font-semibold">Crea este registro en tu proveedor de DNS</h3>
          <p className="mb-3 text-sm text-ink-3">En el panel donde compraste el dominio (GoDaddy, IONOS, Cloudflare…), añade un registro nuevo con estos valores:</p>
          <dl className="divide-y divide-line rounded-xl border border-line text-sm">
            <DnsRow label="Tipo" value="CNAME" />
            <DnsRow label="Nombre / Host" value={sub} copy />
            <DnsRow label="Valor / Destino" value={CNAME_TARGET} copy />
            <DnsRow label="TTL" value="Automático (o 3600)" />
          </dl>
          <p className="mt-3 text-xs text-ink-3">Si usas Cloudflare, desactiva el proxy (nube gris). Los cambios pueden tardar unas horas en propagarse.</p>
          {domain && !settings.domain_verified_at && (
            <PForm action={verifyClientDomain} submitLabel="Comprobar ahora" pendingLabel="Comprobando…" variant="outline" className="mt-4">
              <input type="hidden" name="custom_domain" value={domain} />
            </PForm>
          )}
          {settings.domain_verified_at && <p className="mt-3 text-sm text-ok">Verificado el {fmtDate(settings.domain_verified_at, { day: "numeric", month: "long" })}.</p>}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-semibold">Conecta tu web</h2>
        <p className="mb-4 text-sm text-ink-3">Con tu CMS conectado publicamos los artículos directamente, sin que tengas que copiar y pegar nada.</p>
        {cms.length > 0 && (
          <ul className="mb-5 space-y-2">
            {cms.map((i) => (
              <li key={i.id} className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-paper-2 px-3.5 py-2">
                <span className="text-[15px] font-medium">{CMS_LABEL[i.provider]}</span>
                <Badge tone={i.status === "connected" ? "ok" : "warn"}>{i.status === "connected" ? "Conectado" : "Revisar"}</Badge>
              </li>
            ))}
          </ul>
        )}
        <CmsForm action={saveClientCms} defaultProvider={cms[0]?.provider} />
      </Card>
    </div>
  );
}

function DnsRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3.5 py-2.5">
      <dt className="text-ink-3">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <code className="break-all font-mono text-[13px] font-medium">{value}</code>
        {copy && <CopyButton text={value} label="Copiar" variant="ghost" className="min-h-11 px-3" />}
      </dd>
    </div>
  );
}
