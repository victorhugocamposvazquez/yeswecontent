/**
 * Tarjetas de conexión OAuth (Google, Meta, Reddit) y Quora (manual).
 * Sin hooks ni imports de servidor: se usa tanto en Ajustes (servidor) como en el onboarding (cliente).
 */
import { CircleAlert, ExternalLink } from "lucide-react";
import { ActionForm } from "@/components/panel/action-form";
import { Badge, Select } from "@/components/ui";
import { disconnectOAuth, selectGoogleProperties, selectMetaPage, syncAnalyticsNow } from "@/app/panel/integration-actions";
import type { ConnectionDetails, Option } from "@/lib/oauth/connection-types";
import { cn, fmtDate } from "@/lib/utils";

type ProviderKey = "google" | "meta" | "reddit" | "quora";

const NAMES: Record<string, string> = { google: "Google", meta: "Instagram y Facebook", reddit: "Reddit" };

const connectCls =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-ink px-4.5 text-sm font-semibold text-paper shadow-[var(--shadow-xs)] transition-colors hover:bg-ink-2 sm:h-10 sm:w-auto";
const disabledCls = "pointer-events-none opacity-50";

export function startUrl(provider: string, siteId: string | null, returnTo: string) {
  return `/api/oauth/${provider}/start?${new URLSearchParams({ site: siteId ?? "", return: returnTo })}`;
}

/** Aviso tras volver del proveedor (?oauth=…&estado=…&motivo=…). */
export function OAuthNotice({ provider, estado, motivo, demo }: { provider?: string; estado?: string; motivo?: string; demo?: boolean }) {
  if (!provider || !NAMES[provider] || !estado) return null;
  const okState = estado === "ok";
  return (
    <p role="status" className={cn("mb-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px]", okState ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad")}>
      {!okState && <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <span>
        {okState
          ? demo
            ? `${NAMES[provider]}: conexión simulada (modo demo, no se ha guardado nada).`
            : `${NAMES[provider]} conectado correctamente.`
          : `No hemos podido conectar ${NAMES[provider]}: ${motivo || "inténtalo de nuevo."}`}
      </span>
    </p>
  );
}

function Row({ title, desc, badge, account, actions, children }: { title: string; desc: string; badge?: React.ReactNode; account?: string | null; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-card p-4 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold tracking-tight">
            {title} {badge}
          </p>
          <p className="mt-0.5 text-[13px] text-ink-3">{desc}</p>
          {account && (
            <p className="mt-1 text-sm text-ink-2">
              Conectado como <strong className="break-all font-medium text-ink">{account}</strong>
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4 border-t border-line pt-4">{children}</div>}
    </li>
  );
}

function PickSelect({ id, name, label, options, value, empty }: { id: string; name: string; label: string; options: Option[]; value: string | null; empty: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <Select id={id} name={name} defaultValue={value ?? ""} className="truncate">
        <option value="">{empty}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {value && !options.some((o) => o.value === value) && <option value={value}>{value}</option>}
      </Select>
    </div>
  );
}

function Connect({ provider, siteId, returnTo, configured, label = "Conectar" }: { provider: string; siteId: string | null; returnTo: string; configured: boolean; label?: string }) {
  return (
    <a href={startUrl(provider, siteId, returnTo)} className={cn(connectCls, !configured && disabledCls)} aria-disabled={!configured || undefined}>
      {label}
    </a>
  );
}

function Disconnect({ provider, siteId, onChange }: { provider: "google" | "meta" | "reddit"; siteId: string | null; onChange?: () => void }) {
  return (
    <ActionForm action={disconnectOAuth.bind(null, provider)} submitLabel="Desconectar" pendingLabel="Desconectando…" variant="ghost" inline onSuccess={onChange}>
      <input type="hidden" name="site_id" value={siteId ?? ""} />
    </ActionForm>
  );
}

const NotConfigured = ({ name, env }: { name: string; env: string }) => (
  <p className="mt-2 text-xs text-warn">
    Falta configurar la app de {name} en el servidor ({env}). Consulta el README.
  </p>
);

export function ConnectionsList({
  details,
  siteId,
  returnTo,
  show,
  onChange,
}: {
  details: ConnectionDetails;
  siteId: string | null;
  returnTo: string;
  show: ProviderKey[];
  /** Solo desde componentes cliente: recargar los datos tras un cambio. */
  onChange?: () => void;
}) {
  const { google, meta, reddit } = details;
  const hidden = <input type="hidden" name="site_id" value={siteId ?? ""} />;

  return (
    <ul className="space-y-3">
      {show.includes("google") && (
        <Row
          title="Google Search Console y Analytics 4"
          desc="Clics, impresiones, posiciones, consultas y visitas que llegan desde asistentes de IA."
          account={google.connected ? google.account : null}
          badge={
            google.status === "error" ? (
              <Badge tone="bad">Reconectar</Badge>
            ) : google.connected ? (
              google.gscProperty || google.ga4Property ? (
                <Badge tone="ok" dot>Conectado</Badge>
              ) : (
                <Badge tone="warn">Elige propiedad</Badge>
              )
            ) : null
          }
          actions={
            google.connected ? (
              <>
                {google.status === "error" && <Connect provider="google" siteId={siteId} returnTo={returnTo} configured={google.configured} label="Volver a conectar" />}
                <Disconnect provider="google" siteId={siteId} onChange={onChange} />
              </>
            ) : (
              <Connect provider="google" siteId={siteId} returnTo={returnTo} configured={google.configured} label="Conectar con Google" />
            )
          }
        >
          {!google.configured && !google.connected && <NotConfigured name="Google" env="GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET" />}
          {google.connected && google.status !== "error" && (
            <>
              {google.listError && <p className="mb-3 text-sm text-bad">No hemos podido listar tus propiedades: {google.listError}</p>}
              <ActionForm action={selectGoogleProperties} submitLabel="Guardar propiedades" pendingLabel="Importando datos…" variant="ink" className="space-y-4" onSuccess={onChange}>
                {hidden}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <PickSelect id="gsc_property" name="gsc_property" label="Propiedad de Search Console" options={google.gscOptions} value={google.gscProperty} empty={google.gscOptions.length ? "Elige una propiedad…" : "No hay propiedades en esta cuenta"} />
                  <PickSelect id="ga4_property" name="ga4_property" label="Propiedad de Google Analytics 4" options={google.ga4Options} value={google.ga4Property} empty={google.ga4Options.length ? "Elige una propiedad…" : "No hay propiedades GA4 en esta cuenta"} />
                </div>
              </ActionForm>
              {(google.gscProperty || google.ga4Property) && (
                <div className="mt-4 flex flex-col gap-2 rounded-lg border border-line bg-paper-2/60 px-3 py-2.5 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {google.lastSync ? `Última sincronización: ${fmtDate(google.lastSync, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.` : "Aún no hemos sincronizado."} Se actualiza cada noche.
                  </span>
                  <ActionForm action={syncAnalyticsNow} submitLabel="Actualizar ahora" pendingLabel="Sincronizando…" variant="ghost" inline onSuccess={onChange}>
                    {hidden}
                  </ActionForm>
                </div>
              )}
            </>
          )}
          {google.error && <p className="mt-3 text-sm text-bad">{google.error}</p>}
        </Row>
      )}

      {show.includes("meta") && (
        <Row
          title="Instagram y Facebook"
          desc="Publicamos en tu página de Facebook y los carruseles en tu cuenta profesional de Instagram vinculada."
          account={meta.connected ? meta.account : null}
          badge={meta.status === "error" ? <Badge tone="bad">Reconectar</Badge> : meta.connected ? meta.pageId ? <Badge tone="ok" dot>Conectado</Badge> : <Badge tone="warn">Elige página</Badge> : null}
          actions={
            meta.connected ? (
              <>
                {meta.status === "error" && <Connect provider="meta" siteId={siteId} returnTo={returnTo} configured={meta.configured} label="Volver a conectar" />}
                <Disconnect provider="meta" siteId={siteId} onChange={onChange} />
              </>
            ) : (
              <Connect provider="meta" siteId={siteId} returnTo={returnTo} configured={meta.configured} label="Conectar con Facebook" />
            )
          }
        >
          {!meta.configured && !meta.connected && <NotConfigured name="Meta" env="META_APP_ID y META_APP_SECRET" />}
          {meta.connected && meta.status !== "error" && (
            <>
              {meta.listError && <p className="mb-3 text-sm text-bad">No hemos podido listar tus páginas: {meta.listError}</p>}
              <ActionForm action={selectMetaPage} submitLabel="Guardar página" variant="ink" className="space-y-4" onSuccess={onChange}>
                {hidden}
                <PickSelect id="page_id" name="page_id" label="Página de Facebook" options={meta.pageOptions} value={meta.pageId} empty={meta.pageOptions.length ? "Elige una página…" : "No hay páginas que gestiones con esta cuenta"} />
              </ActionForm>
              {meta.pageId && (
                <p className="mt-3 text-xs text-ink-3">
                  Publicamos en <strong className="text-ink-2">{meta.pageName ?? "tu página"}</strong>
                  {meta.igUsername ? (
                    <>
                      {" "}
                      y en <strong className="text-ink-2">@{meta.igUsername}</strong>.
                    </>
                  ) : (
                    ". Esta página no tiene Instagram profesional vinculado."
                  )}
                </p>
              )}
            </>
          )}
          {meta.error && <p className="mt-3 text-sm text-bad">{meta.error}</p>}
        </Row>
      )}

      {show.includes("reddit") && (
        <Row
          title="Reddit"
          desc="Respondemos desde tu usuario en conversaciones de tu sector, solo cuando tú lo apruebas."
          account={reddit.connected ? reddit.account : null}
          badge={reddit.status === "error" ? <Badge tone="bad">Reconectar</Badge> : reddit.connected ? <Badge tone="ok" dot>Conectado</Badge> : null}
          actions={
            reddit.connected ? (
              <>
                {reddit.status === "error" && <Connect provider="reddit" siteId={siteId} returnTo={returnTo} configured={reddit.configured} label="Volver a conectar" />}
                <Disconnect provider="reddit" siteId={siteId} onChange={onChange} />
              </>
            ) : (
              <Connect provider="reddit" siteId={siteId} returnTo={returnTo} configured={reddit.configured} label="Conectar con Reddit" />
            )
          }
        >
          {!reddit.configured && !reddit.connected ? <NotConfigured name="Reddit" env="REDDIT_CLIENT_ID y REDDIT_CLIENT_SECRET" /> : reddit.error ? <p className="text-sm text-bad">{reddit.error}</p> : null}
        </Row>
      )}

      {show.includes("quora") && (
        <Row title="Quora" desc="Quora no ofrece una API pública para publicar respuestas, así que no hay nada que conectar." badge={<Badge>Manual</Badge>}>
          <p className="text-sm text-ink-2">
            Seguiremos preparando respuestas para preguntas donde tu experiencia suma. En <strong className="font-medium">Social › Quora</strong> tendrás el botón «Copiar y abrir en Quora»: copia el texto y abre la pregunta para que la publiques tú en un clic.
          </p>
          <a href="https://es.quora.com" target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-ink-3 underline hover:text-ink sm:min-h-0">
            Abrir Quora <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </Row>
      )}
    </ul>
  );
}
