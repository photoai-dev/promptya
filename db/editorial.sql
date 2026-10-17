-- Public editorial content only. Internal generation prompts stay in collection_prompts.
create table if not exists public.editorial_pages (
 source_route text not null check (source_route ~ '^/'),
 locale text not null check (locale in ('fr','en','es','it','pt','de','nl','br','cz')),
 kind text not null check (kind in ('page','pack','article','guide','character')),
 title text not null default '', description text not null default '',
 blocks jsonb not null default '{}'::jsonb check (jsonb_typeof(blocks)='object'),
 published boolean not null default true,
 revision integer not null default 1 check (revision>0),
 updated_at timestamptz not null default now(), primary key (source_route,locale)
);
alter table public.editorial_pages enable row level security;
revoke all on public.editorial_pages from anon,authenticated;
grant select on public.editorial_pages to anon,authenticated;
grant all on public.editorial_pages to service_role;
create policy "Published editorial content is public" on public.editorial_pages for select to anon,authenticated using (published=true);
