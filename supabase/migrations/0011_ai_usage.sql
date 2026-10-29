-- Consumo interno de APIs de IA por sitio / espacio de trabajo (coste Anthropic, OpenAI, etc.)
create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  site_id uuid references public.sites on delete set null,
  workspace_id uuid references public.workspaces on delete set null,
  provider text not null,              -- anthropic | openai | gemini | perplexity
  model text not null default '',
  purpose text not null default 'other', -- article | plan | image | image_brief | specialist | visibility | links | analyze | other
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists ai_usage_events_created_idx on public.ai_usage_events (created_at desc);
create index if not exists ai_usage_events_site_idx on public.ai_usage_events (site_id, created_at desc);
create index if not exists ai_usage_events_workspace_idx on public.ai_usage_events (workspace_id, created_at desc);

alter table public.ai_usage_events enable row level security;
create policy "ai_usage admin" on public.ai_usage_events for all using (public.is_admin());

comment on table public.ai_usage_events is 'Coste interno de llamadas a modelos (no es facturación al cliente).';
