import Link from "next/link";
import { Badge, Input, PageHeader, Select } from "@/components/ui";
import { DataTable, EmptyRow, FilterBar, FilterField, SubStatusBadge, subStatusOptions, Td, Th, THead, Tr } from "@/components/admin/table";
import { listAdminPlans, listAdminUsers } from "@/lib/admin/data";
import { eur, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Usuarios" };

type SP = Promise<{ q?: string; status?: string; plan?: string; role?: string }>;

export default async function UsersPage({ searchParams }: { searchParams: SP }) {
  const { q = "", status = "", plan = "", role = "" } = await searchParams;
  const [users, plans] = await Promise.all([listAdminUsers(), listAdminPlans()]);
  const needle = q.trim().toLowerCase();
  const rows = users.filter(
    (u) =>
      (!needle || [u.email, u.full_name ?? "", u.workspace].some((v) => v.toLowerCase().includes(needle))) &&
      (!status || (status === "none" ? !u.status : u.status === status)) &&
      (!plan || u.plan_id === plan) &&
      (!role || u.role === role),
  );
  const planName = (id: string | null) => plans.find((p) => p.id === id)?.name ?? id ?? "—";

  return (
    <>
      <PageHeader title="Usuarios" intro={`${num(users.length)} cuentas registradas. Busca por email, nombre o espacio de trabajo.`} />
      <FilterBar action="/admin/usuarios" resetHref="/admin/usuarios">
        <FilterField label="Buscar" className="min-w-56 flex-1">
          <Input type="search" name="q" defaultValue={q} placeholder="email, nombre o empresa" />
        </FilterField>
        <FilterField label="Estado">
          <Select name="status" defaultValue={status}>
            <option value="">Todos</option>
            {subStatusOptions.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
            <option value="none">Sin plan</option>
          </Select>
        </FilterField>
        <FilterField label="Plan">
          <Select name="plan" defaultValue={plan}>
            <option value="">Todos</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Rol">
          <Select name="role" defaultValue={role}>
            <option value="">Todos</option>
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable caption="Usuarios" footer={`${num(rows.length)} de ${num(users.length)} usuarios`}>
        <THead>
          <Th>Usuario</Th>
          <Th>Espacio</Th>
          <Th className="text-right">Sitios</Th>
          <Th>Plan</Th>
          <Th>Estado</Th>
          <Th className="text-right">MRR</Th>
          <Th className="text-right">Alta</Th>
        </THead>
        <tbody>
          {rows.map((u) => (
            <Tr key={u.id}>
              <Td>
                <Link href={`/admin/usuarios/${u.id}`} className="font-medium hover:underline">
                  {u.full_name ?? "Sin nombre"}
                </Link>
                {u.role === "admin" && (
                  <Badge tone="lime" className="ml-2 align-middle">
                    admin
                  </Badge>
                )}
                <div className="text-xs text-ink-3">{u.email}</div>
              </Td>
              <Td>{u.workspace}</Td>
              <Td className="text-right tabular-nums">{u.sites}</Td>
              <Td>{planName(u.plan_id)}</Td>
              <Td>
                <SubStatusBadge status={u.status} />
              </Td>
              <Td className="text-right tabular-nums">{u.mrr_eur ? eur(u.mrr_eur) : "—"}</Td>
              <Td className="text-right tabular-nums text-ink-2">{fmtDate(u.created_at, { day: "numeric", month: "short", year: "2-digit" })}</Td>
            </Tr>
          ))}
          {!rows.length && <EmptyRow cols={7} />}
        </tbody>
      </DataTable>
    </>
  );
}
