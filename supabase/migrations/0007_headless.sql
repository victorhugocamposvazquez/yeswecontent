-- yeswecontent · contenido headless (API pública, blog alojado, etiquetas)

-- Etiquetas por artículo (filtro ?tag= de la API y frontmatter `tags`)
alter table public.articles add column if not exists tags text[] not null default '{}';
create index if not exists articles_site_status_idx on public.articles (site_id, status, published_at desc);
create index if not exists articles_tags_idx on public.articles using gin (tags);

-- Claves de la API de contenido. Solo guardamos el SHA-256 de la clave;
-- el valor completo se muestra una única vez al crearla.
--   kind = 'secret'  → ywc_live_…  (servidor: Next.js, Nuxt, Astro, PHP…)
--   kind = 'public'  → ywc_pub_…   (navegador; restringible por origen)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  name text not null default 'Clave sin nombre',
  kind text not null default 'secret' check (kind in ('secret', 'public')),
  prefix text not null,                    -- primeros caracteres visibles, p. ej. "ywc_live_Ab12"
  key_hash text not null unique,           -- sha256 hex de la clave completa
  allowed_origins text[] not null default '{}', -- solo para kind = 'public'; vacío = cualquiera
  created_by uuid references public.profiles on delete set null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists api_keys_site_idx on public.api_keys (site_id) where revoked_at is null;

-- Blog alojado (blog.cliente.com por CNAME o cliente.com/blog por proxy inverso)
create table if not exists public.hosted_blogs (
  site_id uuid primary key references public.sites on delete cascade,
  enabled boolean not null default false,
  custom_domain text unique,               -- p. ej. "blog.cliente.com" (sin protocolo)
  public_base_url text,                    -- URL canónica base: "https://blog.cliente.com" o "https://cliente.com/blog"
  title text,
  tagline text,
  theme jsonb not null default '{}'::jsonb, -- {accent, background, text, font}
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────── RLS ─────────
alter table public.api_keys enable row level security;
alter table public.hosted_blogs enable row level security;

create policy "por sitio" on public.api_keys for all using (public.can_access_site(site_id)) with check (public.can_access_site(site_id));
create policy "por sitio" on public.hosted_blogs for all using (public.can_access_site(site_id)) with check (public.can_access_site(site_id));
-- El mapeo dominio → sitio es público (lo necesita el middleware con la clave anónima).
create policy "dominios públicos" on public.hosted_blogs for select using (enabled and custom_domain is not null);

-- La API pública lee con service role: `articles` sigue protegida por RLS para el resto.
