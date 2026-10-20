-- yeswecontent · esquema inicial
create extension if not exists "pgcrypto";

-- Perfiles (1:1 con auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Espacios de trabajo (una empresa o una agencia)
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'business' check (kind in ('business', 'agency')),
  owner_id uuid not null references public.profiles on delete cascade,
  white_label jsonb not null default '{}'::jsonb, -- {logo_url, primary_color, custom_domain}
  referral_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid references public.workspaces on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer', 'client')),
  primary key (workspace_id, user_id)
);

-- Planes (editables desde el admin)
create table public.plans (
  id text primary key,                 -- 'semilla', 'cosecha', 'agencia'
  name text not null,
  monthly_price_eur integer not null,  -- céntimos
  yearly_price_eur integer not null,   -- céntimos por mes en pago anual
  articles_per_month integer not null,
  tracked_prompts integer not null,
  languages integer not null,
  seats integer,                       -- null = ilimitados
  social_cadence text not null,        -- 'weekly' | 'daily'
  backlink_credits integer not null,
  features jsonb not null default '[]'::jsonb,
  stripe_price_monthly text,
  stripe_price_yearly text,
  active boolean not null default true,
  sort integer not null default 0
);

-- Sitios web (la unidad que se factura)
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  url text not null,
  name text not null,
  language text not null default 'es',
  extra_languages text[] not null default '{}',
  niche text,
  audience text,
  description text,
  brand_voice jsonb not null default '{}'::jsonb,    -- {tone, person, avoid[], examples[]}
  seo_settings jsonb not null default '{}'::jsonb,   -- {min_words, internal_links, faq, schema}
  visual_style jsonb not null default '{}'::jsonb,   -- {style, palette}
  schedule jsonb not null default '{"days":["mon","wed","fri"],"time":"09:00","mode":"drip"}'::jsonb,
  onboarding_step text not null default 'website',
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  plan_id text not null references public.plans,
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  interval text not null default 'year' check (interval in ('month', 'year')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  url text not null,
  name text
);

-- Plan de contenidos: temas planificados
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  title text not null,
  keyword text not null,
  cluster text,
  intent text check (intent in ('informational', 'commercial', 'transactional', 'navigational')),
  search_volume integer,
  difficulty integer,
  language text not null default 'es',
  scheduled_for date,
  status text not null default 'planned' check (status in ('planned', 'writing', 'review', 'scheduled', 'published', 'skipped')),
  kind text not null default 'new' check (kind in ('new', 'refresh')),
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  content_item_id uuid references public.content_items on delete set null,
  title text not null,
  slug text not null,
  meta_description text,
  body_md text not null default '',
  faq jsonb not null default '[]'::jsonb,
  schema_jsonld jsonb,
  cover_url text,
  language text not null default 'es',
  word_count integer not null default 0,
  quality_score integer,
  quality_breakdown jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'scheduled', 'published', 'failed')),
  published_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Integraciones (CMS, GSC, GA4, Meta, Reddit…)
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  provider text not null,  -- wordpress | shopify | webflow | ghost | webhook | gsc | ga4 | meta | reddit | quora
  status text not null default 'connected',
  config jsonb not null default '{}'::jsonb, -- credenciales cifradas o referencias a vault
  created_at timestamptz not null default now(),
  unique (site_id, provider)
);

-- Visibilidad en IA
create table public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  prompt text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.ai_checks (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.ai_prompts on delete cascade,
  model text not null,              -- chatgpt | claude | gemini | perplexity
  mentioned boolean not null,
  position integer,
  cited_urls text[] not null default '{}',
  competitors_mentioned text[] not null default '{}',
  answer_excerpt text,
  checked_at timestamptz not null default now()
);

-- Auditoría técnica / GEO
create table public.audits (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites on delete cascade,
  url text not null,
  score integer,
  results jsonb not null default '[]'::jsonb,
  share_token text unique default substr(md5(random()::text), 1, 12),
  created_at timestamptz not null default now()
);

-- Red de intercambio de enlaces
create table public.backlink_links (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid not null references public.sites on delete cascade,
  target_site_id uuid not null references public.sites on delete cascade,
  source_article_url text,
  target_url text not null,
  anchor text not null,
  domain_rating integer,
  status text not null default 'pending' check (status in ('pending', 'live', 'rejected', 'removed')),
  created_at timestamptz not null default now()
);

-- Social (Reddit, Quora, Instagram, Facebook)
create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  article_id uuid references public.articles on delete set null,
  channel text not null check (channel in ('reddit', 'quora', 'instagram', 'facebook')),
  kind text not null default 'post', -- post | reply | carousel
  thread_url text,
  content text not null,
  slides jsonb,
  status text not null default 'suggested' check (status in ('suggested', 'approved', 'scheduled', 'published', 'dismissed')),
  scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

-- Leads de herramientas gratuitas
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  email text,
  url text,
  tool text not null,
  created_at timestamptz not null default now()
);

-- Casos de éxito y novedades (CMS interno)
create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  company text not null,
  sector text,
  summary text not null,
  body_md text not null default '',
  metric_before integer,
  metric_after integer,
  metric_label text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body_md text not null,
  tag text,
  published_at timestamptz not null default now()
);

-- ───────── RLS ─────────
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.plans enable row level security;
alter table public.sites enable row level security;
alter table public.subscriptions enable row level security;
alter table public.competitors enable row level security;
alter table public.content_items enable row level security;
alter table public.articles enable row level security;
alter table public.integrations enable row level security;
alter table public.ai_prompts enable row level security;
alter table public.ai_checks enable row level security;
alter table public.audits enable row level security;
alter table public.backlink_links enable row level security;
alter table public.social_posts enable row level security;
alter table public.leads enable row level security;
alter table public.case_studies enable row level security;
alter table public.product_updates enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.can_access_site(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from sites st
    join workspace_members m on m.workspace_id = st.workspace_id
    where st.id = s and m.user_id = auth.uid()
  );
$$;

create policy "perfil propio" on public.profiles for all using (id = auth.uid() or public.is_admin());
create policy "workspaces miembros" on public.workspaces for all using (
  public.is_admin() or exists (select 1 from workspace_members m where m.workspace_id = id and m.user_id = auth.uid())
);
create policy "miembros visibles" on public.workspace_members for select using (
  public.is_admin() or user_id = auth.uid()
);
create policy "planes públicos" on public.plans for select using (true);
create policy "planes admin" on public.plans for all using (public.is_admin());
create policy "sitios" on public.sites for all using (public.can_access_site(id));

create policy "por sitio" on public.subscriptions for select using (public.can_access_site(site_id));
create policy "por sitio" on public.competitors for all using (public.can_access_site(site_id));
create policy "por sitio" on public.content_items for all using (public.can_access_site(site_id));
create policy "por sitio" on public.articles for all using (public.can_access_site(site_id));
create policy "por sitio" on public.integrations for all using (public.can_access_site(site_id));
create policy "por sitio" on public.ai_prompts for all using (public.can_access_site(site_id));
create policy "por sitio" on public.ai_checks for select using (
  exists (select 1 from ai_prompts p where p.id = prompt_id and public.can_access_site(p.site_id))
);
create policy "por sitio" on public.audits for select using (site_id is null or public.can_access_site(site_id));
create policy "por sitio" on public.backlink_links for select using (
  public.can_access_site(source_site_id) or public.can_access_site(target_site_id)
);
create policy "por sitio" on public.social_posts for all using (public.can_access_site(site_id));
create policy "leads admin" on public.leads for select using (public.is_admin());
create policy "casos públicos" on public.case_studies for select using (published or public.is_admin());
create policy "casos admin" on public.case_studies for all using (public.is_admin());
create policy "novedades públicas" on public.product_updates for select using (true);
create policy "novedades admin" on public.product_updates for all using (public.is_admin());

-- Alta automática de perfil + workspace al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  insert into profiles (id, email, full_name) values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  insert into workspaces (name, owner_id) values (coalesce(new.raw_user_meta_data->>'company', 'Mi espacio'), new.id) returning id into ws;
  insert into workspace_members (workspace_id, user_id, role) values (ws, new.id, 'owner');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
