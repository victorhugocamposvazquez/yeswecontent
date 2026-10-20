import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui";
import { PanelShell } from "@/components/panel/shell";
import { SiteSwitcher } from "@/components/panel/site-switcher";
import { getCurrentSite, getProfile, getSubscription, listPlans, listSites } from "@/lib/data";
import { isDemo } from "@/lib/env";
import { getGlobalSettings } from "@/lib/panel/app-settings";
import { logout, setSite } from "./actions";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel · yeswecontent" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/entrar?next=/panel");
  const [sites, site] = await Promise.all([listSites(), getCurrentSite()]);
  if (!site) redirect("/onboarding");
  const [sub, plans, global] = await Promise.all([getSubscription(site.id), listPlans(), getGlobalSettings()]);
  const plan = plans.find((p) => p.id === sub?.plan_id);

  let badge: React.ReactNode;
  if (!sub || sub.status === "canceled") {
    badge = (
      <Link href="/panel/ajustes/facturacion" className="inline-flex items-center">
        <Badge tone="bad" dot>Sin plan · Elegir plan</Badge>
      </Link>
    );
  } else if (sub.status === "trialing") {
    const days = sub.trial_ends_at ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000)) : 3;
    badge = (
      <Link href="/panel/ajustes/facturacion" className="flex items-center gap-2">
        <Badge tone="lime" dot>Prueba · {days === 1 ? "queda 1 día" : `quedan ${days} días`}</Badge>
        <span className="hidden text-xs font-medium text-signal underline sm:inline">Activar plan</span>
      </Link>
    );
  } else if (sub.status === "past_due") {
    badge = (
      <Link href="/panel/ajustes/facturacion" className="inline-flex items-center">
        <Badge tone="warn" dot>Pago pendiente · {plan?.name ?? sub.plan_id}</Badge>
      </Link>
    );
  } else {
    badge = (
      <Link href="/panel/ajustes/facturacion" className="inline-flex items-center">
        <Badge tone="neutral" className="max-sm:hidden">
          Plan {plan?.name ?? sub.plan_id} · {sub.interval === "year" ? "anual" : "mensual"}
        </Badge>
      </Link>
    );
  }

  return (
    <PanelShell
      isDemo={isDemo}
      isAdmin={profile.role === "admin"}
      user={{ name: profile.full_name ?? profile.email.split("@")[0], email: profile.email }}
      logoutAction={logout}
      topBadge={badge}
      siteSwitcher={<SiteSwitcher sites={sites.map((s) => ({ id: s.id, name: s.name, url: s.url }))} currentId={site.id} action={setSite} />}
    >
      {global.maintenance_banner && (
        <p role="status" className="mb-5 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-ink">
          {global.maintenance_banner}
        </p>
      )}
      {children}
    </PanelShell>
  );
}
