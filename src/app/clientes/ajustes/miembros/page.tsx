import { Badge, Card } from "@/components/ui";
import { getPortal, listClientMembers } from "@/lib/clientes/data";
import { fmtDate } from "@/lib/utils";
import { inviteClientMember } from "../../actions";
import { PField, PForm, PInput, PSelect } from "../../_components/form";

export const metadata = { title: "Miembros" };

export default async function ClientMembersPage() {
  const { site } = await getPortal();
  const members = await listClientMembers(site.id);
  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <h2 className="font-semibold">Personas con acceso</h2>
        <p className="mb-3 text-sm text-ink-3">Todas ven los resultados de {site.name}. Las administradoras también pueden invitar.</p>
        <ul className="divide-y divide-line">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-signal-soft text-xs font-semibold text-signal" aria-hidden>
                {(m.full_name ?? m.email)[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{m.full_name ?? m.email}</span>
                <span className="block truncate text-xs text-ink-3">
                  {m.email}
                  {m.status === "invited" ? ` · invitada el ${fmtDate(m.invited_at)}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Badge tone={m.role === "admin" ? "signal" : "neutral"}>{m.role === "admin" ? "Administra" : "Miembro"}</Badge>
                {m.status === "invited" && <Badge tone="warn">Pendiente</Badge>}
              </span>
            </li>
          ))}
          {!members.length && <li className="py-3 text-sm text-ink-3">Todavía no hay nadie más.</li>}
        </ul>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="font-semibold">Invitar a alguien de tu equipo</h2>
        <p className="mb-5 text-sm text-ink-3">Le llegará un email con un enlace para entrar. No necesita contraseña previa.</p>
        <PForm action={inviteClientMember} submitLabel="Enviar invitación" pendingLabel="Enviando…" resetOnSuccess>
          <PField label="Email" htmlFor="inv_email">
            <PInput id="inv_email" name="email" type="email" inputMode="email" autoComplete="off" placeholder="nombre@tuempresa.es" required />
          </PField>
          <PField label="Nombre (opcional)" htmlFor="inv_name">
            <PInput id="inv_name" name="full_name" autoComplete="off" placeholder="Cómo se llama" />
          </PField>
          <PField label="Permisos" htmlFor="inv_role">
            <PSelect id="inv_role" name="role" defaultValue="member">
              <option value="member">Miembro: ve resultados, informes y facturas</option>
              <option value="admin">Administra: además, invita a otras personas</option>
            </PSelect>
          </PField>
        </PForm>
      </Card>
    </div>
  );
}
