import { notFound } from "next/navigation";
import {
  ArticuloSection,
  CalendarioSection,
  CatalogoSection,
  CompetidoresSection,
  CuentaSection,
  EquipoSection,
  EscrituraSection,
  FacturacionSection,
  MarcaBlancaSection,
  MejorasSection,
  NegocioSection,
  PublicacionSection,
  ReferidosSection,
  VisualSection,
} from "@/components/panel/settings-sections";
import { SETTINGS_SECTIONS } from "@/components/panel/settings-config";
import { getCurrentSite, getProfile, getSubscription, listArticles, listPlans } from "@/lib/data";
import { siteUrl } from "@/lib/env";
import { ConnectionsList, OAuthNotice } from "@/components/panel/connections";
import { getWorkspace, listCompetitors, listIntegrations, listInvoices, listTeam } from "@/lib/panel/data";
import { getConnectionDetails } from "@/lib/oauth/connections";
import { isDemo } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/panel/settings-sections";

const ALL = SETTINGS_SECTIONS.flatMap((g) => g.items);

export async function generateMetadata({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
  return { title: `${ALL.find((s) => s.id === seccion)?.label ?? "Ajustes"} · Ajustes` };
}

type Search = { oauth?: string; estado?: string; motivo?: string };

export default async function SettingsSectionPage({ params, searchParams }: { params: Promise<{ seccion: string }>; searchParams: Promise<Search> }) {
  const { seccion } = await params;
  const sp = await searchParams;
  if (!ALL.some((s) => s.id === seccion)) notFound();
  const site = (await getCurrentSite())!;

  switch (seccion) {
    case "cuenta": {
      const profile = await getProfile();
      return profile ? <CuentaSection profile={profile} /> : null;
    }
    case "negocio":
      return <NegocioSection site={site} />;
    case "equipo": {
      const [team, sub, plans] = await Promise.all([listTeam(site.workspace_id), getSubscription(site.id), listPlans()]);
      return <EquipoSection team={team} seats={plans.find((p) => p.id === sub?.plan_id)?.seats ?? 1} />;
    }
    case "escritura":
      return <EscrituraSection site={site} />;
    case "articulo":
      return <ArticuloSection site={site} />;
    case "visual":
      return <VisualSection site={site} />;
    case "calendario":
      return <CalendarioSection site={site} />;
    case "mejoras":
      return <MejorasSection site={site} />;
    case "competidores":
      return <CompetidoresSection competitors={await listCompetitors(site.id)} />;
    case "publicacion": {
      const [integrations, articles] = await Promise.all([listIntegrations(site.id), listArticles(site.id)]);
      return <PublicacionSection site={site} integrations={integrations} articles={articles} />;
    }
    case "analitica":
    case "social": {
      const simulated = isDemo && sp.estado === "ok" && sp.oauth ? [sp.oauth] : [];
      const details = await getConnectionDetails(isDemo ? null : await createClient(), site.id, { simulated });
      const isSocial = seccion === "social";
      return (
        <Section
          title={isSocial ? "Redes sociales" : "Analítica"}
          intro={
            isSocial
              ? "Publicamos los carruseles y las respuestas que apruebes desde tus propias cuentas. Puedes desconectarlas cuando quieras."
              : "Conecta tu cuenta de Google para ver clics, impresiones y visitas desde IA en el panel y en los informes. Solo pedimos permisos de lectura."
          }
        >
          <OAuthNotice provider={sp.oauth} estado={sp.estado} motivo={sp.motivo} demo={isDemo} />
          <ConnectionsList details={details} siteId={site.id} returnTo={`/panel/ajustes/${seccion}`} show={isSocial ? ["meta", "reddit", "quora"] : ["google"]} />
        </Section>
      );
    }
    case "catalogo": {
      const integrations = await listIntegrations(site.id);
      return <CatalogoSection shopifyConnected={integrations.some((i) => i.provider === "shopify") || site.id === "s_tierrafina"} />;
    }
    case "marca-blanca": {
      const ws = await getWorkspace(site.workspace_id);
      return <MarcaBlancaSection whiteLabel={(ws?.white_label ?? {}) as Record<string, string>} />;
    }
    case "referidos": {
      const ws = await getWorkspace(site.workspace_id);
      return <ReferidosSection code={ws?.referral_code ?? "—"} baseUrl={siteUrl} />;
    }
    case "facturacion": {
      const [sub, plans, invoices] = await Promise.all([getSubscription(site.id), listPlans(), listInvoices()]);
      return <FacturacionSection sub={sub} plans={plans} siteId={site.id} invoices={invoices} />;
    }
  }
  notFound();
}
