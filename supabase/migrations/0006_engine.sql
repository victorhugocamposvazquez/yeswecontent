-- yeswecontent · motor de contenidos: imágenes, enlazado interno y red de enlaces con créditos

-- ───────── Artículos: imágenes generadas ─────────
-- images: [{kind: 'cover'|'inline'|'infographic', url, alt, prompt, provider, section?}]
alter table public.articles add column if not exists images jsonb not null default '[]'::jsonb;

-- ───────── Sitios: autoridad de dominio ─────────
-- DR estimado (Ahrefs/Moz o manual desde el admin). null = desconocido.
alter table public.sites add column if not exists domain_rating integer check (domain_rating between 0 and 100);

-- ───────── Enlaces: artículo de origen ─────────
alter table public.backlink_links add column if not exists source_article_id uuid references public.articles on delete set null;
alter table public.backlink_links add column if not exists live_at timestamptz;
create index if not exists backlink_links_source_article_idx on public.backlink_links (source_article_id);
create index if not exists backlink_links_target_site_idx on public.backlink_links (target_site_id, created_at desc);
create index if not exists backlink_links_source_site_idx on public.backlink_links (source_site_id, created_at desc);

-- ───────── Libro de créditos de la red ─────────
-- +1 por cada enlace dado, −1 por cada enlace recibido. El saldo es la suma de delta.
-- El plan (plans.backlink_credits) limita cuántos enlaces se reciben al mes.
create table if not exists public.backlink_credits (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites on delete cascade,
  link_id uuid references public.backlink_links on delete set null,
  delta integer not null,
  reason text not null check (reason in ('welcome', 'earned', 'spent', 'refund', 'adjustment')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists backlink_credits_site_idx on public.backlink_credits (site_id, created_at desc);
alter table public.backlink_credits enable row level security;
drop policy if exists "créditos por sitio" on public.backlink_credits;
create policy "créditos por sitio" on public.backlink_credits for select using (public.can_access_site(site_id));
drop policy if exists "créditos admin" on public.backlink_credits;
create policy "créditos admin" on public.backlink_credits for all using (public.is_admin());

create or replace view public.backlink_credit_balances with (security_invoker = true) as
  select site_id, coalesce(sum(delta), 0)::integer as balance from public.backlink_credits group by site_id;

-- Devolución automática: si un enlace pasa a rechazado/retirado, se revierten
-- los movimientos (el receptor recupera su crédito y el emisor lo pierde).
create or replace function public.backlink_refund() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('rejected', 'removed') and old.status in ('pending', 'live') then
    insert into backlink_credits (site_id, link_id, delta, reason, note)
    select site_id, new.id, -delta, 'refund', 'Enlace ' || case new.status when 'rejected' then 'rechazado' else 'retirado' end
    from backlink_credits
    where link_id = new.id and reason in ('earned', 'spent');
  end if;
  if new.status = 'live' and old.status <> 'live' and new.live_at is null then
    new.live_at := now();
  end if;
  return new;
end $$;

drop trigger if exists backlink_links_refund on public.backlink_links;
create trigger backlink_links_refund before update of status on public.backlink_links
  for each row execute function public.backlink_refund();

-- Al borrar un artículo, sus enlaces pendientes o activos se retiran (y se devuelven los créditos).
create or replace function public.article_links_cleanup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update backlink_links set status = 'removed' where source_article_id = old.id and status in ('pending', 'live');
  return old;
end $$;

drop trigger if exists articles_links_cleanup on public.articles;
create trigger articles_links_cleanup before delete on public.articles
  for each row execute function public.article_links_cleanup();

-- ───────── Storage: bucket público para imágenes de artículos ─────────
insert into storage.buckets (id, name, public)
values ('articles', 'articles', true)
on conflict (id) do update set public = true;

drop policy if exists "articles lectura pública" on storage.objects;
create policy "articles lectura pública" on storage.objects for select using (bucket_id = 'articles');
drop policy if exists "articles subida miembros" on storage.objects;
create policy "articles subida miembros" on storage.objects for insert to authenticated
  with check (bucket_id = 'articles' and public.can_access_site(((storage.foldername(name))[1])::uuid));
drop policy if exists "articles cambios miembros" on storage.objects;
create policy "articles cambios miembros" on storage.objects for update to authenticated
  using (bucket_id = 'articles' and public.can_access_site(((storage.foldername(name))[1])::uuid));
