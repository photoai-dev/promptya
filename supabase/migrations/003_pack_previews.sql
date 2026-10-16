-- Four real images per pack, private until an administrator approves publication.
create table public.pack_preview_batches (
 id uuid primary key default gen_random_uuid(), pack_slug text not null,
 model text not null default 'flux-schnell', created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), status text not null default 'queued'
 check(status in ('queued','processing','review','published','failed')),
 published boolean not null default false, preview_manifest jsonb not null default '[]'::jsonb
);
create unique index one_published_preview_per_pack on public.pack_preview_batches(pack_slug) where published;
create table public.pack_preview_jobs (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.pack_preview_batches(id),
 position integer not null check(position between 0 and 3), prompt text not null,
 status text not null default 'queued' check(status in ('queued','processing','completed','failed')),
 prediction_id text, output_path text, error text, lease_until timestamptz,
 unique(batch_id,position)
);
alter table public.pack_preview_batches enable row level security;
alter table public.pack_preview_jobs enable row level security;
revoke all on public.pack_preview_batches, public.pack_preview_jobs from anon,authenticated;
grant all on public.pack_preview_batches, public.pack_preview_jobs to service_role;
insert into storage.buckets(id,name,public,file_size_limit)
values ('pack-examples','pack-examples',true,10485760) on conflict(id) do nothing;
-- No client write policies. Public bucket only receives approved, server-copied images.
create function public.enqueue_pack_preview(p_pack text,p_actor uuid,p_prompts jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare batch uuid;
begin
 if jsonb_array_length(p_prompts)<>4 then raise exception 'Four prompts required'; end if;
 perform pg_advisory_xact_lock(hashtext('pack-preview:'||p_pack));
 select id into batch from pack_preview_batches where pack_slug=p_pack and status in ('queued','processing','review') order by created_at desc limit 1;
 if batch is not null then return batch; end if;
 insert into pack_preview_batches(pack_slug,created_by) values(p_pack,p_actor) returning id into batch;
 insert into pack_preview_jobs(batch_id,position,prompt)
 select batch,ordinality::integer-1,value from jsonb_array_elements_text(p_prompts) with ordinality;
 return batch;
end $$;
create function public.claim_preview_jobs(p_limit integer default 3)
returns setof public.pack_preview_jobs language sql security definer set search_path=public as $$
 update pack_preview_jobs set lease_until=now()+interval '3 minutes'
 where id in (select id from pack_preview_jobs where status in ('queued','processing')
 and (lease_until is null or lease_until<now()) order by batch_id,position
 for update skip locked limit least(p_limit,3)) returning *;
$$;
create function public.publish_pack_preview(p_batch uuid,p_manifest jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare slug text;
begin
 select pack_slug into slug from pack_preview_batches where id=p_batch for update;
 if slug is null or (select count(*) from pack_preview_jobs where batch_id=p_batch and status='completed')<>4 or jsonb_array_length(p_manifest)<>4 then raise exception 'Batch not ready'; end if;
 perform pg_advisory_xact_lock(hashtext('publish-preview:'||slug));
 update pack_preview_batches set published=false where pack_slug=slug and published;
 update pack_preview_batches set published=true,status='published',preview_manifest=p_manifest where id=p_batch;
end $$;
revoke all on function public.enqueue_pack_preview(text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.claim_preview_jobs(integer) from public,anon,authenticated;
revoke all on function public.publish_pack_preview(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.enqueue_pack_preview(text,uuid,jsonb) to service_role;
grant execute on function public.claim_preview_jobs(integer) to service_role;
grant execute on function public.publish_pack_preview(uuid,jsonb) to service_role;
