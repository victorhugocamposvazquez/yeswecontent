alter table public.hosted_blogs
  add column if not exists delivery_mode text not null default 'platform'
    check (delivery_mode in ('platform', 'subdomain', 'folder'));

comment on column public.hosted_blogs.delivery_mode is 'platform = /blog-hosted/{site}; subdomain = CNAME propio; folder = proxy a /blog en la web principal';

update public.hosted_blogs
set delivery_mode = case
  when custom_domain is not null then 'subdomain'
  when public_base_url is not null and public_base_url not like '%/blog-hosted/%' then 'folder'
  else 'platform'
end
where delivery_mode = 'platform';
