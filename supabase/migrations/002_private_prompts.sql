-- Server-only prompt library. No public or authenticated client policies.
create table public.collection_prompts (
 collection_slug text not null,
 position integer not null check(position>=0),
 content text not null,
 primary key(collection_slug,position)
);
alter table public.collection_prompts enable row level security;
revoke all on public.collection_prompts from anon, authenticated;
grant all on public.collection_prompts to service_role;
-- image_jobs prompt column also stays internal: clients use the API progress summaries.
drop policy if exists own_images on public.image_jobs;
revoke all on public.image_jobs from anon, authenticated;
