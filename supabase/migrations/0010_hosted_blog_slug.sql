-- Dirección propia en nuestro dominio: tienda.blogs.yeswecontent.com y /b/tienda
alter table public.hosted_blogs add column if not exists slug text;
create unique index if not exists hosted_blogs_slug_idx on public.hosted_blogs (slug) where slug is not null;

-- El middleware (clave anónima) resuelve slug → sitio.
drop policy if exists "slug público" on public.hosted_blogs;
create policy "slug público" on public.hosted_blogs for select using (enabled and slug is not null);
