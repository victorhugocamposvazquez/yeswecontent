import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { agencyName, inkFor, resolvePortal, safeColor } from "@/lib/clientes/data";
import { host } from "@/lib/clientes/format";
import { isDemo } from "@/lib/env";
import { exitPreview } from "./actions";
import { AgencyMark } from "./_components/agency-mark";
import { PortalShell } from "./_components/portal-shell";

/**
 * Portal de marca blanca para los clientes finales de una agencia.
 * Todo lo visible lleva la marca de la agencia (nombre, logotipo y color),
 * nunca la de yeswecontent: el color se aplica sobrescribiendo --signal.
 */
export async function generateMetadata(): Promise<Metadata> {
  const r = await resolvePortal();
  const name = r.ok ? agencyName(r.ctx.agency) : "Portal de clientes";
  return {
    title: { default: `Tu portal · ${name}`, template: `%s · ${name}` },
    description: `Resultados, informes y facturas de tu web con ${name}.`,
    robots: { index: false, follow: false },
    applicationName: name,
    openGraph: { title: `Portal de clientes · ${name}`, siteName: name },
    twitter: { card: "summary", title: `Portal de clientes · ${name}` },
  };
}

export const viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default async function ClientPortalLayout({ children }: { children: ReactNode }) {
  const r = await resolvePortal();
  if (!r.ok) {
    if (r.reason === "login") redirect("/entrar?next=/clientes");
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold tracking-tight">No tienes acceso a ningún portal</h1>
          <p className="mt-2 text-[15px] text-ink-2">
            Tu cuenta no está vinculada a ninguna web. Pide a tu agencia que te envíe una invitación al email con el que has entrado.
          </p>
        </div>
      </main>
    );
  }

  const { agency, client, site, viewer, preview } = r.ctx;
  const color = safeColor(agency.white_label.primary_color);
  const theme = { "--signal": color, "--signal-ink": inkFor(color) } as CSSProperties;
  const name = agencyName(agency);

  return (
    <div style={theme} className="bg-paper text-ink">
      <PortalShell
        brand={<AgencyMark name={name} logoUrl={agency.white_label.logo_url} />}
        siteName={site.name}
        siteHost={host(site.url)}
        fullAccess={client.visibility_mode === "completo"}
        user={{ name: viewer.name, email: viewer.email }}
        preview={preview}
        exitPreviewAction={exitPreview}
        demo={isDemo && !preview}
      >
        {children}
      </PortalShell>
    </div>
  );
}
