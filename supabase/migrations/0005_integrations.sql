-- yeswecontent · integraciones OAuth reales, caché de analítica y publicación social
-- Las credenciales de `integrations.config` se guardan cifradas (AES-256-GCM) desde
-- la aplicación con INTEGRATIONS_ENCRYPTION_KEY: { v: 1, secret: "v1.…", account, meta }.

-- Estado de la integración: connected | error (token caducado o revocado)
alter table public.integrations add column if not exists updated_at timestamptz not null default now();

-- Los proveedores antiguos 'gsc' y 'ga4' (filas "pending" sin credenciales) pasan a 'google'.
delete from public.integrations where provider in ('gsc', 'ga4') and status = 'pending';

-- ───────── Analítica diaria (Search Console + GA4) ─────────
create table if not exists public.analytics_daily (
  site_id uuid not null references public.sites on delete cascade,
  date date not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr real not null default 0,          -- 0..1
  position real,                        -- posición media ponderada
  sessions integer not null default 0,  -- GA4: todas las sesiones
  ai_visits integer not null default 0, -- GA4: sesiones desde asistentes de IA
  ai_sources jsonb not null default '{}'::jsonb, -- {"ChatGPT": 12, "Perplexity": 3, …}
  updated_at timestamptz not null default now(),
  primary key (site_id, date)
);

-- Listados agregados (consultas y páginas principales de los últimos 28 días)
create table if not exists public.analytics_snapshots (
  site_id uuid not null references public.sites on delete cascade,
  kind text not null check (kind in ('top_queries', 'top_pages')),
  data jsonb not null default '[]'::jsonb,
  period_start date,
  period_end date,
  updated_at timestamptz not null default now(),
  primary key (site_id, kind)
);

alter table public.analytics_daily enable row level security;
alter table public.analytics_snapshots enable row level security;

-- Lectura para quien accede al sitio (incluye clientes de agencia). Escritura solo con service role (cron).
drop policy if exists "por sitio" on public.analytics_daily;
create policy "por sitio" on public.analytics_daily for select using (public.can_access_site(site_id));
drop policy if exists "por sitio" on public.analytics_snapshots;
create policy "por sitio" on public.analytics_snapshots for select using (public.can_access_site(site_id));

-- ───────── Publicación social ─────────
alter table public.social_posts drop constraint if exists social_posts_status_check;
alter table public.social_posts add constraint social_posts_status_check
  check (status in ('suggested', 'approved', 'scheduled', 'published', 'dismissed', 'failed'));
alter table public.social_posts add column if not exists published_url text;
alter table public.social_posts add column if not exists published_at timestamptz;
alter table public.social_posts add column if not exists external_id text;
alter table public.social_posts add column if not exists attempts integer not null default 0;
alter table public.social_posts add column if not exists last_error text;

create index if not exists social_posts_due_idx on public.social_posts (scheduled_for) where status = 'scheduled';

-- Bucket público con las imágenes de los carruseles (Instagram las descarga por URL).
insert into storage.buckets (id, name, public)
values ('social', 'social', true)
on conflict (id) do update set public = true;
