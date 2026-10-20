-- Ajustes globales editables desde el admin
create table if not exists public.app_settings (
  key text primary key,          -- 'global' | 'volume_discounts' | 'banned_domains'
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "ajustes admin" on public.app_settings for all using (public.is_admin());
