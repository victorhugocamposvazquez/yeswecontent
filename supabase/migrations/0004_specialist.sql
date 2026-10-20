-- Especialista SEO: conversaciones con el consultor de IA por sitio.
-- Las propuestas (tool use) se guardan en el mensaje y solo se aplican si el
-- usuario las confirma desde el panel.

create table if not exists public.specialist_threads (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  title text not null default 'Nueva conversación' check (char_length(title) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists specialist_threads_site_idx on public.specialist_threads (site_id, updated_at desc);

create table if not exists public.specialist_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.specialist_threads on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '' check (char_length(content) <= 40000),
  -- [{ id, kind: content_topic|tracked_prompt|audit_fix, status: pending|applied|dismissed, data }]
  tool_proposals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists specialist_messages_thread_idx on public.specialist_messages (thread_id, created_at);

-- Tareas de auditoría abiertas desde el especialista (u otras fuentes).
create table if not exists public.audit_tasks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  check_id text,
  title text not null check (char_length(title) between 1 and 200),
  detail text,
  priority text not null default 'media' check (priority in ('alta', 'media', 'baja')),
  status text not null default 'open' check (status in ('open', 'done', 'dismissed')),
  source text not null default 'specialist',
  created_at timestamptz not null default now()
);
create index if not exists audit_tasks_site_idx on public.audit_tasks (site_id, status, created_at desc);

-- Mantiene updated_at del hilo al añadir mensajes (para ordenar la lista).
create or replace function public.touch_specialist_thread() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update specialist_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists specialist_messages_touch on public.specialist_messages;
create trigger specialist_messages_touch after insert on public.specialist_messages
  for each row execute function public.touch_specialist_thread();

-- ───────── RLS ─────────

alter table public.specialist_threads enable row level security;
alter table public.specialist_messages enable row level security;
alter table public.audit_tasks enable row level security;

drop policy if exists "por sitio" on public.specialist_threads;
create policy "por sitio" on public.specialist_threads for all
  using (public.can_access_site(site_id))
  with check (public.can_access_site(site_id));

drop policy if exists "por sitio" on public.specialist_messages;
create policy "por sitio" on public.specialist_messages for all
  using (exists (select 1 from specialist_threads t where t.id = thread_id and public.can_access_site(t.site_id)))
  with check (exists (select 1 from specialist_threads t where t.id = thread_id and public.can_access_site(t.site_id)));

drop policy if exists "por sitio" on public.audit_tasks;
create policy "por sitio" on public.audit_tasks for all
  using (public.can_access_site(site_id))
  with check (public.can_access_site(site_id));
