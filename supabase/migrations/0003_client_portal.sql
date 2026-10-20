-- yeswecontent · portal de clientes de agencia (marca blanca)
--
-- Modelo: una agencia (workspaces.kind = 'agency') tiene los sitios de sus
-- clientes dentro de su workspace. Los usuarios del cliente son miembros del
-- workspace con role = 'client' y, además, quedan atados a UN sitio concreto
-- mediante client_site_members. Así un cliente nunca ve los sitios de otros
-- clientes de la misma agencia.

-- ───────── tablas ─────────

-- Ficha comercial de cada cliente de la agencia (1:1 con el sitio)
create table if not exists public.agency_clients (
  site_id uuid primary key references public.sites on delete cascade,
  agency_workspace_id uuid not null references public.workspaces on delete cascade,
  client_name text not null,
  client_email text not null,
  visibility_mode text not null default 'resultados' check (visibility_mode in ('resultados', 'completo')),
  price_cents integer not null default 0 check (price_cents >= 0),  -- lo que la agencia cobra al cliente al mes
  currency text not null default 'EUR',
  booking_url text,                                                 -- enlace para reservar llamada con la agencia
  created_at timestamptz not null default now()
);
create index if not exists agency_clients_ws_idx on public.agency_clients (agency_workspace_id);

-- Personas del cliente con acceso a su sitio
create table if not exists public.client_site_members (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  user_id uuid references public.profiles on delete cascade,         -- null mientras la invitación está pendiente
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active')),
  invited_at timestamptz not null default now(),
  unique (site_id, email)
);
create index if not exists client_site_members_user_idx on public.client_site_members (user_id);

-- Ajustes que gestiona el propio cliente: kit de marca y dominio propio
create table if not exists public.client_site_settings (
  site_id uuid primary key references public.sites on delete cascade,
  brand jsonb not null default '{}'::jsonb,       -- {logo_url, colors[], fonts, guidelines, do[], dont[]}
  custom_domain text,
  domain_verified_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Facturas que la agencia emite a su cliente (no son las de yeswecontent)
create table if not exists public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade, -- agencia emisora
  site_id uuid not null references public.sites on delete cascade,
  number text not null,
  concept text not null default 'Servicio mensual de contenidos',
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  issued_at date not null default current_date,
  due_at date,
  pdf_url text,
  created_at timestamptz not null default now(),
  unique (workspace_id, number)
);
create index if not exists client_invoices_site_idx on public.client_invoices (site_id, issued_at desc);

-- Conversación entre cliente y equipo de la agencia
create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  author_id uuid references public.profiles on delete set null,
  author_name text not null,                       -- desnormalizado: el cliente no puede leer perfiles ajenos
  author_side text not null check (author_side in ('agency', 'client')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists client_messages_site_idx on public.client_messages (site_id, created_at);

-- ───────── funciones de ayuda ─────────

-- ¿El usuario es miembro de la agencia (owner/editor/viewer) dueña del sitio?
create or replace function public.is_agency_member_of_site(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sites st
    join workspaces w on w.id = st.workspace_id and w.kind = 'agency'
    join workspace_members m on m.workspace_id = w.id
    where st.id = s and m.user_id = auth.uid() and m.role in ('owner', 'editor', 'viewer')
  );
$$;

-- ¿Puede gestionar (escribir)? Solo owner/editor.
create or replace function public.can_manage_agency_site(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from sites st
    join workspaces w on w.id = st.workspace_id and w.kind = 'agency'
    join workspace_members m on m.workspace_id = w.id
    where st.id = s and m.user_id = auth.uid() and m.role in ('owner', 'editor')
  );
$$;

create or replace function public.is_agency_editor(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from workspaces w join workspace_members m on m.workspace_id = w.id
    where w.id = ws and w.kind = 'agency' and m.user_id = auth.uid() and m.role in ('owner', 'editor')
  );
$$;

-- ¿El usuario es cliente con acceso a ESTE sitio?
create or replace function public.is_client_of_site(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from client_site_members c
    join sites st on st.id = c.site_id
    join workspace_members m on m.workspace_id = st.workspace_id and m.user_id = c.user_id and m.role = 'client'
    where c.site_id = s and c.user_id = auth.uid()
  );
$$;

-- ¿El usuario solo tiene rol cliente en el workspace del sitio? (para bloquear escrituras)
create or replace function public.is_client_role_on_site(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sites st
    join workspace_members m on m.workspace_id = st.workspace_id
    where st.id = s and m.user_id = auth.uid() and m.role = 'client'
  );
$$;

-- Sustituye la versión de 0001: un miembro con rol 'client' solo accede a los
-- sitios a los que está atado en client_site_members, no a todo el workspace.
create or replace function public.can_access_site(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from sites st
    join workspace_members m on m.workspace_id = st.workspace_id
    where st.id = s and m.user_id = auth.uid() and m.role <> 'client'
  ) or public.is_client_of_site(s);
$$;

-- ───────── RLS ─────────

alter table public.agency_clients enable row level security;
alter table public.client_site_members enable row level security;
alter table public.client_site_settings enable row level security;
alter table public.client_invoices enable row level security;
alter table public.client_messages enable row level security;

-- agency_clients: la agencia gestiona; el cliente lee su ficha
create policy "agencia gestiona" on public.agency_clients for all
  using (public.is_agency_editor(agency_workspace_id))
  with check (public.is_agency_editor(agency_workspace_id) and exists (select 1 from sites st where st.id = agency_clients.site_id and st.workspace_id = agency_clients.agency_workspace_id));
create policy "agencia lee" on public.agency_clients for select using (public.is_agency_member_of_site(site_id));
create policy "cliente lee" on public.agency_clients for select using (public.is_client_of_site(site_id));

-- client_site_members: la agencia gestiona; el cliente ve a su equipo y su propia fila
create policy "agencia gestiona" on public.client_site_members for all
  using (public.can_manage_agency_site(site_id)) with check (public.can_manage_agency_site(site_id));
create policy "cliente ve su equipo" on public.client_site_members for select
  using (user_id = auth.uid() or public.is_client_of_site(site_id));
-- Las invitaciones del cliente las crea el servidor con service role tras comprobar permisos.

-- client_site_settings: agencia y cliente leen y escriben
create policy "agencia gestiona" on public.client_site_settings for all
  using (public.can_manage_agency_site(site_id)) with check (public.can_manage_agency_site(site_id));
create policy "cliente lee" on public.client_site_settings for select using (public.is_client_of_site(site_id));
create policy "cliente crea" on public.client_site_settings for insert with check (public.is_client_of_site(site_id));
create policy "cliente actualiza" on public.client_site_settings for update
  using (public.is_client_of_site(site_id)) with check (public.is_client_of_site(site_id));

-- client_invoices: la agencia gestiona; el cliente solo lee las emitidas (no borradores)
create policy "agencia gestiona" on public.client_invoices for all
  using (public.is_agency_editor(workspace_id))
  with check (public.is_agency_editor(workspace_id) and exists (select 1 from sites st where st.id = client_invoices.site_id and st.workspace_id = client_invoices.workspace_id));
create policy "cliente lee" on public.client_invoices for select
  using (status <> 'draft' and public.is_client_of_site(site_id));

-- client_messages: ambos leen; cada lado inserta como sí mismo
create policy "agencia lee" on public.client_messages for select using (public.is_agency_member_of_site(site_id));
create policy "agencia escribe" on public.client_messages for insert
  with check (author_id = auth.uid() and author_side = 'agency' and public.can_manage_agency_site(site_id));
create policy "cliente lee" on public.client_messages for select using (public.is_client_of_site(site_id));
create policy "cliente escribe" on public.client_messages for insert
  with check (author_id = auth.uid() and author_side = 'client' and public.is_client_of_site(site_id));

-- El cliente es de solo lectura en el resto del producto: políticas RESTRICTIVAS
-- que bloquean escrituras de miembros con rol 'client' (las de 0001 son "for all").
do $$
declare t text; cmd text;
begin
  foreach t in array array['content_items', 'articles', 'competitors', 'ai_prompts', 'social_posts'] loop
    foreach cmd in array array['insert', 'update', 'delete'] loop
      execute format(
        'create policy "cliente solo lectura %2$s" on public.%1$I as restrictive for %2$s %3$s',
        t, cmd,
        case cmd when 'insert' then 'with check (not public.is_client_role_on_site(site_id))'
                 else 'using (not public.is_client_role_on_site(site_id))' end
      );
    end loop;
  end loop;
end $$;

create policy "cliente no edita sitios" on public.sites as restrictive for update using (not public.is_client_role_on_site(id));
create policy "cliente no borra sitios" on public.sites as restrictive for delete using (not public.is_client_role_on_site(id));
create policy "cliente no crea sitios" on public.sites as restrictive for insert
  with check (not exists (select 1 from workspace_members m where m.workspace_id = sites.workspace_id and m.user_id = auth.uid() and m.role = 'client'));

-- El cliente puede leer el workspace de la agencia (para la marca blanca) pero no modificarlo
create policy "cliente no edita workspace" on public.workspaces as restrictive for update
  using (not exists (select 1 from workspace_members m where m.workspace_id = workspaces.id and m.user_id = auth.uid() and m.role = 'client'));
create policy "cliente no borra workspace" on public.workspaces as restrictive for delete
  using (not exists (select 1 from workspace_members m where m.workspace_id = workspaces.id and m.user_id = auth.uid() and m.role = 'client'));

-- Al aceptar la invitación, activa la fila del cliente (llamado desde el servidor)
create or replace function public.activate_client_membership() returns void
language sql security definer set search_path = public as $$
  update client_site_members c set status = 'active', user_id = auth.uid()
  where lower(c.email) = lower((select email from profiles where id = auth.uid()))
    and (c.user_id is null or c.user_id = auth.uid())
    and c.status = 'invited';
$$;
