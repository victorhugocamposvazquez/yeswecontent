import { notFound } from "next/navigation";
import {
  ArticuloSection,
  CalendarioSection,
  CatalogoSection,
  CompetidoresSection,
  ConnectList,
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
import { getWorkspace, listCompetitors, listIntegrations, listInvoices, listTeam } from "@/lib/panel/data";

const ALL = SETTINGS_SECTIONS.flatMap((g) => g.items);

export async function generateMetadata({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
  return { title: `${ALL.find((s) => s.id === seccion)?.label ?? "Ajustes"} · Ajustes` };
}

export default async function SettingsSectionPage({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
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
      return (
        <ConnectList
          title="Analítica"
          intro="Conecta tus cuentas de Google para ver clics, impresiones y conversiones en el panel y en los informes."
          integrations={await listIntegrations(site.id)}
          items={[
            { id: "gsc", name: "Google Search Console", desc: "Clics, impresiones, posiciones y consultas." },
            { id: "ga4", name: "Google Analytics 4", desc: "Sesiones, conversiones y tráfico desde asistentes de IA." },
          ]}
        />
      );
    case "social":
      return (
        <ConnectList
          title="Redes sociales"
          intro="Publicamos los carruseles y las respuestas que apruebes desde tus propias cuentas."
          integrations={await listIntegrations(site.id)}
          items={[
            { id: "meta", name: "Instagram y Facebook", desc: "Carruseles a partir de tus artículos." },
            { id: "reddit", name: "Reddit", desc: "Respuestas útiles en conversaciones de tu sector." },
            { id: "quora", name: "Quora", desc: "Respuestas a preguntas donde tu experiencia suma." },
          ]}
        />
      );
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
