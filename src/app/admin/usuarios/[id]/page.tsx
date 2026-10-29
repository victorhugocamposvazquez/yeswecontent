import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, UserCog } from "lucide-react";
import { Badge, Card, CardHeader, Input, PageHeader, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { DangerZone, DataTable, DetailLayout, EmptyRow, HealthBadge, IconButton, KeyValue, RowActions, Sub, SubStatusBadge, Td, Th, THead, Tr } from "@/components/admin/table";
import { UsageMeter } from "@/components/admin/UsageMeter";
import { getUserDetail, listAdminPlans } from "@/lib/admin/data";
import { stripeDashboardUrl } from "@/lib/admin/links";
import { eur, fmtDate } from "@/lib/utils";
import { cancelSubscription, extendTrial, setUserRole } from "../../actions";

export const metadata = { title: "Detalle de usuario" };

const long = { day: "numeric", month: "short", year: "numeric" } as const;

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d, plans] = await Promise.all([getUserDetail(id), listAdminPlans()]);
  if (!d) notFound();
  const { user, workspace, sites, subscriptions, usage } = d;
  const planName = (pid: string | null) => plans.find((p) => p.id === pid)?.name ?? pid ?? "—";
  const cancellable = subscriptions.filter((s) => s.status !== "canceled");

  return (
    <>
      <PageHeader
        title={user.full_name ?? user.email}
        crumbs={
          <Link href="/admin/usuarios" className="hover:text-ink">
            ← Usuarios
          </Link>
        }
        intro={
          <span className="inline-flex flex-wrap items-center gap-2">
            {user.email}
            <Badge tone={user.role === "admin" ? "lime" : "neutral"}>{user.role === "admin" ? "Admin" : "Usuario"}</Badge>
            <SubStatusBadge status={user.status} />
          </span>
        }
        actions={
          <span className="inline-flex flex-col items-end gap-1">
            <button type="button" disabled className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-lg bg-ink/40 px-3 text-sm font-medium text-paper opacity-70 sm:h-9">
              <UserCog className="size-4" aria-hidden /> Entrar como este usuario
            </button>
            <span className="max-w-[14rem] text-right text-[11px] text-ink-3">Pendiente de cablear sesión; no cambia el panel todavía.</span>
          </span>
        }
      />

      <DetailLayout
        rail={
          <>
            <Card>
              <CardHeader title="Espacio de trabajo" className="px-4 py-3" />
              <div className="px-4 py-3">
                {workspace ? (
                  <KeyValue
                    items={[
                      { k: "Nombre", v: workspace.name },
                      { k: "Tipo", v: workspace.kind === "agency" ? "Agencia (marca blanca)" : "Empresa" },
                      { k: "Sitios", v: sites.length },
                      { k: "Plan", v: planName(user.plan_id) },
                      { k: "MRR", v: user.mrr_eur ? eur(user.mrr_eur) : "—" },
                      { k: "Alta", v: fmtDate(user.created_at, long) },
                      { k: "ID", v: user.id, mono: true },
                    ]}
                  />
                ) : (
                  <p className="text-[13px] text-ink-3">Sin espacio de trabajo propio.</p>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Rol" intro="Los admins ven todos los datos de todos los clientes." className="px-4 py-3" />
              <ActionForm action={setUserRole} className="px-4 py-3">
                <input type="hidden" name="userId" value={user.id} />
                <label htmlFor="role" className="sr-only">
                  Rol
                </label>
                <div className="flex gap-2">
                  <Select id="role" name="role" defaultValue={user.role} className="h-9 text-[13px]">
                    <option value="user">Usuario</option>
                    <option value="admin">Admin</option>
                  </Select>
                  <SubmitButton size="sm" className="h-9">
                    Guardar
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>

            <DangerZone intro="Acciones con efecto inmediato en la facturación del cliente.">
              {cancellable.length ? (
                cancellable.map((s) => (
                  <ActionForm key={s.id} action={cancelSubscription} confirm={`¿Cancelar la suscripción de ${s.site_name}?`} className="rounded-lg border border-line bg-paper-2/50 p-3">
                    <input type="hidden" name="subscriptionId" value={s.id} />
                    <p className="mb-2 text-[13px] font-medium">
                      {s.site_name} <span className="font-normal text-ink-3">· {planName(s.plan_id)}</span>
                    </p>
                    <label className="sr-only" htmlFor={`mode-${s.id}`}>
                      Momento de la cancelación
                    </label>
                    <div className="flex gap-2">
                      <Select id={`mode-${s.id}`} name="mode" defaultValue="period_end" className="h-9 text-[13px]">
                        <option value="period_end">Al final del periodo</option>
                        <option value="now">Inmediatamente</option>
                      </Select>
                      <SubmitButton size="sm" variant="danger" className="h-9">
                        Cancelar
                      </SubmitButton>
                    </div>
                  </ActionForm>
                ))
              ) : (
                <p className="text-[13px] text-ink-3">Sin suscripciones activas que cancelar.</p>
              )}
              <p className="text-xs text-ink-3">La suplantación está deshabilitada hasta cablear la sesión real y auditoría.</p>
            </DangerZone>
          </>
        }
      >
        <Card>
          <CardHeader title="Uso frente al plan" intro={`${planName(user.plan_id)} · límites multiplicados por nº de sitios`} className="px-4 py-3 sm:px-5" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
            {usage.map((u) => (
              <UsageMeter key={u.label} {...u} />
            ))}
          </div>
        </Card>

        <DataTable caption="Suscripciones del usuario" title="Suscripciones" count={subscriptions.length} unit="suscripciones" minWidth="min-w-[760px]">
          <THead>
            <Th>Sitio</Th>
            <Th>Plan</Th>
            <Th>Estado</Th>
            <Th numeric>MRR</Th>
            <Th>Prueba / renovación</Th>
            <Th>Stripe</Th>
            <Th className="w-52 text-right">Prueba</Th>
          </THead>
          <tbody>
            {subscriptions.map((s) => (
              <Tr key={s.id} tone={s.status === "past_due" ? "warn" : undefined}>
                <Td className="font-medium">{s.site_name}</Td>
                <Td>
                  {planName(s.plan_id)}
                  <Sub>{s.interval === "year" ? "Anual" : "Mensual"}</Sub>
                </Td>
                <Td>
                  <SubStatusBadge status={s.status} />
                </Td>
                <Td numeric>{s.mrr_eur ? eur(s.mrr_eur) : "—"}</Td>
                <Td muted className="whitespace-nowrap">
                  {s.status === "trialing" && s.trial_ends_at
                    ? `Prueba hasta ${fmtDate(s.trial_ends_at, long)}`
                    : s.current_period_end
                      ? `${s.status === "canceled" ? "Terminó" : "Renueva"} ${fmtDate(s.current_period_end, long)}`
                      : "—"}
                </Td>
                <Td>
                  {s.stripe_subscription_id ? (
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      {s.stripe_subscription_id}
                      <IconButton label="Abrir en Stripe" href={stripeDashboardUrl("subscriptions", s.stripe_subscription_id)} external className="size-8 sm:size-7">
                        <ExternalLink className="size-3.5" aria-hidden />
                      </IconButton>
                    </span>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </Td>
                <Td>
                  {s.status !== "canceled" ? (
                    <ActionForm action={extendTrial} inline className="justify-end">
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <label className="sr-only" htmlFor={`days-${s.id}`}>
                        Días de prueba extra
                      </label>
                      <RowActions className="gap-1.5">
                        <Input id={`days-${s.id}`} name="days" type="number" min={1} max={60} defaultValue={7} className="tabular h-8 w-16 px-2 text-[13px]" />
                        <SubmitButton size="sm" variant="outline" className="h-8 px-2.5">
                          Ampliar prueba
                        </SubmitButton>
                      </RowActions>
                    </ActionForm>
                  ) : (
                    <span className="block text-right text-ink-3">—</span>
                  )}
                </Td>
              </Tr>
            ))}
            {!subscriptions.length && <EmptyRow cols={7}>Este usuario no tiene suscripciones.</EmptyRow>}
          </tbody>
        </DataTable>

        <DataTable caption="Sitios del usuario" title="Sitios" count={sites.length} unit="sitios" minWidth="min-w-[720px]">
          <THead>
            <Th>Sitio</Th>
            <Th numeric>Artículos</Th>
            <Th>Última publicación</Th>
            <Th>Integraciones</Th>
            <Th>Salud</Th>
            <Th className="w-12">
              <span className="sr-only">Acciones</span>
            </Th>
          </THead>
          <tbody>
            {sites.map((s) => (
              <Tr key={s.id} tone={s.health === "bad" ? "bad" : undefined}>
                <Td>
                  <div className="font-medium">{s.name}</div>
                  <Sub>{s.url.replace(/^https?:\/\//, "")}</Sub>
                </Td>
                <Td numeric>{s.articles}</Td>
                <Td muted>{s.last_published_at ? fmtDate(s.last_published_at, long) : "Nunca"}</Td>
                <Td className="text-xs text-ink-2">{s.integrations.map((i) => i.provider).join(", ") || "—"}</Td>
                <Td>
                  <HealthBadge health={s.health} />
                </Td>
                <Td>
                  <RowActions>
                    <IconButton label={`Abrir ${s.name}`} href={s.url} external>
                      <ExternalLink className="size-4" aria-hidden />
                    </IconButton>
                  </RowActions>
                </Td>
              </Tr>
            ))}
            {!sites.length && <EmptyRow cols={6}>Sin sitios todavía.</EmptyRow>}
          </tbody>
        </DataTable>
      </DetailLayout>
    </>
  );
}
