-- Invitaciones de equipo al workspace (email real cuando Resend esté activo)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer', 'client')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);

create index if not exists invitations_workspace_idx on public.invitations (workspace_id, status);
create index if not exists invitations_email_idx on public.invitations (lower(email));

alter table public.invitations enable row level security;

create policy "invitations select" on public.invitations for select using (
  public.is_admin()
  or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = invitations.workspace_id and m.user_id = auth.uid()
  )
);

create policy "invitations insert" on public.invitations for insert with check (
  public.is_admin()
  or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = invitations.workspace_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'editor')
  )
);

create policy "invitations update" on public.invitations for update using (
  public.is_admin()
  or exists (
    select 1 from public.workspace_members m
    where m.workspace_id = invitations.workspace_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'editor')
  )
);

comment on table public.invitations is 'Invitaciones pendientes al workspace; el envío de email requiere Resend.';
