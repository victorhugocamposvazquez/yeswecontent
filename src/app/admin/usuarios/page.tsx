import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import {
  buildChips,
  DataTable,
  EmptyRow,
  FilterBar,
  FilterSelect,
  IconButton,
  RowActions,
  rowLink,
  SearchField,
  SelectAllTh,
  SelectTd,
  Sub,
  SubStatusBadge,
  subStatusOptions,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/admin/table";
import { listAdminPlans, listAdminUsers } from "@/lib/admin/data";
import { cn, eur, fmtDate, num } from "@/lib/utils";

export const metadata = { title: "Usuarios" };

type SP = Promise<{ q?: string; status?: string; plan?: string; role?: string }>;

export default async function UsersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { q = "", status = "", plan = "", role = "" } = sp;
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
  const chips = buildChips("/admin/usuarios", sp, {
    q: { label: "Buscar" },
    status: { label: "Estado", value: (v) => (v === "none" ? "Sin plan" : (subStatusOptions.find(([k]) => k === v)?.[1] ?? v)) },
    plan: { label: "Plan", value: (v) => planName(v) },
    role: { label: "Rol", value: (v) => (v === "admin" ? "Admin" : "Usuario") },
  });

  return (
    <>
      <PageHeader title="Usuarios" intro={`${num(users.length)} cuentas registradas. Busca por email, nombre o espacio de trabajo.`} />
      <FilterBar action="/admin/usuarios" resetHref="/admin/usuarios" chips={chips}>
        <SearchField defaultValue={q} placeholder="Email, nombre o empresa" />
        <FilterSelect label="Estado" name="status" defaultValue={status}>
          <option value="">Estado: todos</option>
          {subStatusOptions.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
          <option value="none">Sin plan</option>
        </FilterSelect>
        <FilterSelect label="Plan" name="plan" defaultValue={plan}>
          <option value="">Plan: todos</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Rol" name="role" defaultValue={role}>
          <option value="">Rol: todos</option>
          <option value="user">Usuario</option>
          <option value="admin">Admin</option>
        </FilterSelect>
      </FilterBar>

      <DataTable caption="Usuarios" count={rows.length} total={users.length} unit="usuarios" minWidth="min-w-[860px]">
        <THead>
          <SelectAllTh />
          <Th>Usuario</Th>
          <Th>Espacio</Th>
          <Th numeric>Sitios</Th>
          <Th>Plan</Th>
          <Th>Estado</Th>
          <Th numeric>MRR</Th>
          <Th numeric>Alta</Th>
          <Th className="w-12">
            <span className="sr-only">Acciones</span>
          </Th>
        </THead>
        <tbody>
          {rows.map((u) => (
            <Tr key={u.id}>
              <SelectTd label={u.full_name ?? u.email} />
              <Td>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/usuarios/${u.id}`} className={cn(rowLink, "truncate")}>
                    {u.full_name ?? "Sin nombre"}
                  </Link>
                  {u.role === "admin" && <Badge tone="lime">admin</Badge>}
                </div>
                <Sub>{u.email}</Sub>
              </Td>
              <Td muted>{u.workspace}</Td>
              <Td numeric>{u.sites}</Td>
              <Td>{planName(u.plan_id)}</Td>
              <Td>
                <SubStatusBadge status={u.status} />
              </Td>
              <Td numeric>{u.mrr_eur ? eur(u.mrr_eur) : "—"}</Td>
              <Td numeric muted>
                {fmtDate(u.created_at, { day: "numeric", month: "short", year: "2-digit" })}
              </Td>
              <Td>
                <RowActions>
                  <IconButton label={`Abrir ${u.full_name ?? u.email}`} href={`/admin/usuarios/${u.id}`}>
                    <ChevronRight className="size-4" aria-hidden />
                  </IconButton>
                </RowActions>
              </Td>
            </Tr>
          ))}
          {!rows.length && <EmptyRow cols={9} />}
        </tbody>
      </DataTable>
    </>
  );
}
