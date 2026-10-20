import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, UserCog } from "lucide-react";
import { Badge, Card, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DataTable, EmptyRow, HealthBadge, SubStatusBadge, Td, Th, THead, Tr } from "@/components/admin/table";
import { UsageMeter } from "@/components/admin/UsageMeter";
import { getUserDetail, listAdminPlans } from "@/lib/admin/data";
import { stripeDashboardUrl } from "@/lib/admin/links";
import { eur, fmtDate } from "@/lib/utils";
import { cancelSubscription, extendTrial, impersonateUser, setUserRole } from "../../actions";

export const metadata = { title: "Detalle de usuario" };

const long = { day: "numeric", month: "short", year: "numeric" } as const;

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d, plans] = await Promise.all([getUserDetail(id), listAdminPlans()]);
  if (!d) notFound();
  const { user, workspace, sites, subscriptions, usage } = d;
  const planName = (pid: string | null) => plans.find((p) => p.id === pid)?.name ?? pid ?? "—";

  return (
    <>
      <Link href="/admin/usuarios" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Usuarios
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight text-2xl leading-tight">{user.full_name ?? user.email}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-ink-2">
            {user.email}
            <Badge tone={user.role === "admin" ? "lime" : "neutral"}>{user.role === "admin" ? "Admin" : "Usuario"}</Badge>
            <SubStatusBadge status={user.status} />
          </p>
        </div>
        <ActionForm action={impersonateUser} confirm={`Vas a entrar en el panel como ${user.email}. ¿Continuar?`}>
          <input type="hidden" name="userId" value={user.id} />
          <SubmitButton variant="primary">
            <UserCog className="size-4" aria-hidden /> Entrar como este usuario
          </SubmitButton>
          <p className="mt-1 max-w-64 text-xs text-ink-3">Stub de soporte. Pendiente: registro de auditoría antes de producción.</p>
        </ActionForm>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">Espacio de trabajo</h2>
          {workspace ? (
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-ink-3">Nombre</dt>
              <dd>{workspace.name}</dd>
              <dt className="text-ink-3">Tipo</dt>
              <dd>{workspace.kind === "agency" ? "Agencia (marca blanca)" : "Empresa"}</dd>
              <dt className="text-ink-3">Sitios</dt>
              <dd>{sites.length}</dd>
              <dt className="text-ink-3">MRR</dt>
              <dd className="tabular-nums">{user.mrr_eur ? eur(user.mrr_eur) : "—"}</dd>
              <dt className="text-ink-3">Alta</dt>
              <dd>{fmtDate(user.created_at, long)}</dd>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-ink-3">Sin espacio de trabajo propio.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Uso frente al plan</h2>
          <p className="text-sm text-ink-3">{planName(user.plan_id)} · límites multiplicados por nº de sitios</p>
          <div className="mt-4 space-y-4">
            {usage.map((u) => (
              <UsageMeter key={u.label} {...u} />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Rol</h2>
          <ActionForm action={setUserRole} className="mt-3">
            <input type="hidden" name="userId" value={user.id} />
            <label htmlFor="role" className="sr-only">
              Rol
            </label>
            <div className="flex gap-2">
              <Select id="role" name="role" defaultValue={user.role}>
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </Select>
              <SubmitButton>Guardar</SubmitButton>
            </div>
          </ActionForm>
          <p className="mt-3 text-xs text-ink-3">Los admins ven todos los datos de todos los clientes. Concede el rol con cuidado.</p>
        </Card>
      </div>

      <h2 className="mb-2 mt-8 font-semibold">Suscripciones</h2>
      <DataTable caption="Suscripciones del usuario">
        <THead>
          <Th>Sitio</Th>
          <Th>Plan</Th>
          <Th>Estado</Th>
          <Th className="text-right">MRR</Th>
          <Th>Prueba / renovación</Th>
          <Th>Stripe</Th>
          <Th>Acciones</Th>
        </THead>
        <tbody>
          {subscriptions.map((s) => (
            <Tr key={s.id}>
              <Td className="font-medium">{s.site_name}</Td>
              <Td>
                {planName(s.plan_id)} <span className="text-ink-3">· {s.interval === "year" ? "anual" : "mensual"}</span>
              </Td>
              <Td>
                <SubStatusBadge status={s.status} />
              </Td>
              <Td className="text-right tabular-nums">{s.mrr_eur ? eur(s.mrr_eur) : "—"}</Td>
              <Td className="text-ink-2">
                {s.status === "trialing" && s.trial_ends_at
                  ? `Prueba hasta ${fmtDate(s.trial_ends_at, long)}`
                  : s.current_period_end
                    ? `${s.status === "canceled" ? "Terminó" : "Renueva"} ${fmtDate(s.current_period_end, long)}`
                    : "—"}
              </Td>
              <Td>
                {s.stripe_subscription_id ? (
                  <a
                    href={stripeDashboardUrl("subscriptions", s.stripe_subscription_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
                  >
                    {s.stripe_subscription_id} <ExternalLink className="size-3" aria-label="(abre Stripe)" />
                  </a>
                ) : (
                  <span className="text-ink-3">—</span>
                )}
              </Td>
              <Td>
                {s.status !== "canceled" && (
                  <div className="flex flex-col gap-2">
                    <ActionForm action={extendTrial} inline>
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <label className="sr-only" htmlFor={`days-${s.id}`}>
                        Días de prueba extra
                      </label>
                      <Input id={`days-${s.id}`} name="days" type="number" min={1} max={60} defaultValue={7} className="w-16 px-2 py-1 text-xs" />
                      <SubmitButton size="sm" variant="outline">
                        Ampliar prueba
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={cancelSubscription} inline confirm={`¿Cancelar la suscripción de ${s.site_name}?`}>
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <label className="sr-only" htmlFor={`mode-${s.id}`}>
                        Momento de la cancelación
                      </label>
                      <Select id={`mode-${s.id}`} name="mode" defaultValue="period_end" className="w-auto px-2 py-1 text-xs">
                        <option value="period_end">Al final del periodo</option>
                        <option value="now">Inmediatamente</option>
                      </Select>
                      <SubmitButton size="sm" variant="danger">
                        Cancelar
                      </SubmitButton>
                    </ActionForm>
                  </div>
                )}
              </Td>
            </Tr>
          ))}
          {!subscriptions.length && <EmptyRow cols={7}>Este usuario no tiene suscripciones.</EmptyRow>}
        </tbody>
      </DataTable>

      <h2 className="mb-2 mt-8 font-semibold">Sitios</h2>
      <DataTable caption="Sitios del usuario">
        <THead>
          <Th>Sitio</Th>
          <Th className="text-right">Artículos</Th>
          <Th>Última publicación</Th>
          <Th>Integraciones</Th>
          <Th>Salud</Th>
        </THead>
        <tbody>
          {sites.map((s) => (
            <Tr key={s.id}>
              <Td>
                <div className="font-medium">{s.name}</div>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-ink-3 hover:underline">
                  {s.url.replace(/^https?:\/\//, "")}
                </a>
              </Td>
              <Td className="text-right tabular-nums">{s.articles}</Td>
              <Td className="text-ink-2">{s.last_published_at ? fmtDate(s.last_published_at, long) : "Nunca"}</Td>
              <Td className="text-xs text-ink-2">{s.integrations.map((i) => i.provider).join(", ") || "—"}</Td>
              <Td>
                <HealthBadge health={s.health} />
              </Td>
            </Tr>
          ))}
          {!sites.length && <EmptyRow cols={5}>Sin sitios todavía.</EmptyRow>}
        </tbody>
      </DataTable>
    </>
  );
}
