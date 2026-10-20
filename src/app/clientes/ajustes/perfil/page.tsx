import { LogOut } from "lucide-react";
import { Card } from "@/components/ui";
import { agencyName, getPortal } from "@/lib/clientes/data";
import { VISIBILITY_MODE, host } from "@/lib/clientes/format";
import { logoutClient, saveClientProfile } from "../../actions";
import { pButton } from "../../_components/button-class";
import { PField, PForm, PInput } from "../../_components/form";

export const metadata = { title: "Perfil" };

export default async function ClientProfilePage() {
  const { viewer, site, client, agency, preview } = await getPortal();
  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <h2 className="font-semibold">Tus datos</h2>
        <p className="mb-5 text-sm text-ink-3">Así te verá el equipo de {agencyName(agency)} en los mensajes.</p>
        <PForm action={saveClientProfile}>
          <PField label="Nombre" htmlFor="full_name">
            <PInput id="full_name" name="full_name" defaultValue={viewer.name} autoComplete="name" required minLength={2} disabled={preview} />
          </PField>
          <PField label="Email" htmlFor="email" hint="Es el email con el que entras. Para cambiarlo, escribe a tu equipo.">
            <PInput id="email" type="email" value={viewer.email} disabled readOnly />
          </PField>
        </PForm>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-3 font-semibold">Tu servicio</h2>
        <dl className="divide-y divide-line text-[15px]">
          <Row label="Web" value={host(site.url)} />
          <Row label="Empresa" value={client.client_name} />
          <Row label="Acceso" value={VISIBILITY_MODE[client.visibility_mode].label} />
          <Row label="Gestionado por" value={agencyName(agency)} />
        </dl>
      </Card>

      {!preview && (
        <form action={logoutClient}>
          <button type="submit" className={pButton("outline", "w-full text-bad sm:w-auto")}>
            <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
          </button>
        </form>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-ink-3">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{value}</dd>
    </div>
  );
}
